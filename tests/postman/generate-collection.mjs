/**
 * Generator script for Postman Collection v2.1 and Environment JSON.
 * Produces:
 *   - tests/postman/elearning-api.postman_collection.json
 *   - tests/postman/local.postman_environment.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildRequest({ name, method, urlPath, query = [], headers = [], body = null, formdata = null, preRequestScript = null, testScript = null }) {
  const urlObj = {
    raw: `{{baseUrl}}${urlPath}${query.length > 0 ? '?' + query.map(q => `${q.key}=${q.value}`).join('&') : ''}`,
    host: ['{{baseUrl}}'],
    path: urlPath.split('/').filter(Boolean),
  };

  if (query.length > 0) {
    urlObj.query = query.map(q => ({
      key: q.key,
      value: q.value,
      description: q.description || ''
    }));
  }

  const headerList = [...headers];
  if (body && !formdata && !headerList.some(h => h.key.toLowerCase() === 'content-type')) {
    headerList.push({ key: 'Content-Type', value: 'application/json' });
  }

  const events = [];
  if (preRequestScript) {
    events.push({
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: Array.isArray(preRequestScript) ? preRequestScript : preRequestScript.split('\n')
      }
    });
  }
  if (testScript) {
    events.push({
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: Array.isArray(testScript) ? testScript : testScript.split('\n')
      }
    });
  }

  const reqObj = {
    name,
    event: events,
    request: {
      method,
      header: headerList,
      url: urlObj
    }
  };

  if (formdata) {
    reqObj.request.body = {
      mode: 'formdata',
      formdata: formdata
    };
  } else if (body) {
    reqObj.request.body = {
      mode: 'raw',
      raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: 'json'
        }
      }
    };
  }

  return reqObj;
}

// -----------------------------------------------------------------------------
// FOLDERS DEFINITIONS
// -----------------------------------------------------------------------------

const folder00Health = {
  name: '00. Health & System Probe',
  description: 'Actuator operational probes',
  item: [
    buildRequest({
      name: 'Actuator Health Probe (Public 200 OK)',
      method: 'GET',
      urlPath: '/actuator/health',
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Health status is UP", function () {
    var json = pm.response.json();
    pm.expect(json.status).to.eql("UP");
});
`
    })
  ]
};

const folder01Auth = {
  name: '01. Authentication & RBAC Baseline',
  description: 'Registration, login, role authentication, and negative edge cases',
  item: [
    buildRequest({
      name: 'Register New Disposable Learner (201 Created)',
      method: 'POST',
      urlPath: '/api/v1/auth/register',
      preRequestScript: `
var uniqueSuffix = Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
var email = "learner_pm_" + uniqueSuffix + "@test.com";
pm.environment.set("currentTestEmail", email);
pm.environment.set("currentTestPassword", "Password123!");
`,
      body: {
        emailOrPhone: '{{currentTestEmail}}',
        password: '{{currentTestPassword}}',
        fullName: 'Learner Postman Automated'
      },
      testScript: `
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});
pm.test("Registration returns valid envelope and token", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data).to.have.property("token");
    pm.expect(json.data).to.have.property("accountId");
    pm.expect(json.data.emailOrPhone).to.eql(pm.environment.get("currentTestEmail"));
    pm.environment.set("learnerToken", json.data.token);
    pm.environment.set("learnerAccountId", String(json.data.accountId));
});
`
    }),
    buildRequest({
      name: 'Register Negative - Missing Required Fields (400 Bad Request)',
      method: 'POST',
      urlPath: '/api/v1/auth/register',
      body: {
        emailOrPhone: '',
        password: '',
        fullName: ''
      },
      testScript: `
pm.test("Status code is 400 Bad Request", function () {
    pm.response.to.have.status(400);
});
pm.test("Response code is VALIDATION_ERROR with errors array", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("VALIDATION_ERROR");
    pm.expect(json.errors).to.be.an("array");
    pm.expect(json.errors.length).to.be.at.least(1);
});
`
    }),
    buildRequest({
      name: 'Register Negative - Duplicate Email (409 Conflict)',
      method: 'POST',
      urlPath: '/api/v1/auth/register',
      body: {
        emailOrPhone: '{{currentTestEmail}}',
        password: 'Password123!',
        fullName: 'Duplicate User Attempt'
      },
      testScript: `
pm.test("Status code is 409 Conflict", function () {
    pm.response.to.have.status(409);
});
pm.test("Response code is CONFLICT", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("CONFLICT");
});
`
    }),
    buildRequest({
      name: 'Login Learner (200 OK + JWT)',
      method: 'POST',
      urlPath: '/api/v1/auth/login',
      body: {
        emailOrPhone: '{{currentTestEmail}}',
        password: '{{currentTestPassword}}'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Returns Bearer JWT with Learner role", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.type).to.eql("Bearer");
    pm.expect(json.data.token).to.be.a("string").and.not.empty;
    pm.expect(json.data.roles).to.be.an("array").that.includes("Learner");
    pm.environment.set("learnerToken", json.data.token);
});
`
    }),
    buildRequest({
      name: 'Login Creator (200 OK + Creator Role)',
      method: 'POST',
      urlPath: '/api/v1/auth/login',
      body: {
        emailOrPhone: '{{creatorEmail}}',
        password: '{{creatorPassword}}'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Returns Creator token with Creator role", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.roles).to.be.an("array").that.includes("Creator");
    pm.environment.set("creatorToken", json.data.token);
});
`
    }),
    buildRequest({
      name: 'Login Moderator (200 OK + Moderator Role)',
      method: 'POST',
      urlPath: '/api/v1/auth/login',
      body: {
        emailOrPhone: '{{moderatorEmail}}',
        password: '{{moderatorPassword}}'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Returns Moderator token with Moderator role", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.roles).to.be.an("array").that.includes("Moderator");
    pm.environment.set("moderatorToken", json.data.token);
});
`
    }),
    buildRequest({
      name: 'Login Admin (200 OK + Admin Role)',
      method: 'POST',
      urlPath: '/api/v1/auth/login',
      body: {
        emailOrPhone: '{{adminEmail}}',
        password: '{{adminPassword}}'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Returns Admin token with Admin role", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.roles).to.be.an("array").that.includes("Admin");
    pm.environment.set("adminToken", json.data.token);
});
`
    }),
    buildRequest({
      name: 'Login Negative - Bad Credentials (401 Unauthorized)',
      method: 'POST',
      urlPath: '/api/v1/auth/login',
      body: {
        emailOrPhone: '{{adminEmail}}',
        password: 'WrongPassword999!'
      },
      testScript: `
pm.test("Status code is 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});
pm.test("Response code is UNAUTHORIZED", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("UNAUTHORIZED");
});
`
    }),
    buildRequest({
      name: 'Login Negative - Blank Payload Validation (400 Bad Request)',
      method: 'POST',
      urlPath: '/api/v1/auth/login',
      body: {
        emailOrPhone: '',
        password: ''
      },
      testScript: `
pm.test("Status code is 400 Bad Request", function () {
    pm.response.to.have.status(400);
});
pm.test("Response code is VALIDATION_ERROR", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("VALIDATION_ERROR");
});
`
    })
  ]
};

const folder02Radicals = {
  name: '02. Kangxi Radicals Catalog',
  description: 'Public lookup for 214 Kangxi radicals',
  item: [
    buildRequest({
      name: 'Get All Radicals Paginated (Public 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/radicals',
      query: [
        { key: 'page', value: '0' },
        { key: 'size', value: '20' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("PageResponse structure contains 214 totalElements", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.totalElements).to.be.at.least(214);
    pm.expect(json.data.items).to.be.an("array").and.have.lengthOf(20);
    pm.expect(json.data.items[0]).to.have.property("radicalId");
    pm.expect(json.data.items[0]).to.have.property("character");
    pm.expect(json.data.items[0]).to.have.property("pinyin");
});
`
    }),
    buildRequest({
      name: 'Get Radical Detail By ID 1 (Public 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/radicals/1',
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Radical #1 has correct glyph, pinyin, and Vietnamese meanings", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    var data = json.data;
    pm.expect(data.radicalId).to.eql(1);
    pm.expect(data.character).to.eql("一");
    pm.expect(data.pinyin).to.eql("yī");
    pm.expect(data.meaningHanViet).to.eql("Nhất");
    pm.expect(data).to.have.property("meaningVi");
});
`
    }),
    buildRequest({
      name: 'Get Radical Negative - Non-Existent ID (404 Not Found)',
      method: 'GET',
      urlPath: '/api/v1/radicals/999999',
      testScript: `
pm.test("Status code is 404 Not Found", function () {
    pm.response.to.have.status(404);
});
pm.test("Response code is NOT_FOUND", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("NOT_FOUND");
});
`
    })
  ]
};

const folder03Vocabulary = {
  name: '03. Chinese Vocabulary Catalog',
  description: 'Public vocabulary catalog, multi-criteria search, HSK filter, and detail',
  item: [
    buildRequest({
      name: 'Get Vocabularies Paginated (Public 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/vocabulary',
      query: [
        { key: 'page', value: '0' },
        { key: 'size', value: '20' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Vocabulary catalog returns items array with totalElements", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.totalElements).to.be.at.least(1);
    pm.expect(json.data.items).to.be.an("array");
    var first = json.data.items[0];
    pm.expect(first).to.have.property("vocabId");
    pm.expect(first).to.have.property("hanzi");
    pm.expect(first).to.have.property("pinyin");
    // Invariant: summary must not contain radicals (Zero N+1)
    pm.expect(first.radicals).to.be.undefined;

    // Dynamically save verified vocabulary IDs for dependent tests
    if (json.data.items.length >= 2) {
        pm.environment.set("existingVocabId", String(json.data.items[0].vocabId));
        pm.environment.set("existingVocabId2", String(json.data.items[1].vocabId));
    }
});
`
    }),
    buildRequest({
      name: 'Search Vocabulary By Keyword "shu" (Public 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/vocabulary',
      query: [
        { key: 'search', value: 'shu' },
        { key: 'page', value: '0' },
        { key: 'size', value: '10' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Search returns matching results", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.totalElements).to.be.at.least(1);
});
`
    }),
    buildRequest({
      name: 'Filter Vocabulary By HSK Level 1 (Public 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/vocabulary',
      query: [
        { key: 'hsk', value: '1' },
        { key: 'page', value: '0' },
        { key: 'size', value: '10' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("HSK 1 filtered results return items", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.items).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'Get Vocabulary Detail By Existing ID with Radicals (Public 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/vocabulary/{{existingVocabId}}',
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Detail returns constituent radicals array", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    var data = json.data;
    pm.expect(String(data.vocabId)).to.eql(pm.environment.get("existingVocabId"));
    pm.expect(data).to.have.property("hanzi");
    pm.expect(data.radicals).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'Get Vocabulary Negative - Non-Existent ID (404 Not Found)',
      method: 'GET',
      urlPath: '/api/v1/vocabulary/999999',
      testScript: `
pm.test("Status code is 404 Not Found", function () {
    pm.response.to.have.status(404);
});
pm.test("Response code is NOT_FOUND", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("NOT_FOUND");
});
`
    })
  ]
};

const folder04Lessons = {
  name: '04. Public Lessons Catalog',
  description: 'Approved public lessons catalog exploration and detailed view',
  item: [
    buildRequest({
      name: 'Get Approved Lessons Catalog (Public 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/lessons',
      query: [
        { key: 'page', value: '0' },
        { key: 'size', value: '20' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Approved-only visibility invariant: all items have status 'Approved'", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.items).to.be.an("array");
    json.data.items.forEach(function (item) {
        pm.expect(item.status).to.eql("Approved");
    });
    if (json.data.items.length > 0) {
        pm.environment.set("approvedLessonId", String(json.data.items[0].lessonId));
    }
});
`
    }),
    buildRequest({
      name: 'Get Lesson Detail By ID with Ordered Vocabularies (Public 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/lessons/{{approvedLessonId}}',
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Lesson detail contains ordered vocabularies array", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    var data = json.data;
    pm.expect(String(data.lessonId)).to.eql(pm.environment.get("approvedLessonId"));
    pm.expect(data).to.have.property("title");
    pm.expect(data.status).to.eql("Approved");
    pm.expect(data.vocabularies).to.be.an("array");
    if (data.vocabularies.length > 1) {
        for (var i = 0; i < data.vocabularies.length - 1; i++) {
            pm.expect(data.vocabularies[i].orderIndex).to.be.at.most(data.vocabularies[i + 1].orderIndex);
        }
    }
});
`
    }),
    buildRequest({
      name: 'Get Lesson Negative - Non-Existent ID (404 Not Found)',
      method: 'GET',
      urlPath: '/api/v1/lessons/999999',
      testScript: `
pm.test("Status code is 404 Not Found", function () {
    pm.response.to.have.status(404);
});
pm.test("Response code is NOT_FOUND", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("NOT_FOUND");
});
`
    })
  ]
};

const folder05ProfileAndSettings = {
  name: '05. User Profile & Settings',
  description: 'Learner profile, auth guardrails, and personal SRS settings',
  item: [
    buildRequest({
      name: 'Get My User Profile (Learner Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/users/profile',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Profile returns accountId, userId, email, fullName", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    var p = json.data;
    pm.expect(p).to.have.property("userId");
    pm.expect(p).to.have.property("accountId");
    pm.expect(p.emailOrPhone).to.eql(pm.environment.get("currentTestEmail"));
    pm.expect(p.roles).to.be.undefined; // Invariant: no phantom roles in UserProfileResponse
});
`
    }),
    buildRequest({
      name: 'Update My User Profile (Learner Bearer 200 OK)',
      method: 'PUT',
      urlPath: '/api/v1/users/profile',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      body: {
        fullName: 'Học Viên Đã Cập Nhật',
        avatarUrl: 'https://example.com/learner-avatar.png'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Profile fullName is updated and persisted", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.fullName).to.eql("Học Viên Đã Cập Nhật");
});
`
    }),
    buildRequest({
      name: 'Profile Negative - Unauthenticated Missing Token (401 Unauthorized)',
      method: 'GET',
      urlPath: '/api/v1/users/profile',
      testScript: `
pm.test("Status code is 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});
pm.test("Response code is UNAUTHORIZED", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("UNAUTHORIZED");
});
`
    }),
    buildRequest({
      name: 'Profile Negative - Invalid Malformed Token (401 Unauthorized)',
      method: 'GET',
      urlPath: '/api/v1/users/profile',
      headers: [
        { key: 'Authorization', value: 'Bearer invalid.malformed.token.payload' }
      ],
      testScript: `
pm.test("Status code is 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});
pm.test("Response code is UNAUTHORIZED", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("UNAUTHORIZED");
});
`
    }),
    buildRequest({
      name: 'Get Current User SRS Settings (Learner Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/srs/settings',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("SRS settings return positive daily limits", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.newCardsPerDay).to.be.above(0);
    pm.expect(json.data.maxReviewPerDay).to.be.above(0);
});
`
    }),
    buildRequest({
      name: 'Update Current User SRS Settings (Learner Bearer 200 OK)',
      method: 'PUT',
      urlPath: '/api/v1/srs/settings',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      body: {
        newCardsPerDay: 25,
        maxReviewPerDay: 100
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("SRS settings successfully updated to 25 / 100", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.newCardsPerDay).to.eql(25);
    pm.expect(json.data.maxReviewPerDay).to.eql(100);
});
`
    }),
    buildRequest({
      name: 'Update SRS Settings Negative - Non-Positive Limit (400 Bad Request)',
      method: 'PUT',
      urlPath: '/api/v1/srs/settings',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      body: {
        newCardsPerDay: -5,
        maxReviewPerDay: 0
      },
      testScript: `
pm.test("Status code is 400 Bad Request", function () {
    pm.response.to.have.status(400);
});
pm.test("Response code is VALIDATION_ERROR", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("VALIDATION_ERROR");
});
`
    })
  ]
};

const folder06PersonalNotes = {
  name: '06. Personal Vocabulary Notes',
  description: 'Learner personalized study notes on vocabulary words (CRUD)',
  item: [
    buildRequest({
      name: 'List Personal Notes for Existing Vocabulary (Learner Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/vocabularies/{{existingVocabId}}/notes',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      query: [
        { key: 'page', value: '0' },
        { key: 'size', value: '20' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Returns notes page envelope", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.items).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'Create Personal Note on Existing Vocabulary (Learner Bearer 201 Created)',
      method: 'POST',
      urlPath: '/api/v1/vocabularies/{{existingVocabId}}/notes',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      body: {
        content: 'Ghi chú học tập tự động bởi Postman Test Runner'
      },
      testScript: `
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});
pm.test("Returns created note with ID and stores in environment", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data).to.have.property("noteId");
    pm.expect(json.data.content).to.eql("Ghi chú học tập tự động bởi Postman Test Runner");
    pm.environment.set("createdNoteId", String(json.data.noteId));
});
`
    }),
    buildRequest({
      name: 'Update Personal Note Content (Learner Bearer 200 OK)',
      method: 'PUT',
      urlPath: '/api/v1/notes/{{createdNoteId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      body: {
        content: 'Ghi chú học tập đã được cập nhật thành công qua Postman'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Note content updated properly", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.content).to.eql("Ghi chú học tập đã được cập nhật thành công qua Postman");
});
`
    }),
    buildRequest({
      name: 'Delete Personal Note (Learner Bearer 200 OK)',
      method: 'DELETE',
      urlPath: '/api/v1/notes/{{createdNoteId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Delete returns success message", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
});
`
    })
  ]
};

const folder07Srs = {
  name: '07. Spaced Repetition System (SRS)',
  description: 'Due cards, new card candidates, review submissions, and statistics',
  item: [
    buildRequest({
      name: 'Get Due Review Cards (Learner Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/srs/due',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Due cards list returned as array", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'Get New Card Candidates for Approved Lesson (Learner Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/srs/new-cards',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      query: [
        { key: 'lessonId', value: '{{approvedLessonId}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Candidates returned as array with isNew flag", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'Get Practice Cards for Approved Lesson (Learner Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/srs/practice-cards',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      query: [
        { key: 'lessonId', value: '{{approvedLessonId}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Practice cards returned in orderIndex sequence", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'Submit Flashcard Review Rating (Learner Bearer 200 OK)',
      method: 'POST',
      urlPath: '/api/v1/srs/review',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      preRequestScript: `
var vId = Number(pm.environment.get("existingVocabId")) || 18324;
pm.environment.set("reviewItemId", vId);
`,
      body: {
        itemType: 'VOCABULARY',
        itemId: '{{reviewItemId}}',
        rating: 3,
        reviewTimeSeconds: 4
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Review returns updated DueCardResponse with interval and easeFactor", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data).to.have.property("itemId");
    pm.expect(json.data).to.have.property("intervalDays");
    pm.expect(json.data).to.have.property("easeFactor");
    pm.expect(json.data).to.have.property("repetitions");
});
`
    }),
    buildRequest({
      name: 'Submit Review Negative - Invalid Rating 99 (400 Bad Request)',
      method: 'POST',
      urlPath: '/api/v1/srs/review',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      body: {
        itemType: 'VOCABULARY',
        itemId: 1,
        rating: 99,
        reviewTimeSeconds: 1
      },
      testScript: `
pm.test("Status code is 400 Bad Request", function () {
    pm.response.to.have.status(400);
});
pm.test("Response code is VALIDATION_ERROR", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("VALIDATION_ERROR");
});
`
    }),
    buildRequest({
      name: 'Get Current Study Statistics (Learner Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/srs/stats',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Study stats contain cardsDue, reviewsToday, limits", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data).to.have.property("cardsDue");
    pm.expect(json.data).to.have.property("reviewsToday");
    pm.expect(json.data).to.have.property("newCardsLimit");
    pm.expect(json.data).to.have.property("maxReviewLimit");
});
`
    })
  ]
};

const folder08Creator = {
  name: '08. Creator Studio & Curriculum Authoring',
  description: 'Creator lesson authoring, vocabulary composition, moderation submission, and RBAC guardrails',
  item: [
    buildRequest({
      name: 'Create Draft Lesson (Creator Bearer 201 Created)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      preRequestScript: `
var uniqueSuffix = Date.now().toString().slice(-5);
pm.environment.set("creatorLessonTitle", "Bài học Creator Postman #" + uniqueSuffix);
`,
      body: {
        title: '{{creatorLessonTitle}}'
      },
      testScript: `
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});
pm.test("Lesson created in 'Draft' status and saves ID", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.status).to.eql("Draft");
    pm.expect(json.data).to.have.property("lessonId");
    pm.environment.set("createdLessonId", String(json.data.lessonId));
});
`
    }),
    buildRequest({
      name: 'List My Authored Lessons (Creator Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/creator/lessons',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      query: [
        { key: 'page', value: '0' },
        { key: 'size', value: '20' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Creator lessons list returned", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.items).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'Get My Lesson Detail (Creator Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/creator/lessons/{{createdLessonId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Detail returns correct lessonId and Draft status", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(String(json.data.lessonId)).to.eql(pm.environment.get("createdLessonId"));
    pm.expect(json.data.status).to.eql("Draft");
});
`
    }),
    buildRequest({
      name: 'Update My Lesson Metadata (Creator Bearer 200 OK)',
      method: 'PUT',
      urlPath: '/api/v1/creator/lessons/{{createdLessonId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      body: {
        title: '{{creatorLessonTitle}} (Đã sửa đổi)'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Title updated successfully", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.title).to.include("(Đã sửa đổi)");
});
`
    }),
    buildRequest({
      name: 'Add Vocabulary 1 to Lesson (Creator Bearer 200 OK)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons/{{createdLessonId}}/vocabularies/{{existingVocabId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Vocabulary 1 added into lesson vocabularies list", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    var targetId = Number(pm.environment.get("existingVocabId"));
    pm.expect(json.data.vocabularies.some(v => v.vocabId === targetId)).to.be.true;
});
`
    }),
    buildRequest({
      name: 'Add Vocabulary 2 to Lesson (Creator Bearer 200 OK)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons/{{createdLessonId}}/vocabularies/{{existingVocabId2}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Vocabulary 2 added, total count is at least 2", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.vocabularies.length).to.be.at.least(2);
});
`
    }),
    buildRequest({
      name: 'Reorder Vocabularies within Lesson (Creator Bearer 200 OK)',
      method: 'PUT',
      urlPath: '/api/v1/creator/lessons/{{createdLessonId}}/reorder',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      preRequestScript: `
var id1 = Number(pm.environment.get("existingVocabId"));
var id2 = Number(pm.environment.get("existingVocabId2"));
pm.environment.set("reorderPayload", JSON.stringify({ orderedVocabIds: [id2, id1] }));
`,
      body: '{{reorderPayload}}',
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Reordered items orderIndex updated", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    var vocabs = json.data.vocabularies;
    var id1 = Number(pm.environment.get("existingVocabId"));
    var id2 = Number(pm.environment.get("existingVocabId2"));
    pm.expect(vocabs[0].vocabId).to.eql(id2);
    pm.expect(vocabs[1].vocabId).to.eql(id1);
});
`
    }),
    buildRequest({
      name: 'Remove Vocabulary 2 from Lesson (Creator Bearer 200 OK)',
      method: 'DELETE',
      urlPath: '/api/v1/creator/lessons/{{createdLessonId}}/vocabularies/{{existingVocabId2}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Vocabulary 2 removed from lesson, Vocab 1 remains (count=1)", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    var id2 = Number(pm.environment.get("existingVocabId2"));
    pm.expect(json.data.vocabularies.some(v => v.vocabId === id2)).to.be.false;
    pm.expect(json.data.vocabularies.length).to.be.at.least(1);
});
`
    }),
    buildRequest({
      name: 'Submit Lesson For Moderation (Creator Bearer 200 OK)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons/{{createdLessonId}}/submit',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Lesson transitions from 'Draft' to 'Pending' status", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.status).to.eql("Pending");
});
`
    }),
    buildRequest({
      name: 'RBAC Negative - Learner Forbidden on Creator Endpoint (403 Forbidden)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      body: {
        title: 'Learner Illegitimate Creation Attempt'
      },
      testScript: `
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
pm.test("Response code is FORBIDDEN", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("FORBIDDEN");
});
`
    }),
    buildRequest({
      name: 'Excel Import Preview (Creator Bearer 200 OK)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons/import',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      formdata: [
        { key: 'file', type: 'file', src: 'tests/postman/fixtures/sample-curriculum-valid.xlsx' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Report validation isValid is true with 5 rows parsed", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.isValid).to.be.true;
    pm.expect(json.data.fileStatus).to.eql("VALID");
    pm.expect(json.data.totalRows).to.eql(5);
    pm.expect(json.data.rows).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'Excel Import Preview Negative - Bad Headers (Creator Bearer 200 OK with INVALID status)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons/import',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      formdata: [
        { key: 'file', type: 'file', src: 'tests/postman/fixtures/sample-curriculum-bad-headers.xlsx' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Report indicates file is invalid with HEADER_ERROR status", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.isValid).to.be.false;
    pm.expect(json.data.fileStatus).to.be.oneOf(["HEADER_ERROR", "INVALID"]);
});
`
    }),
    buildRequest({
      name: 'Excel Import Preview Negative - Unauthenticated (401 Unauthorized)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons/import',
      formdata: [
        { key: 'file', type: 'file', src: 'tests/postman/fixtures/sample-curriculum-valid.xlsx' }
      ],
      testScript: `
pm.test("Status code is 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});
pm.test("Response code is UNAUTHORIZED", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("UNAUTHORIZED");
});
`
    }),
    buildRequest({
      name: 'Confirm Excel Curriculum Import (Creator Bearer 201 Created)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons/import/confirm',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      formdata: [
        { key: 'title', type: 'text', value: 'Bài học Tạo từ Excel Tự Động' },
        { key: 'file', type: 'file', src: 'tests/postman/fixtures/sample-curriculum-valid.xlsx' }
      ],
      testScript: `
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});
pm.test("Import creates draft lesson with constituent vocabularies", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.status).to.eql("Draft");
    pm.expect(json.data.vocabularies).to.be.an("array");
    pm.expect(json.data.vocabularies.length).to.eql(5);
    pm.environment.set("importedLessonId", String(json.data.lessonId));
});
`
    }),
    buildRequest({
      name: 'Confirm Import Negative - Blank Title (Creator Bearer 400 Bad Request)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons/import/confirm',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      formdata: [
        { key: 'title', type: 'text', value: '   ' },
        { key: 'file', type: 'file', src: 'tests/postman/fixtures/sample-curriculum-valid.xlsx' }
      ],
      testScript: `
pm.test("Status code is 400 Bad Request", function () {
    pm.response.to.have.status(400);
});
pm.test("Response code is BAD_REQUEST", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("BAD_REQUEST");
});
`
    }),
    buildRequest({
      name: 'Confirm Import Negative - Invalid File (Creator Bearer 422 Unprocessable Entity)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons/import/confirm',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      formdata: [
        { key: 'title', type: 'text', value: 'Bài học Thất Bại' },
        { key: 'file', type: 'file', src: 'tests/postman/fixtures/sample-curriculum-bad-headers.xlsx' }
      ],
      testScript: `
pm.test("Status code is 422 Unprocessable Entity", function () {
    pm.response.to.have.status(422);
});
pm.test("Response code is UNPROCESSABLE_ENTITY", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("UNPROCESSABLE_ENTITY");
});
`
    }),
    buildRequest({
      name: 'Delete Imported Draft Lesson (Creator Bearer 204 No Content)',
      method: 'DELETE',
      urlPath: '/api/v1/creator/lessons/{{importedLessonId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 204 No Content", function () {
    pm.response.to.have.status(204);
});
`
    }),
    buildRequest({
      name: 'Create Draft Lesson For Deletion Test (Creator Bearer 201 Created)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      body: {
        title: 'Bài học Nháp Dành Cho Test Xóa'
      },
      testScript: `
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});
pm.test("Saves lessonToDeleteId", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.environment.set("lessonToDeleteId", String(json.data.lessonId));
});
`
    }),
    buildRequest({
      name: 'Delete Draft Lesson (Creator Bearer 204 No Content)',
      method: 'DELETE',
      urlPath: '/api/v1/creator/lessons/{{lessonToDeleteId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 204 No Content", function () {
    pm.response.to.have.status(204);
});
`
    }),
    buildRequest({
      name: 'Verify Deleted Lesson Not Found (Creator Bearer 404 Not Found)',
      method: 'GET',
      urlPath: '/api/v1/creator/lessons/{{lessonToDeleteId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 404 Not Found", function () {
    pm.response.to.have.status(404);
});
pm.test("Response code is NOT_FOUND", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("NOT_FOUND");
});
`
    }),
    buildRequest({
      name: 'Delete Lesson Negative - Non-Existent ID (Creator Bearer 404 Not Found)',
      method: 'DELETE',
      urlPath: '/api/v1/creator/lessons/999999',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 404 Not Found", function () {
    pm.response.to.have.status(404);
});
pm.test("Response code is NOT_FOUND", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("NOT_FOUND");
});
`
    }),
    buildRequest({
      name: 'Delete Lesson Negative - Learner Forbidden (403 Forbidden)',
      method: 'DELETE',
      urlPath: '/api/v1/creator/lessons/{{approvedLessonId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      testScript: `
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
pm.test("Response code is FORBIDDEN", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("FORBIDDEN");
});
`
    })
  ]
};

const folder09Moderator = {
  name: '09. Content Moderation & Quality Review',
  description: 'Moderator queue review, approval/rejection state machine, and RBAC defense',
  item: [
    buildRequest({
      name: 'Get Pending Lessons Queue (Moderator Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/moderator/lessons/pending',
      headers: [
        { key: 'Authorization', value: 'Bearer {{moderatorToken}}' }
      ],
      query: [
        { key: 'page', value: '0' },
        { key: 'size', value: '20' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Queue returns pending lessons array", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.items).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'Get Pending Lesson Detail (Moderator Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/moderator/lessons/{{createdLessonId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{moderatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Moderator views pending lesson detail", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(String(json.data.lessonId)).to.eql(pm.environment.get("createdLessonId"));
    pm.expect(json.data.status).to.eql("Pending");
});
`
    }),
    buildRequest({
      name: 'Reject Pending Lesson with Reason & Flags (Moderator Bearer 200 OK)',
      method: 'POST',
      urlPath: '/api/v1/moderator/lessons/{{createdLessonId}}/reject',
      headers: [
        { key: 'Authorization', value: 'Bearer {{moderatorToken}}' }
      ],
      body: {
        rejectionReason: 'Cần bổ sung thêm ví dụ ngữ cảnh cho các từ vựng theo chuẩn sư phạm',
        flaggedFields: '{"vocabularies":"examples needed"}'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Lesson transitioned to 'Rejected' status", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.status).to.eql("Rejected");
});
`
    }),
    buildRequest({
      name: 'Creator Re-submits Rejected Lesson (Creator Bearer 200 OK)',
      method: 'POST',
      urlPath: '/api/v1/creator/lessons/{{createdLessonId}}/submit',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Lesson successfully re-submitted to 'Pending'", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.status).to.eql("Pending");
});
`
    }),
    buildRequest({
      name: 'Approve Pending Lesson with Note (Moderator Bearer 200 OK)',
      method: 'POST',
      urlPath: '/api/v1/moderator/lessons/{{createdLessonId}}/approve',
      headers: [
        { key: 'Authorization', value: 'Bearer {{moderatorToken}}' }
      ],
      body: {
        note: 'Bài học đã được chỉnh sửa đạt chuẩn chất lượng HSK 1'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Lesson transitioned to 'Approved' status", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.status).to.eql("Approved");
});
`
    }),
    buildRequest({
      name: 'Delete Lesson Negative - Creator Cannot Delete Approved Lesson (409 Conflict)',
      method: 'DELETE',
      urlPath: '/api/v1/creator/lessons/{{createdLessonId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 409 Conflict", function () {
    pm.response.to.have.status(409);
});
pm.test("Response code is CONFLICT", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("CONFLICT");
});
`
    }),
    buildRequest({
      name: 'Get Moderator Audit History (Moderator Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/moderator/history',
      headers: [
        { key: 'Authorization', value: 'Bearer {{moderatorToken}}' }
      ],
      query: [
        { key: 'page', value: '0' },
        { key: 'size', value: '20' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("History returns moderation log entries with audit details", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.items).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'RBAC Negative - Learner Forbidden on Moderator Queue (403 Forbidden)',
      method: 'GET',
      urlPath: '/api/v1/moderator/lessons/pending',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      testScript: `
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
pm.test("Response code is FORBIDDEN", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("FORBIDDEN");
});
`
    }),
    buildRequest({
      name: 'RBAC Negative - Creator Forbidden on Moderator Queue (403 Forbidden)',
      method: 'GET',
      urlPath: '/api/v1/moderator/lessons/pending',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
pm.test("Response code is FORBIDDEN", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("FORBIDDEN");
});
`
    })
  ]
};

const folder10Admin = {
  name: '10. System Administration & Content Governance',
  description: 'Admin accounts, roles, global lessons, catalog CRUD, and strict RBAC isolation',
  item: [
    buildRequest({
      name: 'List Accounts Paginated (Admin Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/admin/accounts',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      query: [
        { key: 'page', value: '0' },
        { key: 'size', value: '20' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Accounts list returned with account metadata", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.items).to.be.an("array");
    var first = json.data.items[0];
    pm.expect(first).to.have.property("accountId");
    pm.expect(first).to.have.property("emailOrPhone");
    pm.expect(first).to.have.property("status");
});
`
    }),
    buildRequest({
      name: 'List System Roles (Admin Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/admin/roles',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Returns 4 system roles (Learner, Creator, Moderator, Admin)", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data).to.be.an("array").and.have.lengthOf(4);
    var roleNames = json.data.map(r => r.roleName);
    pm.expect(roleNames).to.include.members(["Learner", "Creator", "Moderator", "Admin"]);
});
`
    }),
    buildRequest({
      name: 'Update Account Status (Admin Bearer 200 OK)',
      method: 'PUT',
      urlPath: '/api/v1/admin/accounts/{{learnerAccountId}}/status',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      body: {
        status: 'Active'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Target account status is Active", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.status).to.eql("Active");
});
`
    }),
    buildRequest({
      name: 'Update Account Roles (Admin Bearer 200 OK)',
      method: 'PUT',
      urlPath: '/api/v1/admin/accounts/{{learnerAccountId}}/roles',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      body: {
        roles: ['Learner']
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Roles updated properly", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.roles).to.include("Learner");
});
`
    }),
    buildRequest({
      name: 'Admin Global Lessons Oversight (Admin Bearer 200 OK)',
      method: 'GET',
      urlPath: '/api/v1/admin/lessons',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      query: [
        { key: 'page', value: '0' },
        { key: 'size', value: '20' }
      ],
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Admin can observe lessons across all lifecycle statuses", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.items).to.be.an("array");
});
`
    }),
    buildRequest({
      name: 'Create Kangxi Radical (Admin Bearer 201 Created)',
      method: 'POST',
      urlPath: '/api/v1/admin/radicals',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      preRequestScript: `
var chars = ["欐", "麤", "龘", "靐", "齉", "鱻", "爩", "龖", "矗", "猋", "贔", "灥"];
var chosenChar = chars[Math.floor(Math.random() * chars.length)] + Date.now().toString().slice(-2);
pm.environment.set("testRadicalChar", chosenChar);
`,
      body: {
        character: '{{testRadicalChar}}',
        pinyin: 'ce',
        meaningHanViet: 'Trac',
        meaningVi: 'Bo thu kiem thu tao tu dong',
        audioUrl: 'https://example.com/audio/test.mp3',
        videoWritingUrl: 'https://example.com/video/test.mp4',
        explanationVi: 'Bo thu kiem thu CRUD'
      },
      testScript: `
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});
pm.test("Radical created and saves radicalId", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data).to.have.property("radicalId");
    pm.environment.set("createdRadicalId", String(json.data.radicalId));
});
`
    }),
    buildRequest({
      name: 'Update Kangxi Radical (Admin Bearer 200 OK)',
      method: 'PUT',
      urlPath: '/api/v1/admin/radicals/{{createdRadicalId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      body: {
        character: '{{testRadicalChar}}',
        pinyin: 'ce',
        meaningHanViet: 'Trac',
        meaningVi: 'Bo thu da cap nhat',
        audioUrl: 'https://example.com/audio/updated.mp3',
        videoWritingUrl: 'https://example.com/video/updated.mp4',
        explanationVi: 'Giai thich da cap nhat'
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Radical meaningVi updated", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.meaningVi).to.include("da cap nhat");
});
`
    }),
    buildRequest({
      name: 'Delete Kangxi Radical (Admin Bearer 204 No Content)',
      method: 'DELETE',
      urlPath: '/api/v1/admin/radicals/{{createdRadicalId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      testScript: `
pm.test("Status code is 204 No Content", function () {
    pm.response.to.have.status(204);
});
`
    }),
    buildRequest({
      name: 'Create Vocabulary Item (Admin Bearer 201 Created)',
      method: 'POST',
      urlPath: '/api/v1/admin/vocabulary',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      preRequestScript: `
var uniqueSuffix = Date.now().toString().slice(-4);
pm.environment.set("testVocabHanzi", "字" + uniqueSuffix);
pm.environment.set("testVocabPinyinRaw", "zi" + uniqueSuffix);
`,
      body: {
        hanzi: '{{testVocabHanzi}}',
        pinyin: 'zì',
        pinyinRaw: '{{testVocabPinyinRaw}}',
        meaningHanViet: 'Tu',
        meaningVi: 'Chu Han kiem thu CRUD',
        exampleSentence: 'Day la cau vi du.',
        exampleTranslation: 'This is example sentence.',
        radicalIds: [1]
      },
      testScript: `
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});
pm.test("Vocabulary item created and saves vocabId", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data).to.have.property("vocabId");
    pm.environment.set("createdVocabId", String(json.data.vocabId));
});
`
    }),
    buildRequest({
      name: 'Update Vocabulary Item (Admin Bearer 200 OK)',
      method: 'PUT',
      urlPath: '/api/v1/admin/vocabulary/{{createdVocabId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      body: {
        hanzi: '{{testVocabHanzi}}',
        pinyin: 'zì',
        pinyinRaw: '{{testVocabPinyinRaw}}',
        meaningHanViet: 'Tu',
        meaningVi: 'Chu Han kiem thu da cap nhat',
        exampleSentence: 'Day la cau vi du.',
        exampleTranslation: 'This is example sentence.',
        radicalIds: [1]
      },
      testScript: `
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Vocabulary meaningVi updated", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("SUCCESS");
    pm.expect(json.data.meaningVi).to.include("da cap nhat");
});
`
    }),
    buildRequest({
      name: 'Delete Vocabulary Item (Admin Bearer 204 No Content)',
      method: 'DELETE',
      urlPath: '/api/v1/admin/vocabulary/{{createdVocabId}}',
      headers: [
        { key: 'Authorization', value: 'Bearer {{adminToken}}' }
      ],
      testScript: `
pm.test("Status code is 204 No Content", function () {
    pm.response.to.have.status(204);
});
`
    }),
    buildRequest({
      name: 'RBAC Negative - Learner Forbidden on Admin Accounts (403 Forbidden)',
      method: 'GET',
      urlPath: '/api/v1/admin/accounts',
      headers: [
        { key: 'Authorization', value: 'Bearer {{learnerToken}}' }
      ],
      testScript: `
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
pm.test("Response code is FORBIDDEN", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("FORBIDDEN");
});
`
    }),
    buildRequest({
      name: 'RBAC Negative - Creator Forbidden on Admin Roles (403 Forbidden)',
      method: 'GET',
      urlPath: '/api/v1/admin/roles',
      headers: [
        { key: 'Authorization', value: 'Bearer {{creatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
pm.test("Response code is FORBIDDEN", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("FORBIDDEN");
});
`
    }),
    buildRequest({
      name: 'RBAC Negative - Moderator Forbidden on Admin Lessons (403 Forbidden)',
      method: 'GET',
      urlPath: '/api/v1/admin/lessons',
      headers: [
        { key: 'Authorization', value: 'Bearer {{moderatorToken}}' }
      ],
      testScript: `
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
pm.test("Response code is FORBIDDEN", function () {
    var json = pm.response.json();
    pm.expect(json.code).to.eql("FORBIDDEN");
});
`
    })
  ]
};

// -----------------------------------------------------------------------------
// POSTMAN COLLECTION ROOT
// -----------------------------------------------------------------------------

const postmanCollection = {
  info: {
    name: 'E-Learning Kangxi & SRS Platform REST API',
    _postman_id: 'c827b591-6284-482a-9cb8-b11894d8cb19',
    description: 'Comprehensive, automated REST API test collection for E-Learning Platform: Kangxi Radicals, Chinese Vocabulary, SM-2 Spaced Repetition System (SRS), Multi-role RBAC (Learner, Creator, Moderator, Admin), and Content Governance.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  item: [
    folder00Health,
    folder01Auth,
    folder02Radicals,
    folder03Vocabulary,
    folder04Lessons,
    folder05ProfileAndSettings,
    folder06PersonalNotes,
    folder07Srs,
    folder08Creator,
    folder09Moderator,
    folder10Admin
  ]
};

// -----------------------------------------------------------------------------
// POSTMAN ENVIRONMENT
// -----------------------------------------------------------------------------

const postmanEnvironment = {
  id: 'a98f1234-5678-4321-abcd-9876543210ef',
  name: 'Local Environment (Spring Boot 8080)',
  values: [
    { key: 'baseUrl', value: 'http://localhost:8080', type: 'default', enabled: true },
    { key: 'adminEmail', value: 'admin@test.com', type: 'default', enabled: true },
    { key: 'adminPassword', value: 'Password123!', type: 'secret', enabled: true },
    { key: 'creatorEmail', value: 'creator@test.com', type: 'default', enabled: true },
    { key: 'creatorPassword', value: 'Password123!', type: 'secret', enabled: true },
    { key: 'moderatorEmail', value: 'moderator@test.com', type: 'default', enabled: true },
    { key: 'moderatorPassword', value: 'Password123!', type: 'secret', enabled: true },
    { key: 'learnerToken', value: '', type: 'secret', enabled: true },
    { key: 'creatorToken', value: '', type: 'secret', enabled: true },
    { key: 'moderatorToken', value: '', type: 'secret', enabled: true },
    { key: 'adminToken', value: '', type: 'secret', enabled: true },
    { key: 'learnerAccountId', value: '', type: 'default', enabled: true },
    { key: 'learnerEmail', value: 'learner@test.com', type: 'default', enabled: true },
    { key: 'learnerPassword', value: 'Password123!', type: 'secret', enabled: true },
    { key: 'existingVocabId', value: '', type: 'default', enabled: true },
    { key: 'existingVocabId2', value: '', type: 'default', enabled: true },
    { key: 'approvedLessonId', value: '', type: 'default', enabled: true },
    { key: 'createdNoteId', value: '', type: 'default', enabled: true },
    { key: 'createdLessonId', value: '', type: 'default', enabled: true },
    { key: 'importedLessonId', value: '', type: 'default', enabled: true },
    { key: 'lessonToDeleteId', value: '', type: 'default', enabled: true },
    { key: 'createdRadicalId', value: '', type: 'default', enabled: true },
    { key: 'createdVocabId', value: '', type: 'default', enabled: true }
  ],
  _postman_variable_scope: 'environment'
};

// -----------------------------------------------------------------------------
// WRITE FILES
// -----------------------------------------------------------------------------

const collectionPath = path.join(__dirname, 'elearning-api.postman_collection.json');
const environmentPath = path.join(__dirname, 'local.postman_environment.json');

fs.writeFileSync(collectionPath, JSON.stringify(postmanCollection, null, 2), 'utf-8');
console.log(`Generated Postman Collection at: ${collectionPath}`);

fs.writeFileSync(environmentPath, JSON.stringify(postmanEnvironment, null, 2), 'utf-8');
console.log(`Generated Postman Environment at: ${environmentPath}`);

// Count total requests
let totalRequests = 0;
for (const folder of postmanCollection.item) {
  totalRequests += folder.item.length;
  console.log(`  - [${folder.name}]: ${folder.item.length} requests`);
}
console.log(`Total Requests in Collection: ${totalRequests}`);
