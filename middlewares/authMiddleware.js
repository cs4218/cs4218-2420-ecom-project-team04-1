import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Utility function for token verification
const verifyToken = (token) => {
    try {
        return JWT.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.log("Error in verifyToken:", error);
        return null;
    }
};

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        const authHeaderToken = req.headers.authorization;
        console.log("authHeaderToken: ", authHeaderToken);
        if (!authHeaderToken) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        const decoded = verifyToken(authHeaderToken);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid or expired token",
            });
        }

        const existingUser = await userModel.findById(decoded._id);
        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No user found",
            });
        }

        req.user = existingUser;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).send({
            success: false,
            error,
            message: "Error in Sign In Middleware",
        });
    }
};

// Admin access
export const isAdmin = async (req, res, next) => {
    try {
        // Check if user is found
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No user found",
            });
        }

        const user = await userModel.findById(req.user._id);
        if(!user || user.role !== 1) { 
            return res.status(403).json({
                success: false,
                message: "Forbidden: Admin Access Required",
            });
        }
        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error in admin middleware",
            error,
        });
    }
};
