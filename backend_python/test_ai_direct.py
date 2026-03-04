import requests
import json

def test_ask():
    url = "http://localhost:5001/api/ai/ask"
    payload = {
        "question": "What should I eat for Vata imbalance?",
        "patientContext": {"name": "Test User", "role": "patient"}
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ask()
