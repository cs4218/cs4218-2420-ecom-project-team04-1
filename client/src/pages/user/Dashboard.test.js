import React from "react"
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import Dashboard from "./Dashboard";
import { useAuth } from "../../context/auth";
import "@testing-library/jest-dom/extend-expect";

// Mock useAuth hook to return null state and a mock function for setAuth
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>, // Mock Layout
}));

jest.mock("../../components/UserMenu", () => ({
    __esModule: true,
    default: () => <div data-testid="user-menu" />, // Mock UserMenu
}));

// Mock PrivateRoute to always render <Outlet />
jest.mock("../../components/Routes/Private", () => {
        const { Outlet } = require("react-router-dom");
        return {
        __esModule: true,
        default: () => <Outlet />, // Always pass authentication
    };
});

// Mock user data who is logged in
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

describe("User Dashboard Component", () => {
    localStorage.setItem("auth", mockAuthData); // Ensure localStorage has auth data
      
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue([
            JSON.parse(mockAuthData), // Return mock auth state
            jest.fn(), // Mock setAuth function
        ]);
    });

  test("renders user dashboard information correctly", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/user"]}>
        <Routes>
            <Route path="/dashboard" element={<Outlet />} >
                <Route path="user" element={<Dashboard />} />
            </Route>
        </Routes>
      </MemoryRouter>
    );

    // Check if user details are displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("johndoe@example.com")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();

    // Ensure UserMenu component is rendered
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
  });

  test("handles missing user data gracefully", () => {
    // Mock case where auth.user is missing
    useAuth.mockReturnValue([{ user: null, token: "mockToken" }]);

    render(
        <MemoryRouter initialEntries={["/dashboard/user"]}>
            <Routes>
                <Route path="/dashboard" element={<Outlet />} >
                    <Route path="user" element={<Dashboard />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );

    // Check that dashboard doesn't break if user data is missing
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("johndoe@example.com")).not.toBeInTheDocument();
    expect(screen.queryByText("123 Main St")).not.toBeInTheDocument();
  });
});
