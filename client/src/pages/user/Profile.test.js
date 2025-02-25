import React from "react";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Profile from "./Profile";
import { useAuth } from "../../context/auth";
import axios from "axios";
import toast from "react-hot-toast";
import PrivateRoute from "../../components/Routes/Private";
import { token } from "morgan";

// Mock dependencies
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));
jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));
jest.mock("../../context/search", () => ({
    useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));
jest.mock("../../hooks/useCategory", () => jest.fn(() => []));
jest.mock("axios");
jest.mock("react-hot-toast");

// Mock PrivateRoute to always render <Outlet />
jest.mock("../../components/Routes/Private", () => {
    const { Outlet } = require("react-router-dom");
    return {
    __esModule: true,
    default: () => <Outlet />, // Always pass authentication
  };
});

describe("User Profile Component", () => {
    const mockAuthData = JSON.stringify({
        user: {
            name: "John Doe",
            email: "johndoe@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
            role: 0, 
        },
        token: "mockToken", // mock token for `auth.token` in PrivateRoute to render Profile rather than Spinner
    });

    localStorage.setItem("auth", mockAuthData); // Ensure localStorage has auth data
    
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue([
            JSON.parse(mockAuthData), // Return mock auth state
            jest.fn(), // Mock setAuth function
        ]);
    });

    test("renders Profile component fields correctly", async () => {
        render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard" element={<Outlet />} >
                        <Route path="user/profile" element={<Profile />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
        
        expect(screen.getByPlaceholderText("Enter Your Name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Phone Number")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Address")).toBeInTheDocument();
        expect(screen.getByText("UPDATE")).toBeInTheDocument();
    })

    test("disables email input", () => {
        render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard" element={<Outlet />} >
                        <Route path="user/profile" element={<Profile />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByPlaceholderText("Enter Your Email")).toBeDisabled();
    });

    test("updates state on input change", () => {
        render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard" element={<Outlet />} >
                        <Route path="user/profile" element={<Profile />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
    
        const nameInput = screen.getByPlaceholderText("Enter Your Name");
        fireEvent.change(nameInput, { target: { value: "New Name" } });
    
        expect(nameInput.value).toBe("New Name");
    });

    test("submits form and handles successful response", async () => {
        axios.put.mockResolvedValue({ 
            data: { 
                updatedUser: { 
                    name: "New Name", 
                    email: "newEmail@example.com",
                    password: "password123",
                    phone: "0987654321", 
                    address: "New Address 456, Suburb" 
                },
                token: "mockToken",
            },
        });

        render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard" element={<Outlet />} >
                        <Route path="user/profile" element={<Profile />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
            target: { value: "New Name" },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
            target: { value: "newEmail@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Phone Number"), {
            target: { value: "0987654321" },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
            target: { value: "New Address 456, Suburb" },
        });

        const updateButton = screen.getByText("UPDATE");
        fireEvent.click(updateButton);
        
        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
                name: "New Name",
                email: "newEmail@example.com",
                password: "",
                phone: "0987654321",
                address: "New Address 456, Suburb",
            });
        });
        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
    });

    test("handles API error response", async () => {
        axios.put.mockResolvedValue({
            data: { error: "Update failed" },
        });
        
        render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard" element={<Outlet />} >
                        <Route path="user/profile" element={<Profile />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
    
        fireEvent.click(screen.getByText("UPDATE"));
    
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Update failed");
        });
    });

    test("handles API failure", async () => {
        axios.put.mockRejectedValue(new Error("Network Error"));
    
        render(
            <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
                <Routes>
                    <Route path="/dashboard" element={<Outlet />} >
                        <Route path="user/profile" element={<Profile />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText("UPDATE"));
    
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });

});