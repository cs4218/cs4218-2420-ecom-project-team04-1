import mongoose from "mongoose";
import connectDB from "../config/db";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("ConfigDB - Integration Test", () => {
    let mongoServer;
    let consoleLogSpy;
    let consoleErrorSpy;
    let mongoUrl

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        mongoUrl = await mongoServer.getUri();
        process.env.MONGO_URL = mongoUrl;
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    afterAll(async () => {
        await mongoServer.stop();
    })

    beforeEach(() => {
        // Clear all mocks and reset spies before each test
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    test("should connect to in-memory MongoDB instance successfully", async () => {
        await connectDB();

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("Connected To Mongodb Database")
        );
        expect(mongoose.connection.readyState).toBe(1); // 1 means connected
        expect(mongoose.connection.db.databaseName).toBeTruthy();
    });

    test("should log an error if connection to in-memory MongoDB fails", async () => {
        process.env.MONGO_URL = "mongodb://invalid-url"; // Invalid URI to force failure

        try {
            await connectDB();
        } catch (error) {
            // Catch the error to prevent unhandled promise rejection
        }

        expect(mongoose.connection.readyState).toBe(0); // Should remain disconnected
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("Error in Mongodb")
        );
        
    });

    test("should close the connection to in-memory MongoDB instance", async () => {
        process.env.MONGO_URL = mongoUrl; // Reset the URI
        await connectDB();

        await mongoose.connection.dropDatabase();  // Ensure no pending operation
        await mongoose.connection.close();
        await mongoServer.stop();

        expect(mongoose.connection.readyState).toBe(0); // 0 means disconnected
    });
})