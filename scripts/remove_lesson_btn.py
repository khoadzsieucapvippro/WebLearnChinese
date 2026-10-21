with open('frontend/js/pages/srs-review-page.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = "extraButtonText: shouldShowLessonDetailLink ? '📖 Bài học' : null,\n        extraButtonHref: shouldShowLessonDetailLink ? `lesson-detail.html?id=${effectiveLessonId}` : null"
replacement = "extraButtonText: null,\n        extraButtonHref: null"

if target in content:
    content = content.replace(target, replacement, 1)
else:
    target_crlf = target.replace('\n', '\r\n')
    replacement_crlf = replacement.replace('\n', '\r\n')
    if target_crlf in content:
        content = content.replace(target_crlf, replacement_crlf, 1)
    else:
        print("Target not found")
        import sys
        sys.exit(1)

with open('frontend/js/pages/srs-review-page.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed [📖 Bài học] button from srs-review-page.js successfully!")
