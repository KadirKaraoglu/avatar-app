import requests
import json

api_key = "bc4267c7-0202-4fc4-891d-b4124e1110af"

print("Listing active sessions...")
sessions_r = requests.get(
    "https://api.liveavatar.com/v1/sessions",
    headers={
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }
)

print(f"Status Code: {sessions_r.status_code}")
print(f"Response: {json.dumps(sessions_r.json(), indent=2)}\n")

sessions = sessions_r.json()

# Check if request was successful
if sessions_r.status_code != 200:
    print(f"Error: API returned status {sessions_r.status_code}")
    print(f"Message: {sessions.get('message', 'No message')}")
    exit(1)

# Check if we have data
if not sessions.get('data'):
    print("No sessions data returned (might be empty or error)")
    print("This could mean:")
    print("  1. No active sessions")
    print("  2. API key doesn't have permission")
    print("  3. API error")
    exit(0)

# Process sessions
results = sessions['data'].get('results', [])
print(f"Found {len(results)} active session(s)\n")

if len(results) == 0:
    print("No active sessions to clean up.")
else:
    for session in results:
        session_id = session.get('id')
        status = session.get('status')
        created = session.get('created_at')
        
        print(f"Session: {session_id} | Status: {status} | Created: {created}")
        
        # Stop the session
        print(f"  Stopping...")
        stop_r = requests.post(
            "https://api.liveavatar.com/v1/sessions/stop",
            headers={
                "X-Api-Key": api_key,
                "Content-Type": "application/json"
            },
            json={
                "session_id": session_id,
                "reason": "CLEANUP"
            }
        )
        
        if stop_r.ok:
            print(f"  ✓ Stopped\n")
        else:
            print(f"  ✗ Failed: {stop_r.status_code} - {stop_r.text}\n")

print("Cleanup complete!")
