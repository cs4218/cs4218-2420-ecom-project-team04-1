import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import validator from 'validator';
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;

    // Validate Inputs
    if (!name) {
      return res.status(400).send({ success: false, message: "Name is required" });
    }
    if (!email) {
      return res.status(400).send({ success: false, message: "Email is required" });
    }
    // Check email format
    if (!validator.isEmail(email)) {
      return res.send({ message: "Invalid Email Format" });
    }
    if (!password) {
      return res.status(400).send({ success: false, message: "Password is required" });
    }
    if (!phone) {
      return res.status(400).send({ success: false, message: "Phone number is required" });
    }
    if (!address) {
      return res.status(400).send({ success: false, message: "Address is required" });
    }
    if (!answer) {
      return res.status(400).send({ success: false, message: "Security answer is required" });
    }

    // Check if User Exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "Email already registered. Please log in.",
      });
    }

    // Hash Password and Security Answer
    const hashedPassword = await hashPassword(password);
    const hashedAnswer = await hashPassword(answer);

    // Save User
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer: hashedAnswer,
    }).save();

    res.status(201).send({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in registration",
      error,
    });
  }
};

// LOGIN CONTROLLER
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate Inputs
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if User Exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registered",
      });
    }

    // Compare Password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).send({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate Token
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).send({
      success: true,
      message: "Login successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

// FORGOT PASSWORD CONTROLLER
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;

    // Validate Inputs
    if (!email) {
      return res.status(400).send({ success: false, message: "Email is required" });
    }
    if (!answer) {
      return res.status(400).send({ success: false, message: "Security answer is required" });
    }
    if (!newPassword) {
      return res.status(400).send({ success: false, message: "New password is required" });
    }

    // Find User
    const user = await userModel.findOne({ email });
    if (!user || !(await comparePassword(answer, user.answer))) {
      return res.status(404).send({
        success: false,
        message: "Wrong email or security answer",
      });
    }

    // Update Password
    const hashedPassword = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.status(200).send({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

// test controller
export const testController = (req, res) => {
  try {
    res.send("Protected Routes");
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
};

//update profile
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;

    // Validate at least one field is provided
    if (!name && !email && !password && !address && !phone) {
      return res.status(400).send({
        success: false,
        message: "At least one field is required to update the profile.",
      });
    }

    // Ensure user ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).send({ success: false, message: "Invalid user ID format" });
    }

    // Find user first
    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    // Prepare fields to update
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (password) {
      updateFields.password = await hashPassword(password);
    }

    // Update user
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({
        success: false,
        message: "User update failed",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Profile updated successfully",
      updatedUser,
    });

  } catch (error) {
    console.error("Error in updateProfileController:", error);
    return res.status(500).send({
      success: false,
      message: "Internal server error while updating profile",
      error: error.message,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(400).json({
        success: false,
        message: "User authentication required",
      });
    }

    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      orders,
    });

  } catch (error) {
    console.log(error);

    // Ensure this response format is **always JSON**
    return res.status(500).json({
      success: false,
      message: "Error while retrieving orders",
      error: error.message || "Internal Server Error",
    });
  }
};

//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All orders retrieved successfully",
      orders,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error while retrieving orders",
      error: error.message || "Internal Server Error",
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) {
      return res.status(404).send({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while updating order status",
      error,
    });
  }
};


// Get all users - Admin only
export const getAllUsersController = async (req, res) => {
  try {
    const users = await userModel
      .find({})
      .select("-password") // Exclude password for security
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting Users",
      error,
    });
  }
};

// Get single user by ID
export const getUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userModel
      .findById(userId)
      .select("-password"); // Exclude password for security
    
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting User",
      error,
    });
  }
};
