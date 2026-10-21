import sys

with open('frontend/js/api/demo-fallback-engine.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace version 6 with 7
old_ver = "const CURRENT_DATASET_VERSION = 6;"
new_ver = "const CURRENT_DATASET_VERSION = 7;"

if old_ver not in content:
    print("Could not find CURRENT_DATASET_VERSION = 6")
    sys.exit(1)

content = content.replace(old_ver, new_ver, 1)

# Enhance getData() to preserve existing cards/reviews/notes if upgrading
old_block = """    if (saved && saved.schemaVersion === CURRENT_DATASET_VERSION && Array.isArray(saved.radicals) && saved.radicals.length === 214) {
      this._data = saved;
    } else {
      this._data = {
        schemaVersion: CURRENT_DATASET_VERSION,
        accounts: JSON.parse(JSON.stringify(SEED_ACCOUNTS)),
        radicals: JSON.parse(JSON.stringify(SEED_RADICALS)),
        vocabulary: JSON.parse(JSON.stringify(SEED_VOCABULARY)),
        lessons: JSON.parse(JSON.stringify(SEED_LESSONS)),
        srsSettings: { ...SEED_SRS_SETTINGS },
        srsCards: JSON.parse(JSON.stringify(SEED_SRS_CARDS)),
        srsReviews: [],"""

new_block = """    if (saved && saved.schemaVersion === CURRENT_DATASET_VERSION && Array.isArray(saved.radicals) && saved.radicals.length === 214) {
      this._data = saved;
    } else {
      const preservedCards = (saved && Array.isArray(saved.srsCards)) ? saved.srsCards : JSON.parse(JSON.stringify(SEED_SRS_CARDS));
      const preservedReviews = (saved && Array.isArray(saved.srsReviews)) ? saved.srsReviews : [];
      const preservedNotes = (saved && Array.isArray(saved.notes)) ? saved.notes : [
        {
          noteId: 1,
          vocabId: 1,
          content: 'Bộ thủ chữ Ái (爱): móng vuốt (爫) ở trên, khăn trùm (冖), ở giữa là con tim (心) và dưới cùng là bước chân chậm (夂).',
          createdAt: '2026-08-01T10:00:00Z',
          updatedAt: '2026-08-01T10:00:00Z'
        }
      ];
      this._data = {
        schemaVersion: CURRENT_DATASET_VERSION,
        accounts: JSON.parse(JSON.stringify(SEED_ACCOUNTS)),
        radicals: JSON.parse(JSON.stringify(SEED_RADICALS)),
        vocabulary: JSON.parse(JSON.stringify(SEED_VOCABULARY)),
        lessons: JSON.parse(JSON.stringify(SEED_LESSONS)),
        srsSettings: { ...SEED_SRS_SETTINGS },
        srsCards: preservedCards,
        srsReviews: preservedReviews,"""

# Handle both \r\n and \n in content
if old_block in content:
    content = content.replace(old_block, new_block, 1)
else:
    # Try with CRLF
    old_block_crlf = old_block.replace('\n', '\r\n')
    new_block_crlf = new_block.replace('\n', '\r\n')
    if old_block_crlf in content:
        content = content.replace(old_block_crlf, new_block_crlf, 1)
    else:
        print("Could not find getData block to replace")
        sys.exit(1)

with open('frontend/js/api/demo-fallback-engine.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated demo-fallback-engine.js to version 7 successfully!")
