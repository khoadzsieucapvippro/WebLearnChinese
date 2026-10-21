with open('frontend/js/pages/srs-review-page.js', 'r', encoding='utf-8') as f:
    text = f.read()

pos_hsk3 = text.find('export const HSK3_TOPICS =')
pos_end_hsk3 = text.find('\n];\n', pos_hsk3)
print("pos_hsk3:", pos_hsk3)
print("pos_end_hsk3:", pos_end_hsk3)
print("Snippet after pos_end_hsk3:\n", text[pos_end_hsk3:pos_end_hsk3+200])
