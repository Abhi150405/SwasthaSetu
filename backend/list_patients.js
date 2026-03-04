import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Patient } from './src/models/patient.model.js';

dotenv.config();

const listPatients = async () => {
    try {
        const uri = `${process.env.MONGODB_URI}/${process.env.DB_NAME}`;
        await mongoose.connect(uri);

        const patients = await Patient.find({}).lean();

        console.log(`Total Patients: ${patients.length}`);
        patients.forEach(p => {
            console.log(`- ID: ${p._id}`);
            console.log(`  Name: ${p.name}`);
            console.log(`  Email: ${p.email}`);
            console.log(`  Role: ${p.role}`);
            console.log(`  Category: ${p.ayurvedic_category}`);
            console.log(`  Diseases: ${p.diseases.join(', ') || 'None'}`);
            console.log(`  Medical History: ${p.medical_history.join(', ') || 'None'}`);
            console.log(`  Height: ${p.height} cm`);
            console.log(`  Weight: ${p.weight} kg`);
            console.log(`  Assigned Doctor: ${p.assigned_doctor || 'None'}`);
            console.log('-------------------');
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("ERROR:", error.message);
    }
};

listPatients();
