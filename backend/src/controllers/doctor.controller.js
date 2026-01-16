import { Doctor } from "../models/doctor.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateRefreshAndAccessTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something is wrong while generating tokens")
    }
}

const registerDoctor = asyncHandler(async (req, res) => {
    const { 
        name, email, password, dob, gender, contact, address,
        licenseNo, hospital, specialty, phone, bio
    } = req.body;

    if (!name || !email || !password || !dob || !gender || !contact || !licenseNo || !hospital || !specialty) {
        throw new ApiError(400, "All required doctor fields must be provided");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Create new doctor
    const newDoctor = await Doctor.create({
        name,
        email: email.toLowerCase(),
        password,
        dob,
        gender,
        contact,
        address: address ? [address] : [],
        role: 'doctor',
        licenseNo,
        hospital,
        specialty,
        phone: phone || contact,
        bio: bio || ''
    });

    return res
        .status(201)
        .json(new ApiResponse(201, newDoctor, "Doctor registered successfully"));
});

const loginDoctor = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required.");
    }
    
    // Find the doctor directly
    const user = await Doctor.findOne({ email });
    if (!user) {
        throw new ApiError(404, "Doctor not found.");
    }

    if (!user.password) {
        throw new ApiError(400, "This account is not set up for password login.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password.");
    }

    const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(user._id);

    // Get the logged user without password and refresh token
    const loggedUser = await Doctor.findById(user._id).select("-password -refreshToken");

    if (!loggedUser) {
        throw new ApiError(500, "Something went wrong while logging in.");
    }

    const isProduction = process.env.NODE_ENV === "production";
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedUser, accessToken }, "Doctor logged in successfully."));
});

const logoutDoctor = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: "" } 
    }, { new: true });

    const isProduction = process.env.NODE_ENV === "production";
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Doctor logged out successfully."));
});

export { registerDoctor, loginDoctor, logoutDoctor };