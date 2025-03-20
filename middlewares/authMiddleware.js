import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Utility function for token verification
const verifyToken = (token) => {
    try {
        return JWT.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        const authHeaderToken = req.headers.authorization;
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

        req.user = decoded;
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

        // Bypass admin check only in test environment
        if (process.env.NODE_ENV === 'test' && req.user.role === 1) {
            return next();
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
