import re, sys
sys.stdout.reconfigure(encoding='utf-8')

# 1. Update srs-review-page.js
with open('frontend/js/pages/srs-review-page.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove (001–020), (481–500), etc. from titles
# Notice en-dash \u2013 or hyphen -
text = re.sub(r' \(\d+[–-]\d+\)', '', text)

# Remove countBadge in createChapterCard
# Look for header.appendChild(countBadge);
old_header = """    header.appendChild(titleBox);
    header.appendChild(countBadge);"""

new_header = """    header.appendChild(titleBox);
    // countBadge removed per user request: avoids header overflow, total count is already in progress box"""

if old_header in text:
    text = text.replace(old_header, new_header, 1)
    print("Replaced header.appendChild(countBadge) successfully!")
else:
    old_header_crlf = old_header.replace('\n', '\r\n')
    new_header_crlf = new_header.replace('\n', '\r\n')
    if old_header_crlf in text:
        text = text.replace(old_header_crlf, new_header_crlf, 1)
        print("Replaced header.appendChild(countBadge) with CRLF successfully!")
    else:
        print("Could not find header.appendChild(countBadge)")

with open('frontend/js/pages/srs-review-page.js', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Update demo-seed-data.js titles
with open('frontend/js/api/demo-seed-data.js', 'r', encoding='utf-8') as f:
    seed_text = f.read()

seed_text = re.sub(r' \(\d+[–-]\d+\)', '', seed_text)

with open('frontend/js/api/demo-seed-data.js', 'w', encoding='utf-8') as f:
    f.write(seed_text)

print("Updated srs-review-page.js and demo-seed-data.js!")
