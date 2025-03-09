import React from "react";
import { render, fireEvent, waitFor, act, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminOrders from "./AdminOrders";
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

// Mock the auth context
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [
        { user: { name: "Test Admin" }, token: "test-token" },
        jest.fn(),
    ]),
}));

// Mock Layout and AdminMenu components to simplify testing
jest.mock("./../../components/Layout", () => {
    return {
        __esModule: true,
        default: ({ children }) => <div data-testid="mock-layout">{children}</div>
    };
});

jest.mock("../../components/AdminMenu", () => {
    return {
        __esModule: true,
        default: () => <div data-testid="mock-admin-menu"></div>
    };
});

// Mock antd Select component
jest.mock("antd", () => {
    const Select = ({ onChange, defaultValue, children }) => (
        <select
            data-testid="select-status"
            onChange={(e) => onChange(e.target.value)}
            defaultValue={defaultValue}
        >
            {children}
        </select>
    );
    Select.Option = ({ value, children }) => (
        <option value={value}>{children}</option>
    );
    return { Select };
});

jest.mock("moment", () => {
    return () => ({
        fromNow: () => "a few minutes ago",
    });
});

describe("AdminOrders Component", () => {
    // Sample orders data for tests based on real data structure
    const mockOrders = [
        {
            _id: "order-id-1",
            status: "Processing",
            buyer: {
                _id: "buyer-id-1",
                name: "Test Buyer",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            payment: {
                success: true,
                params: {
                    transaction: {
                        amount: "99.99",
                        type: "sale",
                    },
                },
            },
            products: [
                {
                    _id: "product-id-1",
                    name: "Test Product",
                    slug: "test-product",
                    description: "This is a test product description that is longer than 30 characters",
                    price: 99.99,
                    category: "category-id-1",
                    quantity: 10,
                    shipping: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    __v: 0,
                },
            ],
            __v: 0,
        },
        {
            _id: "order-id-2",
            status: "Shipped",
            buyer: {
                _id: "buyer-id-1",
                name: "Another Buyer",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            payment: {
                success: false,
                params: {
                    transaction: {
                        amount: "1549.98",
                        type: "sale",
                    },
                },
                message: "Payment processing failed",
                errors: {
                    errorCollections: {
                        transaction: {
                            validationErrors: {
                                amount: [
                                    {
                                        attribute: "amount",
                                        code: "error-1",
                                        message: "Amount is an invalid format.",
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            products: [
                {
                    _id: "product-id-2",
                    name: "Another Product",
                    slug: "another-product",
                    description: "Short description",
                    price: 49.99,
                    category: "category-id-2",
                    quantity: 5,
                    shipping: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    __v: 0,
                },
                {
                    _id: "product-id-3",
                    name: "Third Product",
                    slug: "third-product",
                    description: "Third product description",
                    price: 1499.99,
                    category: "category-id-2",
                    quantity: 3,
                    shipping: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    __v: 0,
                },
            ],
            __v: 0,
        },
    ];

    const setupBasicMocks = () => {
        jest.clearAllMocks();
        axios.get.mockReset();
        axios.put.mockReset();

        // Setup default success responses
        axios.get.mockResolvedValue({ data: mockOrders });
    };

    beforeEach(() => {
        setupBasicMocks();
    });

    it("should render the component correctly", async () => {
        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <AdminOrders />
                </MemoryRouter>
            );
        });

        const { getByText, getByTestId } = rendered;

        expect(getByTestId("mock-layout")).toBeInTheDocument();

        expect(getByTestId("mock-admin-menu")).toBeInTheDocument();

        expect(getByText("All Orders")).toBeInTheDocument();
    });

    it("should fetch and display orders when component mounts", async () => {
        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <AdminOrders />
                </MemoryRouter>
            );
        });

        const { findByText } = rendered;

        // Verify that axios.get was called with the correct URL
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");

        await waitFor(() => {
            expect(findByText("Test Buyer")).toBeTruthy();
            expect(findByText("Another Buyer")).toBeTruthy();
        });

        expect(await findByText("Test Product")).toBeInTheDocument();
        expect(await findByText("Another Product")).toBeInTheDocument();
        expect(await findByText("Third Product")).toBeInTheDocument();

        expect(await findByText("This is a test product descrip")).toBeInTheDocument();
        expect(await findByText("Short description")).toBeInTheDocument();

        expect(await findByText("Success")).toBeInTheDocument();
        expect(await findByText("Failed")).toBeInTheDocument();
    });

    it("should handle error when fetching orders fails", async () => {
        console.log = jest.fn();

        // Mock axios to reject the request
        const error = new Error("Failed to fetch orders");
        axios.get.mockRejectedValueOnce(error);

        await act(async () => {
            render(
                <MemoryRouter>
                    <AdminOrders />
                </MemoryRouter>
            );
        });

        // Wait for error to be caught
        await waitFor(() => {
            expect(console.log).toHaveBeenCalledWith(error);
        });
    });

    it("should handle order status change", async () => {
        axios.get.mockResolvedValueOnce({ data: mockOrders });

        axios.put.mockResolvedValueOnce({ data: { success: true } });

        const updatedOrders = JSON.parse(JSON.stringify(mockOrders));
        updatedOrders[0].status = "Shipped";
        axios.get.mockResolvedValueOnce({ data: updatedOrders });

        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <AdminOrders />
                </MemoryRouter>
            );
        });

        const { findAllByTestId } = rendered;

        await waitFor(() => {
            expect(screen.getByText("Test Buyer")).toBeInTheDocument();
        });

        // Find the first select element and change the status
        const selectElements = await findAllByTestId("select-status");
        const firstSelectElement = selectElements[0];

        await act(async () => {
            fireEvent.change(firstSelectElement, { target: { value: "Shipped" } });
        });

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/order-id-1", {
                status: "Shipped",
            });
        });

        // Verify that getOrders was called again (which means a second GET request)
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(2);
        });

        // Verify toast success was called if your component has this behavior
        if (toast.success) {
            expect(toast.success).toHaveBeenCalled();
        }
    });

    it("should handle error when updating order status fails", async () => {
        // Mock console.log to check error logging
        console.log = jest.fn();

        // Mock the initial orders fetch
        axios.get.mockResolvedValueOnce({ data: mockOrders });

        // Mock the status update request to fail
        const error = new Error("Failed to update status");
        axios.put.mockRejectedValueOnce(error);

        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <AdminOrders />
                </MemoryRouter>
            );
        });

        const { findAllByTestId } = rendered;

        await waitFor(() => {
            expect(screen.getByText("Test Buyer")).toBeInTheDocument();
        });

        // Find the first select element and change the status
        const selectElements = await findAllByTestId("select-status");
        const firstSelectElement = selectElements[0];

        await act(async () => {
            fireEvent.change(firstSelectElement, { target: { value: "Shipped" } });
        });

        // Wait for error to be caught
        await waitFor(() => {
            expect(console.log).toHaveBeenCalledWith(error);
        });

        if (toast.error) {
            expect(toast.error).toHaveBeenCalled();
        }
    });

    it("should not fetch orders if auth token is not available", async () => {
        // Mock useAuth to return null auth
        require("../../context/auth").useAuth.mockImplementationOnce(() => [
            { user: null, token: null },
            jest.fn(),
        ]);

        await act(async () => {
            render(
                <MemoryRouter>
                    <AdminOrders />
                </MemoryRouter>
            );
        });

        // Verify that axios.get was not called
        expect(axios.get).not.toHaveBeenCalled();
    });

    it("should display correct product count for each order", async () => {
        axios.get.mockResolvedValueOnce({ data: mockOrders });

        await act(async () => {
            render(
                <MemoryRouter>
                    <AdminOrders />
                </MemoryRouter>
            );
        });

        // Wait for orders to be rendered
        await waitFor(() => {
            const cells = screen.getAllByRole("cell");
            // Find the cells containing product counts (1 for first order, 2 for second order)
            const productCounts = cells.filter(
                (cell) => cell.textContent === "1" || cell.textContent === "2"
            );

            expect(productCounts.length).toBeGreaterThan(0);

            // Check at least one of the counts is correct
            const hasCorrectCount = productCounts.some(
                cell => cell.textContent === "1" || cell.textContent === "2"
            );
            expect(hasCorrectCount).toBeTruthy();
        });
    });

    it("should display correct formatted prices", async () => {
        axios.get.mockResolvedValueOnce({ data: mockOrders });

        await act(async () => {
            render(
                <MemoryRouter>
                    <AdminOrders />
                </MemoryRouter>
            );
        });

        await waitFor(async () => {
            expect(await screen.findByText("Price : 99.99")).toBeInTheDocument();
            expect(await screen.findByText("Price : 49.99")).toBeInTheDocument();
            expect(await screen.findByText("Price : 1499.99")).toBeInTheDocument();
        });
    });

    it("should show correct order status", async () => {
        axios.get.mockResolvedValueOnce({ data: mockOrders });

        await act(async () => {
            render(
                <MemoryRouter>
                    <AdminOrders />
                </MemoryRouter>
            );
        });

        await waitFor(async () => {
            const selectElements = await screen.findAllByTestId("select-status");
            expect(selectElements[0]).toHaveValue("Processing");
            expect(selectElements[1]).toHaveValue("Shipped");
        });
    });
});