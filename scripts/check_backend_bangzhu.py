import urllib.request, json, sys, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')

q = urllib.parse.quote('帮助')
url = f'http://localhost:8080/api/v1/vocabulary?search={q}'
req = urllib.request.Request(url)
with urllib.request.urlopen(req, timeout=3) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    items = data.get('data', {}).get('items', [])
    if not items:
        print("Not found")
        sys.exit(0)
    item = items[0]
    vocab_id = item['vocabId']
    print(f"Found 帮助 vocabId = {vocab_id}")
    detail_url = f'http://localhost:8080/api/v1/vocabulary/{vocab_id}'
    with urllib.request.urlopen(detail_url, timeout=3) as dresp:
        ddata = json.loads(dresp.read().decode('utf-8'))
        print("Radicals returned by backend:")
        for r in ddata.get('data', {}).get('radicals', []):
            print(f"  #{r['radicalId']} {r['character']} ({r['pinyin']}): {r['componentType']}")
