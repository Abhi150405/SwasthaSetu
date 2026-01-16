import React, { useState } from 'react';
import axios from 'axios';

export default function TestRegistration() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testRegistration = async () => {
    setLoading(true);
    setResult('');

    const formData = new FormData();
    formData.append("name", "Test User");
    formData.append("email", "test@example.com");
    formData.append("password", "password123");
    formData.append("dob", "1990-01-01");
    formData.append("gender", "male");
    formData.append("contact", "1234567890");
    formData.append("ayurvedic_category", "vata");
    formData.append("mode", "online");
    formData.append("address", JSON.stringify([{
      city: "Test City",
      state: "Test State", 
      country: "Test Country"
    }]));
    formData.append("height", "170");
    formData.append("weight", "70");

    try {
      const response = await axios.post(
        "/api/patient/register-patient",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setResult(`Success: ${JSON.stringify(response.data, null, 2)}`);
    } catch (err: any) {
      setResult(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Registration</h1>
      <button 
        onClick={testRegistration}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Registration'}
      </button>
      
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-sm">
          {result}
        </pre>
      )}
    </div>
  );
}