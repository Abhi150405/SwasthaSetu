import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

print("Available models:")
for m in genai.list_models():
    print(f"- {m.name} : {m.supported_generation_methods}")
