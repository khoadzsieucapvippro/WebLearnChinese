import fs from 'node:fs';

// 1. Update frontend/srs-review.html
const htmlPath = 'frontend/srs-review.html';
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace('📖 Luyện đọc AI', '📖 Luyện đọc');
html = html.replace('Đang phân tích phát âm qua Gemini AI...', 'Đang phân tích phát âm...');
html = html.replace('id="readingPrivacyNotice" class="alert alert-info py-2 px-3 small mx-auto w-100 mb-3 text-start d-flex align-items-center justify-content-between"', 'id="readingPrivacyNotice" class="alert alert-info py-2 px-3 small mx-auto w-100 mb-3 text-start d-flex align-items-center justify-content-between d-none"');
html = html.replace('Thông báo quyền riêng tư AI', 'Thông báo quyền riêng tư');
html = html.replace('Thông báo Gemini AI (Gói miễn phí):', 'Thông báo Luyện đọc nội bộ:');
html = html.replace('Bản ghi âm của bạn được gửi tới Google Gemini để phân tích phát âm theo điều khoản miễn phí hiện hành. Dữ liệu âm thanh không lưu trên hệ thống.', 'Bản ghi âm của bạn được phân tích trực tiếp trên máy cục bộ (Offline Engine). Dữ liệu âm thanh không gửi ra ngoài Internet.');
html = html.replace('id="readingConfidenceBadge" class="badge bg-secondary-subtle text-secondary border"', 'id="readingConfidenceBadge" class="badge bg-secondary-subtle text-secondary border d-none"');
html = html.replace('<div class="small text-muted fst-italic mb-2">Điểm ước lượng tham khảo từ Gemini AI (Gói miễn phí)</div>', '');
html = html.replace('AI nhận diện được:', 'Nhận diện được:');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('1. frontend/srs-review.html updated.');

// 2. Update frontend/js/pages/srs-review-page.js
const pageJsPath = 'frontend/js/pages/srs-review-page.js';
let js = fs.readFileSync(pageJsPath, 'utf8');

// Always hide readingConfidenceBadge in renderReadingResult
js = js.replace(
  `      // Confidence Badge\n      if (this.dom.readingConfidenceBadge) {\n        const conf = response.confidence || 'MEDIUM';\n        const confText = conf === 'HIGH' ? 'Độ tin cậy: Cao' : (conf === 'LOW' ? 'Độ tin cậy: Thấp' : 'Độ tin cậy: Trung bình');\n        this.dom.readingConfidenceBadge.textContent = confText;\n      }`,
  `      // Confidence Badge (Hidden per design requirement)\n      if (this.dom.readingConfidenceBadge) {\n        this.dom.readingConfidenceBadge.classList.add('d-none');\n      }`
);
js = js.replace(
  `      // Confidence Badge\r\n      if (this.dom.readingConfidenceBadge) {\r\n        const conf = response.confidence || 'MEDIUM';\r\n        const confText = conf === 'HIGH' ? 'Độ tin cậy: Cao' : (conf === 'LOW' ? 'Độ tin cậy: Thấp' : 'Độ tin cậy: Trung bình');\r\n        this.dom.readingConfidenceBadge.textContent = confText;\r\n      }`,
  `      // Confidence Badge (Hidden per design requirement)\r\n      if (this.dom.readingConfidenceBadge) {\r\n        this.dom.readingConfidenceBadge.classList.add('d-none');\r\n      }`
);

// 3. Graceful handling for 'Thẻ chưa đến hạn ôn tập' in submitRating
const targetSubmitRatingError = `    } catch (err) {\r\n      console.error('[SRS Review] Review submission error:', err);\r\n      this.isSubmitting = false;\r\n      this.setRatingButtonsEnabled(true);`;
const targetSubmitRatingErrorLF = `    } catch (err) {\n      console.error('[SRS Review] Review submission error:', err);\n      this.isSubmitting = false;\n      this.setRatingButtonsEnabled(true);`;

const replacementSubmitRating = `    } catch (err) {
      console.warn('[SRS Review] Review submission response:', err);
      this.isSubmitting = false;
      this.setRatingButtonsEnabled(true);

      // Gracefully advance local session if card is not yet due (practice/early review in catalog)
      if (err?.message && err.message.includes('chưa đến hạn')) {
        console.info('[SRS Review] Thẻ chưa đến hạn ôn tập SRS, tiếp tục chuyển sang thẻ kế tiếp trong phiên học.');
        this.persistProgress('flashcard', this.currentIndex + 1);
        this.stats.totalReviewed++;
        this.stats.totalTimeSeconds += elapsedSeconds;
        if (numRating === 1) this.stats.againCount++;
        else if (numRating >= 3) this.stats.goodEasyCount++;

        this.currentIndex++;
        if (this.currentIndex >= this.sessionQueue.length) {
          this.showCompletedState();
        } else {
          this.renderCurrentCard();
        }
        return;
      }`;

if (js.includes(targetSubmitRatingError)) {
  js = js.replace(targetSubmitRatingError, replacementSubmitRating.replace(/\n/g, '\r\n'));
  console.log('2. srs-review-page.js submitRating updated (CRLF).');
} else if (js.includes(targetSubmitRatingErrorLF)) {
  js = js.replace(targetSubmitRatingErrorLF, replacementSubmitRating);
  console.log('2. srs-review-page.js submitRating updated (LF).');
} else {
  console.error('Target for submitRating not found in srs-review-page.js!');
}

fs.writeFileSync(pageJsPath, js, 'utf8');
console.log('Finished updating UI and review handling.');
