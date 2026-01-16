import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
const addressSchema = new mongoose.Schema({
    city: String,
    state: String,
    country: String,
    isDefault: { type: Boolean, default: false }
});

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ["male", "female", "prefer not to say"]
    },
    contact: {
        type: String,
        required: true,
    },

    address: [addressSchema],
    role: {
        type: String,
        required: true,
        enum: ['patient', 'doctor']
    },
    refreshToken: {
        type: String
    },
}, {
    timestamps: true,
    discriminatorKey: 'role'
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})


userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name
        },
        process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },

        process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User = mongoose.model('User', userSchema);
