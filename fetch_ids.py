import requests
import json

api_key = "bc4267c7-0202-4fc4-891d-b4124e1110af"

voices_r = requests.get("https://api.liveavatar.com/v1/voices", headers={"X-Api-Key": api_key})
contexts_r = requests.get("https://api.liveavatar.com/v1/contexts", headers={"X-Api-Key": api_key})

voices = voices_r.json()
contexts = contexts_r.json()

print("VOICES (first 2):")
for v in voices['data']['results'][:2]:
    print(f"  - {v['id']} | {v['name']} | {v['language']}")

print("\nCONTEXTS (all):")
for c in contexts['data']['results']:
    print(f"  - {c['id']} | Created: {c['created_at']}")

first_voice = voices['data']['results'][0]['id']
first_context = contexts['data']['results'][0]['id']

print(f"\n✓ USE THESE VALUES:")
print(f"  voice_id: {first_voice}")
print(f"  context_id: {first_context}")
