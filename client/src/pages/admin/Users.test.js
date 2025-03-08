import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Users from "../../pages/admin/Users";
import toast from "react-hot-toast";

// Mock console.log to prevent Jest from crashing
const originalConsoleLog = console.log;
beforeAll(() => {
    console.log = jest.fn();
});

afterAll(() => {
    console.log = originalConsoleLog;
});

jest.mock("axios");
jest.mock("react-hot-toast");

// Mock the useAuth hook with a consistent return structure
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [{ token: "fake-token" }, jest.fn()]),
}));

// Mock Layout and AdminMenu components to simplify testing
jest.mock("../../components/Layout", () => {
    return {
        __esModule: true,
        default: ({ children, title }) => (
            <div data-testid="mock-layout">
                <div data-testid="layout-title">{title}</div>
                {children}
            </div>
        )
    };
});

jest.mock("../../components/AdminMenu", () => {
    return {
        __esModule: true,
        default: () => <div data-testid="mock-admin-menu"></div>
    };
});

describe("Users Component", () => {
    const mockUsers = [
        {
            _id: "1",
            name: "John Doe",
            email: "john@example.com",
            phone: "1234567890",
            address: "123 Main St",
            role: 1,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z"
        },
        {
            _id: "2",
            name: "Jane Smith",
            email: "jane@example.com",
            phone: "0987654321",
            address: "456 Oak Ave",
            role: 0,
            createdAt: "2024-01-02T00:00:00.000Z",
            updatedAt: "2024-01-02T00:00:00.000Z"
        }
    ];
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch and display users", async () => {
        axios.get.mockResolvedValueOnce({ data: mockUsers });

        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <Users />
                </MemoryRouter>
            );
        });

        const { findByText, findAllByRole } = rendered;

        await act(async () => {
            await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/users"));
        });

        // Check if users are displayed using the mockUsers data
        for (const user of mockUsers) {
            await findByText(user.name);
            await findByText(user.email);
            await findByText(user.phone);
            await findByText(user.address);
            
            if (user.role === 1) {
                await findByText("Admin");
            } else {
                await findByText("User");
            }
        }

        // Check table rows
        const rows = await findAllByRole("row");
        expect(rows).toHaveLength(mockUsers.length + 1);
    });

    // Test case for dynamic role display
    it("should display correct role labels based on user role value", async () => {
        axios.get.mockResolvedValueOnce({ data: mockUsers });

        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <Users />
                </MemoryRouter>
            );
        });

        const { findByText } = rendered;

        await act(async () => {
            await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/users"));
        });

        // Create a map to count how many of each role we expect
        const roleCounts = mockUsers.reduce((counts, user) => {
            const roleLabel = user.role === 1 ? "Admin" : "User";
            counts[roleLabel] = (counts[roleLabel] || 0) + 1;
            return counts;
        }, {});

        // Check that we find the right number of each role label
        if (roleCounts["Admin"]) {
            await findByText("Admin");
        }
        if (roleCounts["User"]) {
            await findByText("User");
        }
    });

    // Error handling
    it("should display error when failed fetching users", async () => {
        const error = new Error("Failed to fetch users");
        axios.get.mockRejectedValueOnce(error);

        await act(async () => {
            render(
                <MemoryRouter>
                    <Users />
                </MemoryRouter>
            );
        });

        await act(async () => {
            await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/users"));
        });
        
        expect(console.log).toHaveBeenCalledWith(error);
        expect(toast.error).toHaveBeenCalledWith("Error fetching users");
    });

    // Empty users list
    it("should handle empty users list gracefully", async () => {
        axios.get.mockResolvedValueOnce({ data: [] });

        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <Users />
                </MemoryRouter>
            );
        });

        const { findByText, findAllByRole } = rendered;

        await act(async () => {
            await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/users"));
        });
        
        // Should still display the title and table headers
        await findByText("All Users");
        await findByText("Name");
        await findByText("Email");
        await findByText("Phone");
        await findByText("Address");
        await findByText("Role");

        // Only header row should be present (no data rows)
        const rows = await findAllByRole("row");
        expect(rows).toHaveLength(1);
    });

    // No API call without auth token
    it("should not make API call without auth token", async () => {
        // Create a new mock that returns no token for this specific test
        const mockUseAuth = jest.requireMock("../../context/auth").useAuth;
        
        // Save the current mock return value for later restoration
        const originalImplementation = mockUseAuth.getMockImplementation();
        
        // Override the mock only for this test - return object without token
        mockUseAuth.mockReturnValue([{ user: { role: 1 } }, jest.fn()]);

        await act(async () => {
            render(
                <MemoryRouter>
                    <Users />
                </MemoryRouter>
            );
        });

        // Small delay to ensure component has rendered
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        // API should not be called
        expect(axios.get).not.toHaveBeenCalled();
        
        // Restore the original mock implementation
        mockUseAuth.mockImplementation(originalImplementation);
    });

    // Layout and title
    it("should render with correct title and layout", async () => {
        // Ensure useAuth returns a properly formatted array
        const mockUseAuth = jest.requireMock("../../context/auth").useAuth;
        mockUseAuth.mockReturnValue([{ token: "fake-token" }, jest.fn()]);
        
        axios.get.mockResolvedValueOnce({ data: [] });

        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <Users />
                </MemoryRouter>
            );
        });

        const { getByTestId } = rendered;

        // Check layout and title
        const layout = getByTestId("mock-layout");
        const title = getByTestId("layout-title");
        
        expect(layout).toBeInTheDocument();
        expect(title).toHaveTextContent("Dashboard - All Users");
        expect(getByTestId("mock-admin-menu")).toBeInTheDocument();
    });
});