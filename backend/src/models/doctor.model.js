import mongoose from 'mongoose';
import { User } from './user.model.js';

const doctorSchema = new mongoose.Schema({
    licenseNo: {
        type: String,
        required: true,
        unique: true
    },
    hospital: {
        type: String,
        required: true
    },
    specialty: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: ''
    },
    specialization: {
        type: [String],
        default: function() { return [this.specialty]; }
    },
    experience: {
        type: Number,
        default: 0
    },
    verification_status: {
        type: Boolean,
        default: false
    },
    patients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
    }]
});

export const Doctor = User.discriminator('doctor', doctorSchema);