import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const rawToken = req.cookies?.accessToken || req.header("Authorization");


    if (!rawToken) {
      throw new ApiError(401, "Unauthorized Token");
    }

    const token = rawToken.replace(/^Bearer\s?/, "");


    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid AccessToken");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token Error");
  }
});

// export const verifyJWT =asyncHandler(async(req,res,next)=>{
//     try {
//         const token = req.cookies?.accessToken || req.header("Authorization")?.replace(/^Bearer\s?/, "");


//         if(!token){
//             throw new ApiError(401,"Unauthorized Token")
//         }

//         const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

//         if(!decodedToken){
//             throw new ApiError(401,"Invalid Token")
//         }
//         const user=await User.findById(decodedToken?._id).select("-password -refreshToken")

//         if(!user){
//             throw new ApiError(401,"Invalid AccessToken")
//         }

//         req.user=user
//         next()
//     } catch (error) {
//         throw new ApiError(401,error?.message || "Invalid Access Token Error")
//     }
// })

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!req.user) {
      return res.status(401).json({ message: "Authentication details not found. Please log in." });
    }

    if (!userRole) {
      return res.status(403).json({ message: "User role not found. Access denied." });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Role '${userRole}' is not authorized to access this route. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};