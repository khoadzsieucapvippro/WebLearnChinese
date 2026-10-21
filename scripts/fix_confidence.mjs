import fs from 'node:fs';
const file = 'frontend/js/pages/srs-review-page.js';
let content = fs.readFileSync(file, 'utf8');

const targetLF = "      // Confidence Badge (Hidden per design requirement)\n      if (this.dom.readingConfidenceBadge) {\n        this.dom.readingConfidenceBadge.classList.add('d-none');\n      }";
const targetCRLF = "      // Confidence Badge (Hidden per design requirement)\r\n      if (this.dom.readingConfidenceBadge) {\r\n        this.dom.readingConfidenceBadge.classList.add('d-none');\r\n      }";

const replacement = `      // Confidence Badge
      if (this.dom.readingConfidenceBadge) {
        const conf = response.confidence || 'MEDIUM';
        const confText = conf === 'HIGH' ? 'Độ tin cậy: Cao' : (conf === 'LOW' ? 'Độ tin cậy: Thấp' : 'Độ tin cậy: Trung bình');
        this.dom.readingConfidenceBadge.textContent = confText;
        this.dom.readingConfidenceBadge.classList.add('d-none'); // Hidden from UI per user request
      }`;

if (content.includes(targetCRLF)) {
  content = content.replace(targetCRLF, replacement.replace(/\n/g, '\r\n'));
  console.log('Replaced confidence badge (CRLF)');
} else if (content.includes(targetLF)) {
  content = content.replace(targetLF, replacement);
  console.log('Replaced confidence badge (LF)');
} else {
  console.error('Target not found!');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');
