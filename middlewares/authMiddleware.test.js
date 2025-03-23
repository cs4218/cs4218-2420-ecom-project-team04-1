import jwt from "jsonwebtoken";
import { requireSignIn, isAdmin } from "./authMiddleware";
import userModel from "../models/userModel";
// Mock jsonwebtoken and userModel to isolate middleware logic
jest.mock("jsonwebtoken");
// Mock userModel
jest.mock("../models/userModel");

// Mock request, response, and next
const mockRequest = (headers = {}, body = {}, params = {}) => ({
    headers: {},
    body,
    params,
    user: {}, // Add user object for isAdmin middleware
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return res;
};
const mockNext = jest.fn();

describe("requireSignIn Middleware", () => {
    let req, res, next
    beforeEach(() => {
        jest.clearAllMocks();
        req = mockRequest();
        res = mockResponse();
        next = mockNext;
    });

    it("should call next() if a valid token is provided", async () => {
        req.headers.authorization = "valid_token";
    
        jwt.verify = jest.fn().mockReturnValue({ _id: "user_id" });
    
        // Mock userModel.findById to return a matching user
        userModel.findById = jest.fn().mockResolvedValue({ _id: "user_id" });
    
        await requireSignIn(req, res, next);
    
        expect(jwt.verify).toHaveBeenCalledWith("valid_token", process.env.JWT_SECRET);
        expect(userModel.findById).toHaveBeenCalledWith("user_id");
        expect(req.user).toEqual({ _id: "user_id" });
        expect(next).toHaveBeenCalled();
    });
    

    it("should return 401 if token is missing", async () => {
        await requireSignIn(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401); // Original Code does not handle this. Have to modify.
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Unauthorized: No token provided",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token is invalid", async () => {
        // Mock request with a valid token
        req.headers.authorization = "invalid_token";

        // Mock JWT verify to throw an error
        jwt.verify = jest.fn().mockImplementation(() => {
            throw new Error("Invalid token");
        });

        await requireSignIn(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("invalid_token", process.env.JWT_SECRET);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401); // Ensure error handling is proper
        // Original Code does not give 401 response. Have to modify.
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Unauthorized: Invalid or expired token",
        });
    });
});

describe("isAdmin Middleware", () => {
    let req, res, next;
    beforeEach(() => {
        jest.clearAllMocks();
        req = mockRequest();
        res = mockResponse();
        next = mockNext;
    });

    it("should call next() if user is admin", async () => {
        // Mock userModel to return a user with role 1 (Admin)
        req.user = { _id: "admin_user_id" };
        userModel.findById = jest.fn().mockReturnValue({ role: 1 });

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith(req.user._id);
        expect(next).toHaveBeenCalled();
    })

    it("should return 403 if user is not admin", async () => {
        req.user = { _id: "non_admin_user_id" };

        // Mock userModel to return a user with role 0 (User)
        userModel.findById = jest.fn().mockReturnValue({ role: 0 });

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith(req.user._id);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Forbidden: Admin Access Required",
        });
    })

    it("should return 401 if user is not found", async () => {

        // Mock userModel to return null
        userModel.findById.mockResolvedValue(null);

        await isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Unauthorized: No user found",
        });
    })

    it("should handle errors in isAdmin Middleware", async () => {
        req.user = { _id: "admin_user_id" };
        
        // Mock userModel.findById to throw an error
        userModel.findById = jest.fn().mockImplementation(() => {
            throw new Error("Error in isAdmin middleware");
        });

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith("admin_user_id");
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: expect.any(Error),
            message: "Error in admin middleware",
        });
        expect(next).not.toHaveBeenCalled();
    });
});
