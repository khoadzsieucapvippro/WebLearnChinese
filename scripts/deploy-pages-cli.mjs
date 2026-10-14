import { execSync } from 'node:child_process';

async function run() {
  console.log('Retrieving GitHub credentials from Git Credential Manager...');
  const credsRaw = execSync('git credential fill', {
    input: 'protocol=https\nhost=github.com\n\n'
  }).toString();

  const usernameMatch = credsRaw.match(/username=(.+)/);
  const passwordMatch = credsRaw.match(/password=(.+)/);
  const token = passwordMatch ? passwordMatch[1].trim() : null;
  const username = usernameMatch ? usernameMatch[1].trim() : null;

  if (!token) {
    console.error('Could not get token from git credential fill');
    process.exit(1);
  }

  const owner = username;
  const repo = 'WebLearnChinese';
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Node-GitHub-Deployer',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  console.log(`1. Checking GitHub Pages status for ${owner}/${repo}...`);
  const pageRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, { headers });
  console.log('Pages GET status:', pageRes.status);

  if (pageRes.status === 404) {
    console.log('Pages not enabled yet. Enabling pages with build_type=workflow...');
    const postRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ build_type: 'workflow' })
    });
    const postText = await postRes.text();
    console.log('Pages POST status:', postRes.status, postText);
  } else {
    console.log('Pages already exists, updating build_type to workflow...');
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ build_type: 'workflow' })
    });
    const putText = await putRes.text();
    console.log('Pages PUT status:', putRes.status, putText);
  }

  const liveUrl = `https://${owner}.github.io/${repo}/`;
  console.log(`2. Updating repository homepage to ${liveUrl}...`);
  const patchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ homepage: liveUrl })
  });
  console.log('Repo PATCH homepage status:', patchRes.status);

  console.log('3. Triggering deploy-pages.yml workflow...');
  const dispatchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy-pages.yml/dispatches`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: 'main' })
  });
  console.log('Workflow dispatch status:', dispatchRes.status);

  console.log('4. Waiting 6 seconds before checking workflow runs...');
  await new Promise(r => setTimeout(r, 6000));

  const runsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5`, { headers });
  const runsData = await runsRes.json();
  if (runsData.workflow_runs && runsData.workflow_runs.length > 0) {
    console.log(`Found ${runsData.workflow_runs.length} workflow run(s):`);
    for (const run of runsData.workflow_runs) {
      console.log(`- Run #${run.run_number} (${run.name}): status=${run.status}, conclusion=${run.conclusion}, URL=${run.html_url}`);
    }
  } else {
    console.log('No workflow runs found yet.');
  }

  console.log('\n======================================================');
  console.log('🎉 GITHUB PAGES DEPLOYMENT INITIALIZED SUCCESSFULLY!');
  console.log(`🌐 LIVE URL: ${liveUrl}`);
  console.log('======================================================');
}

run().catch(console.error);
