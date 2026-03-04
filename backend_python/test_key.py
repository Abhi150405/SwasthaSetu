import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
print(f"API Key: {api_key[:15]}...")

# The old google.generativeai is deprecated. Let's try google-genai (the new SDK)
# But first, let's test with the old one more carefully
import google.generativeai as genai
print(f"SDK version: {genai.__version__}")

genai.configure(api_key=api_key)

# Try listing models first
print("\n--- Listing available models ---")
try:
    models = list(genai.list_models())
    print(f"Found {len(models)} models")
    for m in models[:5]:
        print(f"  {m.name} - {m.supported_generation_methods}")
except Exception as e:
    print(f"Error listing models: {type(e).__name__}: {e}")

# Try direct API call with requests
print("\n--- Direct REST API test ---")
import requests
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
try:
    resp = requests.get(url)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    if "models" in data:
        for m in data["models"][:5]:
            print(f"  {m['name']}")
    elif "error" in data:
        print(f"  Error: {data['error']['message']}")
    else:
        print(f"  Response: {str(data)[:200]}")
except Exception as e:
    print(f"Error: {e}")

# Try generate with REST API
print("\n--- Direct REST generate test ---")
url2 = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
try:
    resp2 = requests.post(url2, json={"contents": [{"parts": [{"text": "Say hello"}]}]})
    print(f"Status: {resp2.status_code}")
    data2 = resp2.json()
    if "candidates" in data2:
        print(f"  Response: {data2['candidates'][0]['content']['parts'][0]['text'][:100]}")
    elif "error" in data2:
        print(f"  Error: {data2['error']['message']}")
    else:
        print(f"  Response: {str(data2)[:200]}")
except Exception as e:
    print(f"Error: {e}")
