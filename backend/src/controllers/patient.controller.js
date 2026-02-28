import { Patient } from "../models/patient.model.js";
import { User } from "../models/user.model.js";
import { Doctor } from "../models/doctor.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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



const registerPatient = asyncHandler(async (req, res) => {
  const {
    name, email, password, dob, gender, contact, address,
    ayurvedic_category, mode, diseases, allergies, height, weight
  } = req.body;

  if (!name || !email || !password || !dob || !gender || !contact || !ayurvedic_category || !mode) {
    throw new ApiError(400, "All required patient fields must be provided");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // ✅ Parse address JSON string into array
  let parsedAddress = [];
  if (address) {
    try {
      parsedAddress = JSON.parse(address);
      if (!Array.isArray(parsedAddress)) throw new Error();
    } catch (err) {
      throw new ApiError(400, "Address must be a valid JSON array of objects");
    }
  }

  // ✅ Upload medical documents to GCS
  const uploadedDocs = Object.values(req.files || {}).flatMap(fileArr =>
    fileArr.map(file => file.path)
  );

  const medical_history = await Promise.all(
    uploadedDocs.map(async (localFilePath) => {
      const cloudinaryRes = await uploadOnCloudinary(localFilePath);
      return cloudinaryRes?.secure_url || null;
    })
  );

  const filteredMedicalHistory = medical_history.filter(Boolean);

  // ✅ Create new patient
  const newPatient = await Patient.create({
    name,
    email: email.toLowerCase(),
    password,
    dob,
    gender,
    contact,
    address: parsedAddress,
    role: 'patient', // Explicitly set the role
    ayurvedic_category,
    mode,
    diseases: diseases ? diseases.split(",").map(d => d.trim()) : [],
    allergies: allergies ? allergies.split(",").map(a => a.trim()) : [],
    medical_history: filteredMedicalHistory,
    height: height ? parseFloat(height) : null,
    weight: weight ? parseFloat(weight) : null
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newPatient, "Patient registered successfully"));
});



const loginPatient = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  // Find the patient directly
  const user = await Patient.findOne({ email });
  if (!user) {
    throw new ApiError(404, "Patient not found.");
  }

  if (!user.password) {
    throw new ApiError(400, "This account is not set up for password login. Please contact your doctor.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password.");
  }

  const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(user._id);

  // Get the logged user without password and refresh token
  const loggedUser = await Patient.findById(user._id).select("-password -refreshToken");

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
    .json(new ApiResponse(200, { user: loggedUser, accessToken }, "User logged in successfully."));
});

const logoutPatient = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: "" }
  }, { new: true });

  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax"
  };

  // Clear the access and refresh token cookies from the client
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully."));
})
export { registerPatient, loginPatient, logoutPatient };