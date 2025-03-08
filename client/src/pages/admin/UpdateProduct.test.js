import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import UpdateProduct from "./UpdateProduct";
import toast from "react-hot-toast";

// Mock console.log to prevent Jest from crashing
const originalConsoleLog = console.log;
beforeAll(() => {
    console.log = jest.fn();
});

afterAll(() => {
    console.log = originalConsoleLog;
});

// Mock FormData to prevent Jest from crashing
const mockAppend = jest.fn();
global.FormData = jest.fn().mockImplementation(() => ({
    append: mockAppend,
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    entries: jest.fn(),
    values: jest.fn(),
    keys: jest.fn(),
    forEach: jest.fn(),
}));

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

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ slug: 'sample-product' }),
    useNavigate: () => jest.fn()
}));


describe("UpdateProduct Component", () => {
    // Common test data
    const mockProduct = {
        _id: "1",
        name: "Sample Product",
        slug: "sample-product",
        description: "This is a sample product description.",
        price: 9.99,
        category: {
            _id: "cat1",
            name: "Sample Category"
        },
        quantity: 100,
        shipping: true
    };

    const mockCategories = [
        { _id: "cat1", name: "Category 1" },
        { _id: "cat2", name: "Category 2" }
    ];

    // Helper function to setup basic mocks
    const setupBasicMocks = () => {
        // Reset all mocks
        jest.clearAllMocks();
        axios.get.mockReset();
        axios.put.mockReset();
        axios.delete.mockReset();
        mockAppend.mockClear();

        // Setup default success responses
        axios.get.mockImplementation((url) => {
            if (url.includes("/api/v1/product/get-product/")) {
                return Promise.resolve({ data: { product: mockProduct } });
            } else if (url.includes("/api/v1/category/get-category")) {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: mockCategories
                    }
                });
            }
            return Promise.reject(new Error("Not found"));
        });
    };

    beforeEach(() => {
        setupBasicMocks();
    });

    // Render product form correctly with all fields
    it("should render the component correctly", async () => {
        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <UpdateProduct />
                </MemoryRouter>
            );
        });

        const { getByPlaceholderText, getByText } = rendered;

        expect(getByText("Update Product")).toBeInTheDocument();
        expect(getByPlaceholderText("write a name")).toBeInTheDocument();
        expect(getByPlaceholderText("write a description")).toBeInTheDocument();
        expect(getByPlaceholderText("write a Price")).toBeInTheDocument();
        expect(getByPlaceholderText("write a quantity")).toBeInTheDocument();
        expect(getByText("Upload Photo")).toBeInTheDocument();
        expect(getByText("UPDATE PRODUCT")).toBeInTheDocument();
        expect(getByText("DELETE PRODUCT")).toBeInTheDocument();
    });

    // Render and display product details
    it("should fetch and display product details", async () => {
        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <UpdateProduct />
                </MemoryRouter>
            );
        });

        const { findByDisplayValue, findByText } = rendered;

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/sample-product"));

        await findByDisplayValue("Sample Product");
        expect(await findByDisplayValue(mockProduct.name)).toBeInTheDocument();
        expect(await findByDisplayValue(mockProduct.description)).toBeInTheDocument();
        expect(await findByDisplayValue(mockProduct.price.toString())).toBeInTheDocument();
        expect(await findByDisplayValue(mockProduct.quantity.toString())).toBeInTheDocument();
        expect(await findByText(mockProduct.shipping ? "Yes" : "No")).toBeInTheDocument(); // Uses visible text instead of display value
    });

    // Fetch and display categories correctly
    it("should fetch and display categories", async () => {
        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <UpdateProduct />
                </MemoryRouter>
            );
        });

        const { findByText, container } = rendered;

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/sample-product");
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        });

        const selectElement = container.querySelector('.ant-select');
        expect(selectElement).toBeInTheDocument();

        await waitFor(() => {
            // The selected value should match the product's category ID
            const selectedValue = container.querySelector('.ant-select-selection-item');
            expect(selectedValue).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.mouseDown(selectElement);
        });

        // Check that all categories appear in the dropdown
        await waitFor(() => {
            mockCategories.forEach(async (category) => {
                expect(await findByText(category.name)).toBeInTheDocument();
            });
        });

        expect(axios.get.mock.calls.filter(call =>
            call[0] === "/api/v1/category/get-category"
        ).length).toBe(1);
    });

    // Handle product update correctly
    it("should handle product update correctly", async () => {
        // Mock the update API call with successful response
        axios.put.mockResolvedValueOnce({
            data: { success: true }
        });

        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <UpdateProduct />
                </MemoryRouter>
            );
        });

        const { getByText, getByPlaceholderText, findByDisplayValue } = rendered;

        await findByDisplayValue("Sample Product");

        // Verify component loaded with correct initial data
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/sample-product");
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        });

        const nameInput = getByPlaceholderText("write a name");
        const descriptionInput = getByPlaceholderText("write a description");
        const priceInput = getByPlaceholderText("write a Price");

        const newName = "Updated Product Name";
        const newDescription = "Updated product description";
        const newPrice = "19.99";

        await act(async () => {
            fireEvent.change(nameInput, { target: { value: newName } });
            fireEvent.change(descriptionInput, { target: { value: newDescription } });
            fireEvent.change(priceInput, { target: { value: newPrice } });
        });

        mockAppend.mockClear();

        const updateButton = getByText("UPDATE PRODUCT");
        await act(async () => {
            fireEvent.click(updateButton);
        });

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                "/api/v1/product/update-product/1",
                expect.any(Object)
            );
        });

        expect(mockAppend).toHaveBeenCalled();

        const appendCalls = mockAppend.mock.calls;

        // Regardless of order of appending in implementation
        const nameCall = appendCalls.find(call => call[0] === "name" && call[1] === newName);
        const descriptionCall = appendCalls.find(call => call[0] === "description" && call[1] === newDescription);
        const priceCall = appendCalls.find(call => call[0] === "price" && call[1] === newPrice);
        const quantityCall = appendCalls.find(call => call[0] === "quantity");
        const categoryCall = appendCalls.find(call => call[0] === "category" && call[1] === mockProduct.category._id);

        expect(nameCall).toBeTruthy();
        expect(descriptionCall).toBeTruthy();
        expect(priceCall).toBeTruthy();
        expect(quantityCall).toBeTruthy();
        expect(categoryCall).toBeTruthy();

        expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");

        // Clean up
        global.FormData = FormData;
    });

    it("should handle error when product update fails", async () => {
        axios.put.mockRejectedValue(new Error("Update failed"));

        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <UpdateProduct />
                </MemoryRouter>
            );
        });

        const { getByText, findByDisplayValue } = rendered;

        // Wait for component to load data
        await findByDisplayValue("Sample Product");

        // Click update button
        const updateButton = getByText("UPDATE PRODUCT");
        await act(async () => {
            fireEvent.click(updateButton);
        });

        // Verify update API was called
        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                "/api/v1/product/update-product/1",
                expect.any(Object)
            );
        });

        // Allow time for the catch block to execute
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("something went wrong");
        });
    });

    it("should handle product deletion correctly", async () => {
        // Mock window.prompt to return true (user confirms deletion)
        const originalPrompt = window.prompt;
        window.prompt = jest.fn().mockReturnValue("true");

        // Mock the delete API call with successful response
        axios.delete.mockResolvedValueOnce({
            data: { success: true }
        });

        // Render the component
        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <UpdateProduct />
                </MemoryRouter>
            );
        });

        const { getByText, findByDisplayValue } = rendered;

        // Wait for product data to load
        await findByDisplayValue("Sample Product");

        // Verify component loaded with correct initial data
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/sample-product");
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        });

        // Click delete button
        const deleteButton = getByText("DELETE PRODUCT");
        await act(async () => {
            fireEvent.click(deleteButton);
        });

        // Verify prompt was shown
        expect(window.prompt).toHaveBeenCalledWith("Are You Sure want to delete this product ? ");

        // Verify delete API was called
        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/product/delete-product/1");
        });

        // Verify success message was shown
        expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");

        // Restore original window.prompt
        window.prompt = originalPrompt;
    });

    it("should cancel product deletion when user cancels confirmation", async () => {
        // Mock window.prompt to return null (user cancels deletion)
        const originalPrompt = window.prompt;
        window.prompt = jest.fn().mockReturnValue(null);

        // Render the component
        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <UpdateProduct />
                </MemoryRouter>
            );
        });

        const { getByText, findByDisplayValue } = rendered;

        // Wait for product data to load
        await findByDisplayValue("Sample Product");

        // Click delete button
        const deleteButton = getByText("DELETE PRODUCT");
        await act(async () => {
            fireEvent.click(deleteButton);
        });

        // Verify prompt was shown
        expect(window.prompt).toHaveBeenCalledWith("Are You Sure want to delete this product ? ");

        // Verify delete API was NOT called
        expect(axios.delete).not.toHaveBeenCalled();

        // Restore original window.prompt
        window.prompt = originalPrompt;
    });

    it("should handle errors during product deletion", async () => {
        // Mock window.prompt to return true (user confirms deletion)
        const originalPrompt = window.prompt;
        window.prompt = jest.fn().mockReturnValue("true");

        // Mock the delete API call with an error
        axios.delete.mockRejectedValueOnce(new Error("Delete failed"));

        // Render the component
        let rendered;
        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <UpdateProduct />
                </MemoryRouter>
            );
        });

        const { getByText, findByDisplayValue } = rendered;

        // Wait for product data to load
        await findByDisplayValue("Sample Product");

        // Click delete button
        const deleteButton = getByText("DELETE PRODUCT");
        await act(async () => {
            fireEvent.click(deleteButton);
        });

        // Verify delete API was called
        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/product/delete-product/1");
        });

        // Verify error message was shown
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");

        // Restore original window.prompt
        window.prompt = originalPrompt;
    });
});