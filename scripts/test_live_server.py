import urllib.request, re, sys
sys.stdout.reconfigure(encoding='utf-8')

try:
    with urllib.request.urlopen('http://localhost:3000/srs-review.html', timeout=3) as resp:
        html = resp.read().decode('utf-8')
        for group in ['hsk1', 'hsk2', 'hsk3']:
            m = re.search(r'id="deckMeta_' + group + r'"[^>]*>([^<]+)<', html)
            if m:
                print(f"localhost:3000 {group} meta: {m.group(1)}")
except Exception as e:
    print("Error:", e)

# check srs-review-page.js
try:
    with urllib.request.urlopen('http://localhost:3000/js/pages/srs-review-page.js', timeout=3) as resp:
        js = resp.read().decode('utf-8')
        m1 = len(re.findall(r'"topicId":\s*\d+', js[:js.find('export const HSK2_TOPICS')]))
        m2 = len(re.findall(r'"topicId":\s*\d+', js[js.find('export const HSK2_TOPICS'):js.find('export const HSK3_TOPICS')]))
        m3 = len(re.findall(r'"topicId":\s*\d+', js[js.find('export const HSK3_TOPICS'):js.find('export class SrsReviewController')]))
        print(f"localhost:3000 topics count in JS: HSK1={m1}, HSK2={m2}, HSK3={m3}")
except Exception as e:
    print("Error JS:", e)
