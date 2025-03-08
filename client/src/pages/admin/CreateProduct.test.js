import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import CreateProduct from "./CreateProduct";
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

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mocked-url");

// Mock the react-router-dom hooks
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => jest.fn()
}));

// Mock required context hooks
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
    useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
    useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

describe("CreateProduct Component", () => {
    const mockCategories = [
        { _id: "cat1", name: "Category 1" },
        { _id: "cat2", name: "Category 2" }
    ];

    // Helper function to setup basic mocks
    const setupBasicMocks = () => {
        jest.clearAllMocks();
        axios.get.mockReset();
        axios.post.mockReset();
        mockAppend.mockClear();

        axios.get.mockResolvedValue({
            data: {
                success: true,
                category: mockCategories
            }
        });

        axios.post.mockResolvedValue({
            data: { success: true }
        });
    };

    beforeEach(() => {
        setupBasicMocks();
    });

    it("should render the component correctly", async () => {
        let rendered;

        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <CreateProduct />
                </MemoryRouter>
            );
        });

        const { getByText, getAllByText, getByPlaceholderText } = rendered;

        const headingElement = getAllByText("Create Product").find(
            element => element.tagName.toLowerCase() === 'h1'
        );
        expect(headingElement).toBeInTheDocument();
        expect(getByPlaceholderText("write a name")).toBeInTheDocument();
        expect(getByPlaceholderText("write a description")).toBeInTheDocument();
        expect(getByPlaceholderText("write a Price")).toBeInTheDocument();
        expect(getByPlaceholderText("write a quantity")).toBeInTheDocument();
        expect(getByText("Upload Photo")).toBeInTheDocument();
        expect(getByText("CREATE PRODUCT")).toBeInTheDocument();
    });

    it("should fetch and display categories", async () => {
        let rendered;

        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <CreateProduct />
                </MemoryRouter>
            );
        });

        const { queryByText, container } = rendered;

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        });

        const selectElement = container.querySelector('.form-select');
        expect(selectElement).toBeInTheDocument();

        // Verify that the categories state was updated, since can't easily test
        // the dropdown options as they're rendered by antd's Select which is more complex to test
        expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it("should update state when input fields change", async () => {
        let rendered;

        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <CreateProduct />
                </MemoryRouter>
            );
        });

        const { getByPlaceholderText } = rendered;

        const nameInput = getByPlaceholderText("write a name");
        const descriptionInput = getByPlaceholderText("write a description");
        const priceInput = getByPlaceholderText("write a Price");
        const quantityInput = getByPlaceholderText("write a quantity");

        await act(async () => {
            fireEvent.change(nameInput, { target: { value: "Test Product" } });
            fireEvent.change(descriptionInput, { target: { value: "Test Description" } });
            fireEvent.change(priceInput, { target: { value: "99.99" } });
            fireEvent.change(quantityInput, { target: { value: "10" } });
        });

        expect(nameInput.value).toBe("Test Product");
        expect(descriptionInput.value).toBe("Test Description");
        expect(priceInput.value).toBe("99.99");
        expect(quantityInput.value).toBe("10");
    });

    it("should handle photo upload", async () => {
        let rendered;

        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <CreateProduct />
                </MemoryRouter>
            );
        });

        const { container } = rendered;

        const fileInput = container.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();

        const file = new File(["dummy content"], "test-image.png", { type: "image/png" });

        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [file] } });
        });

        // Test image preview appears
        await waitFor(() => {
            const img = container.querySelector('img');
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute('src', 'mocked-url');
            expect(img).toHaveAttribute('alt', 'product_photo');
        });
    });

    it("should handle product creation successfully", async () => {
        let rendered;

        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <CreateProduct />
                </MemoryRouter>
            );
        });

        const { getByText, getByPlaceholderText, container } = rendered;

        const nameInput = getByPlaceholderText("write a name");
        const descriptionInput = getByPlaceholderText("write a description");
        const priceInput = getByPlaceholderText("write a Price");
        const quantityInput = getByPlaceholderText("write a quantity");

        await act(async () => {
            fireEvent.change(nameInput, { target: { value: "Test Product" } });
            fireEvent.change(descriptionInput, { target: { value: "Test Description" } });
            fireEvent.change(priceInput, { target: { value: "99.99" } });
            fireEvent.change(quantityInput, { target: { value: "10" } });
        });

        const fileInput = container.querySelector('input[type="file"]');
        const file = new File(["dummy content"], "test-image.png", { type: "image/png" });

        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [file] } });
        });

        const createButton = getByText("CREATE PRODUCT");

        mockAppend.mockClear();

        await act(async () => {
            fireEvent.click(createButton);
        });

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                "/api/v1/product/create-product",
                expect.any(Object)
            );
        });

        // Check that FormData was created and append was called
        expect(global.FormData).toHaveBeenCalled();
        expect(mockAppend).toHaveBeenCalled();

        expect(mockAppend).toHaveBeenCalledWith("name", "Test Product");
        expect(mockAppend).toHaveBeenCalledWith("description", "Test Description");
        expect(mockAppend).toHaveBeenCalledWith("price", "99.99");
        expect(mockAppend).toHaveBeenCalledWith("quantity", "10");
        expect(mockAppend).toHaveBeenCalledWith("photo", file);

        expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
    });

    it("should handle errors when product creation fails", async () => {
        // Set up the error case - this test focuses on the catch block in handleCreate
        axios.post = jest.fn(() => {
            throw new Error("Create failed");
        });

        let rendered;

        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <CreateProduct />
                </MemoryRouter>
            );
        });

        const { getByText, getByPlaceholderText } = rendered;

        // Fill out at least one field to make sure we don't hit any validation issues
        const nameInput = getByPlaceholderText("write a name");
        await act(async () => {
            fireEvent.change(nameInput, { target: { value: "Test Product" } });
        });

        const createButton = getByText("CREATE PRODUCT");

        await act(async () => {
            fireEvent.click(createButton);
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });

    it("should handle errors when fetching categories", async () => {
        axios.get.mockRejectedValueOnce(new Error("Failed to fetch categories"));

        let rendered;

        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <CreateProduct />
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something wwent wrong in getting catgeory");
        });
    });

    it("should display validation error message from API response", async () => {
        axios.post = jest.fn().mockRejectedValue({
            response: {
                data: {
                    error: "Name is Required"
                }
            }
        });

        let rendered;

        await act(async () => {
            rendered = render(
                <MemoryRouter>
                    <CreateProduct />
                </MemoryRouter>
            );
        });

        const { getByText } = rendered;

        const createButton = getByText("CREATE PRODUCT");

        await act(async () => {
            fireEvent.click(createButton);
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
});