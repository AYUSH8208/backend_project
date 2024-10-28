import { User } from "../models/user.model.js";
import { Apierror } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log("Token:", token);

        if (!token) {
            throw new Apierror(401, "Unauthorized request: No token provided");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new Apierror(401, "Unauthorized request: Invalid access token");
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("JWT verification error:", error);
        throw new Apierror(401, error.message || "Invalid Access Token");
    }
});
