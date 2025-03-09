import mongoose from "mongoose";
import connectDB from "../config/db";

// Mock mongoose because we don't want to connect to the real database
jest.mock("mongoose", () => ({
    connect: jest.fn(),
}))

describe("Database Connection", () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        // Clear all mocks and reset spies before each test
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore all spy/mock after each test
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore(); 
    })

    test("should connect to MongoDB successfully", async () => {
        // Mock the connection object because of conn.connection.host
        const mockConnection = {
            connection: { host: "mock-host" }
        };
        mongoose.connect.mockResolvedValue(mockConnection);

        await connectDB();
        
        expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("Connected To Mongodb Database mock-host") 
        );
    });

    test("should log an error if connection to MongoDB fails", async () => {
        // Simulate an error because we dont know how mongoose give error
        const mockError = new Error("Connection failed");
        mongoose.connect.mockRejectedValue(mockError);

        await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("Error in Mongodb Error: Connection failed") 
        );
    });
});