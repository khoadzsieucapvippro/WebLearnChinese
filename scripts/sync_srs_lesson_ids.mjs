import fs from 'fs';

let code = fs.readFileSync('frontend/js/pages/srs-review-page.js', 'utf8');

// 1. Add backendLessonId to topic 2..10
for (let t = 2; t <= 10; t++) {
  const target = `"topicId": ${t},`;
  const repl = `"topicId": ${t},\n    "backendLessonId": ${t + 4},`;
  if (!code.includes(`"topicId": ${t},\n    "backendLessonId":`) && !code.includes(`"topicId": ${t},\r\n    "backendLessonId":`)) {
    code = code.replace(target, repl);
  }
}

// 2. Map Topic 1 vocabIds (only inside HSK1_TOPICS[0])
const mapping = {
  '请': 296,
  '请问': 505,
  '谢谢': 410,
  '不客气': 32,
  '对不起': 93,
  '没关系': 233,
  '没事': 515,
  '再见': 454,
  '你好': 518,
  '您好': 274,
  '问': 379,
  '说': 349,
  '说话': 350,
  '见': 173,
  '认识': 306,
  '好': 138,
  '对': 92,
  '不': 34,
  '行': 416,
  '吧': 5
};

// Locate Topic 1 section in code
const topic1Start = code.indexOf('"topicId": 1,');
const topic2Start = code.indexOf('"topicId": 2,');

if (topic1Start !== -1 && topic2Start !== -1) {
  let topic1Code = code.substring(topic1Start, topic2Start);
  for (const [hanzi, realId] of Object.entries(mapping)) {
    const regex = new RegExp(`"vocabId":\\s*\\d+,\\s*\\r?\\n\\s*"hanzi":\\s*"${hanzi}"`, 'g');
    topic1Code = topic1Code.replace(regex, `"vocabId": ${realId},\n        "hanzi": "${hanzi}"`);
  }
  code = code.substring(0, topic1Start) + topic1Code + code.substring(topic2Start);
}

fs.writeFileSync('frontend/js/pages/srs-review-page.js', code, 'utf8');
console.log('Successfully aligned Topic 1 vocabularies and topics 1..10 backendLessonIds in srs-review-page.js');
