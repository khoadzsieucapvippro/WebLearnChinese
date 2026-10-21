with open('frontend/js/pages/srs-review-page.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos_hsk1 = text.find('export const HSK1_TOPICS =')
pos_hsk2 = text.find('export const HSK2_TOPICS =')
pos_hsk3 = text.find('export const HSK3_TOPICS =')
pos_next = text.find('\n/**\n * Fallback data provider', pos_hsk3)
if pos_next == -1:
    pos_next = text.find('export class SrsReviewController', pos_hsk3)

print("pos_hsk1:", pos_hsk1)
print("pos_hsk2:", pos_hsk2)
print("pos_hsk3:", pos_hsk3)
print("pos_next:", pos_next)
print("Snippet around pos_next:\n", text[pos_next-100:pos_next+200])
