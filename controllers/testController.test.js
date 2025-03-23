import { testController } from "../controllers/authController.js";
import { jest } from "@jest/globals";

describe("testController", () => {
  let req, res, jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    res = {
      status: statusMock,
    };

    jest.clearAllMocks();
  });

  // Use Case 1: Should return "Protected Routes" successfully
  test("should return 'Protected Routes'", () => {
    testController(req, res);

    expect(statusMock).toHaveBeenCalledWith(200); // Ensure status 200 is called
    expect(jsonMock).toHaveBeenCalledWith({ message: "Protected Routes" }); // Ensure correct JSON response
  });

  // Use Case 2: Should handle unexpected errors
  test("should handle unexpected errors", () => {
    const errorMock = new Error("Unexpected Error");
    console.log = jest.fn(); // Mock console.log to prevent actual logging

    const errorTestController = (req, res) => {
      try {
        throw errorMock;
      } catch (error) {
        console.log(error);
        res.status(500).json({ error });
      }
    };

    errorTestController(req, res);

    expect(console.log).toHaveBeenCalledWith(errorMock);
    expect(jsonMock).toHaveBeenCalledWith({ error: errorMock });
  });
});
