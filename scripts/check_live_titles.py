import urllib.request, re, sys
sys.stdout.reconfigure(encoding='utf-8')

with urllib.request.urlopen('http://localhost:3000/js/pages/srs-review-page.js') as r:
    js = r.read().decode('utf-8')

titles = re.findall(r'"title":\s*"([^"]+)"', js[:js.find('export class SrsReviewController')])
print(f"Total topic titles: {len(titles)}")
print("\nSample HSK 1 titles:")
for t in titles[:5]:
    print(" ", t)
print("\nSample HSK 2 titles:")
for t in titles[15:20]:
    print(" ", t)
print("\nSample HSK 3 titles:")
for t in titles[25:30]:
    print(" ", t)

has_overflow_ranges = [t for t in titles if re.search(r'\(\d+[–-]\d+\)', t)]
print(f"\nTitles still containing parentheses ranges: {len(has_overflow_ranges)}")
