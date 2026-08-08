import requests
import json
import io
from datetime import datetime, timezone

BASE_URL = "http://localhost:5001"

def print_header(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_endpoint(session, method, url, name, payload=None, files=None, params=None, expected_statuses=[200, 201]):
    try:
        if method.upper() == "GET":
            res = session.get(url, params=params)
        elif method.upper() == "POST":
            if files:
                res = session.post(url, data=payload, files=files)
            else:
                res = session.post(url, json=payload, params=params)
        elif method.upper() == "PUT":
            res = session.put(url, json=payload, params=params)
        elif method.upper() == "DELETE":
            res = session.delete(url, params=params)
        else:
            print(f"❌ [{name}] Unsupported method {method}")
            return False, None

        status_ok = res.status_code in expected_statuses
        symbol = "[PASS]" if status_ok else "[FAIL]"
        print(f"{symbol} [{res.status_code}] {method} {url.replace(BASE_URL, '')} - {name}")
        
        try:
            body = res.json()
        except Exception:
            body = res.text[:150]

        if not status_ok:
            print(f"   Response: {body}")
        
        return status_ok, body
    except Exception as e:
        print(f"[ERROR] {method} {name}: {e}")
        return False, str(e)

def run_tests():
    print_header("SWASTHASETU BACKEND ENDPOINT TEST SUITE")
    
    patient_session = requests.Session()
    doctor_session = requests.Session()
    
    timestamp = int(datetime.now(timezone.utc).timestamp())
    patient_email = f"patient_{timestamp}@test.com"
    doctor_email = f"doctor_{timestamp}@test.com"
    
    # --- 1. AUTHENTICATION MODULE ---
    print_header("1. AUTHENTICATION MODULE (/api/auth)")
    
    patient_reg_payload = {
        "name": "Test Patient",
        "email": patient_email,
        "password": "Password123!",
        "dob": "1995-05-15T00:00:00Z",
        "gender": "female",
        "contact": "9876543210",
        "ayurvedic_category": "pitta",
        "mode": "online",
        "height": 165.0,
        "weight": 60.0
    }
    ok, pat_reg_data = test_endpoint(patient_session, "POST", f"{BASE_URL}/api/auth/register/patient", "Register Patient", patient_reg_payload)
    patient_id = pat_reg_data.get("user", {}).get("id") if ok and isinstance(pat_reg_data, dict) else None

    doctor_reg_payload = {
        "name": "Dr. Test Specialist",
        "email": doctor_email,
        "password": "Password123!",
        "dob": "1985-08-20T00:00:00Z",
        "gender": "male",
        "contact": "9988776655",
        "licenseNo": f"LIC{timestamp}",
        "hospital": "Central City Hospital",
        "specialty": "Ayurvedic Medicine",
        "phone": "9988776655",
        "bio": "Ayurveda Specialist with 10+ years experience"
    }
    ok, doc_reg_data = test_endpoint(doctor_session, "POST", f"{BASE_URL}/api/auth/register/doctor", "Register Doctor", doctor_reg_payload)
    doctor_id = doc_reg_data.get("user", {}).get("id") if ok and isinstance(doc_reg_data, dict) else None

    test_endpoint(patient_session, "POST", f"{BASE_URL}/api/auth/login", "Patient Login", {"email": patient_email, "password": "Password123!"})
    test_endpoint(doctor_session, "POST", f"{BASE_URL}/api/auth/login", "Doctor Login", {"email": doctor_email, "password": "Password123!"})

    test_endpoint(patient_session, "GET", f"{BASE_URL}/api/auth/me", "Get Current User (/me)")
    test_endpoint(patient_session, "PUT", f"{BASE_URL}/api/auth/notifications-seen", "Mark Notifications Seen")
    test_endpoint(patient_session, "POST", f"{BASE_URL}/api/auth/refresh", "Refresh Auth Token")

    # --- 2. PATIENT MODULE ---
    print_header("2. PATIENT MODULE (/api/patient)")
    if patient_id:
        test_endpoint(patient_session, "GET", f"{BASE_URL}/api/patient/profile/{patient_id}", "Get Patient Profile")
        test_endpoint(patient_session, "PUT", f"{BASE_URL}/api/patient/profile/{patient_id}", "Update Patient Profile", {"height": 168.0, "weight": 61.5})

    # --- 3. DOCTOR MODULE ---
    print_header("3. DOCTOR MODULE (/api/doctor)")
    test_endpoint(patient_session, "GET", f"{BASE_URL}/api/doctor/all", "Get All Doctors")
    
    if doctor_id:
        test_endpoint(doctor_session, "PUT", f"{BASE_URL}/api/doctor/profile/{doctor_id}", "Update Doctor Profile", {"bio": "Updated Bio for Dr. Test"})

    test_endpoint(doctor_session, "GET", f"{BASE_URL}/api/doctor/patients", "Get Doctor Linked Patients")
    
    doc_add_patient_payload = {
        "name": f"Doctor Added Patient {timestamp}",
        "email": f"docpatient_{timestamp}@test.com",
        "gender": "male",
        "dob": "1998-10-10",
        "contact": "8877665544",
        "ayurvedic_category": "vata"
    }
    ok, doc_added_patient = test_endpoint(doctor_session, "POST", f"{BASE_URL}/api/doctor/patients", "Doctor Add Patient", doc_add_patient_payload)
    doc_added_patient_id = doc_added_patient.get("data", {}).get("id") if ok and isinstance(doc_added_patient, dict) else None

    if doc_added_patient_id:
        test_endpoint(doctor_session, "GET", f"{BASE_URL}/api/doctor/patients/{doc_added_patient_id}", "Get Doctor Patient Details")

    # --- 4. CONSULTATION MODULE ---
    print_header("4. CONSULTATION MODULE (/api/consultation)")
    consultation_id = None
    if doctor_id:
        consult_payload = {
            "doctorId": doctor_id,
            "symptoms": "Mild headache and fatigue",
            "notes": "Looking for lifestyle recommendations"
        }
        ok, consult_res = test_endpoint(patient_session, "POST", f"{BASE_URL}/api/consultation/request", "Request Consultation", consult_payload)
        consultation_id = consult_res.get("data", {}).get("id") if ok and isinstance(consult_res, dict) else None

    test_endpoint(patient_session, "GET", f"{BASE_URL}/api/consultation/patient", "Get Patient Consultations")
    test_endpoint(doctor_session, "GET", f"{BASE_URL}/api/consultation/doctor", "Get Doctor Consultations")

    if consultation_id:
        test_endpoint(doctor_session, "PUT", f"{BASE_URL}/api/consultation/{consultation_id}/status", "Update Consultation Status to Accepted", {"status": "accepted", "notes": "Approved for consultation"})

    # --- 5. MESSAGES MODULE ---
    print_header("5. MESSAGES MODULE (/api/messages)")
    if doctor_id:
        msg_payload = {"content": "Hello Doctor, thank you for accepting my request."}
        test_endpoint(patient_session, "POST", f"{BASE_URL}/api/messages/{doctor_id}", "Send Message Patient -> Doctor", msg_payload)

    if patient_id:
        doc_msg_payload = {"content": "Hello! How can I assist you today?"}
        test_endpoint(doctor_session, "POST", f"{BASE_URL}/api/messages/{patient_id}", "Send Message Doctor -> Patient", doc_msg_payload)

    test_endpoint(patient_session, "GET", f"{BASE_URL}/api/messages/conversations", "Get Conversations List")
    if doctor_id:
        test_endpoint(patient_session, "GET", f"{BASE_URL}/api/messages/{doctor_id}", "Get Message History")
        test_endpoint(patient_session, "PUT", f"{BASE_URL}/api/messages/{doctor_id}/read", "Mark Messages Read")

    # --- 6. PROGRESS MODULE ---
    print_header("6. PROGRESS MODULE (/api/progress)")
    test_endpoint(patient_session, "GET", f"{BASE_URL}/api/progress/today", "Get Today Progress")
    test_endpoint(patient_session, "GET", f"{BASE_URL}/api/progress/history", "Get Progress History")
    test_endpoint(patient_session, "POST", f"{BASE_URL}/api/progress/water", "Update Water Intake", {"amount": 500.0})
    test_endpoint(patient_session, "POST", f"{BASE_URL}/api/progress/meal", "Mark Meal Taken", {"meal_type": "breakfast"})

    # --- 7. AI ASSISTANT MODULE ---
    print_header("7. AI ASSISTANT MODULE (/api/ai)")
    ai_payload = {
        "question": "Hello Setu, can you give me 3 Ayurvedic tips for Pitta dosha?",
        "patientContext": {"dosha": "Pitta"}
    }
    test_endpoint(patient_session, "POST", f"{BASE_URL}/api/ai/ask", "AI Chat Assistant (/ask)", ai_payload)
    test_endpoint(patient_session, "POST", f"{BASE_URL}/api/ai/scan", "AI Food Scan (/scan)")

    # --- 8. RECIPE GENERATOR MODULE ---
    print_header("8. RECIPE GENERATOR MODULE (/api/recipe)")
    recipe_payload = {
        "mealName": "Ayurvedic Kitchari",
        "dosha": "Pitta",
        "patientName": "Test Patient"
    }
    test_endpoint(patient_session, "POST", f"{BASE_URL}/api/recipe/generate", "Generate Ayurvedic Recipe", recipe_payload)
    test_endpoint(patient_session, "GET", f"{BASE_URL}/api/recipe/all", "Get All Recipes")

    # --- 9. DIET PLAN GENERATOR MODULE ---
    print_header("9. DIET PLAN GENERATOR MODULE (/api/diet)")
    diet_payload = {
        "patientId": patient_id or "",
        "age": 30,
        "gender": "female",
        "weight": 60.0,
        "height": 165.0,
        "days": 1,
        "goals": "balance digestion"
    }
    test_endpoint(patient_session, "POST", f"{BASE_URL}/api/diet/generate", "Generate AI Diet Plan", diet_payload)
    if patient_id:
        test_endpoint(patient_session, "GET", f"{BASE_URL}/api/diet/patient/{patient_id}", "Get Patient Diet Plans")

    # --- 10. FILES MODULE ---
    print_header("10. FILES MODULE (/api/files)")
    sample_file = io.BytesIO(b"%PDF-1.4 Fake PDF Header Content for Testing")
    sample_file.name = "sample_report.pdf"
    files = {"file": (sample_file.name, sample_file, "application/pdf")}
    ok, file_res = test_endpoint(patient_session, "POST", f"{BASE_URL}/api/files/upload", "Upload File (PDF)", files=files)
    filename = file_res.get("filename") if ok and isinstance(file_res, dict) else None

    if filename:
        test_endpoint(patient_session, "GET", f"{BASE_URL}/api/files/{filename}", "Get Uploaded File")

    # Logout test
    print_header("CLEANUP / LOGOUT")
    test_endpoint(patient_session, "POST", f"{BASE_URL}/api/auth/logout", "Patient Logout")
    test_endpoint(doctor_session, "POST", f"{BASE_URL}/api/auth/logout", "Doctor Logout")
    print_header("ALL ENDPOINT TESTS COMPLETED!")

if __name__ == "__main__":
    run_tests()
