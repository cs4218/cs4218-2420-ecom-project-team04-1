import React from "react";
import { render, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Products from "./Products";
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

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../../context/cart", () => ({
    useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../../context/search", () => ({
    useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
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

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

describe("Products Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Fetch and display products
    it("should fetch and display products", async () => {
        const mockProducts = [
            {
                _id: "1",
                name: "Sample Product",
                slug: "sample-product",
                description: "This is a sample product description.",
                price: 9.99,
                category: {
                    _id: "cat1",
                    name: "Sample Category",
                    slug: "sample-category",
                    __v: 0
                },
                quantity: 100,
                shipping: true,
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
                __v: 0
            },
            {
                _id: "2",
                name: "Sample Product 2",
                slug: "sample-product-2",
                description: "This is a sample product description 2.",
                price: 19.99,
                category: {
                    _id: "cat2",
                    name: "Sample Category",
                    slug: "sample-category",
                    __v: 0
                },
                quantity: 50,
                shipping: false,
                createdAt: "2024-01-02T00:00:00.000Z",
                updatedAt: "2024-01-02T00:00:00.000Z",
                __v: 0
            }
        ];

        axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

        const { findByText, getAllByRole } = render(
            <MemoryRouter>
                <Products />
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"));

        for (const product of mockProducts) {
            await findByText(product.name);
            await findByText(product.description);
        }

        // Render product cards
        const links = getAllByRole("link", { className: "product-link" });
        expect(links).toHaveLength(mockProducts.length);
        links.forEach((link, index) => {
            expect(link).toHaveAttribute("href", `/dashboard/admin/product/${mockProducts[index].slug}`);
        });
    });

    // Error handling (toast error)
    it("should display error when failed fetching products", async () => {
        const error = new Error("Failed to fetch products");
        axios.get.mockRejectedValueOnce(error);

        render(
            <MemoryRouter>
                <Products />
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"));
        expect(console.log).toHaveBeenCalledWith(error);
        expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
    });

    // Empty product list
    it("should handle empty product list gracefully", async () => {
        axios.get.mockResolvedValueOnce({ data: { products: [] } });

        const { queryByRole } = render(
            <MemoryRouter>
                <Products />
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"));

        const links = queryByRole("link", { className: "product-link" });
        expect(links).toBeNull();
    });
});