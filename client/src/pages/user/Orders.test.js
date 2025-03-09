import React from "react";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Orders from "./Orders";
import { useAuth } from "../../context/auth";
import axios from "axios";

// Mock axios
jest.mock("axios");

// Mock useAuth hook to return null state and a mock function for setAuth
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
    useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../../context/search", () => ({
    useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));


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

// Mock orders data
const mockOrders = ({
    data: [
      {
        _id: "1",
        status: "Shipped",
        buyer: { name: "John Doe" },
        createdAt: "2023-03-01T12:00:00Z",
        payment: { success: true },
        products: [
          { _id: "p1", name: "Product 1", description: "Description 1. This is going to be a very long description. Intentionally longer than 200 characters so that we can test whether the description will be trimmed properly on the web page. Here are more dummy description characters to make it more than 200 characters.", price: 100 }
        ]
      },
      {
        _id: "2",
        status: "Not Process",
        buyer: { name: "John Doe" },
        createdAt: "2023-03-02T12:00:00Z",
        payment: { success: false },
        products: [
          { _id: "p2", name: "Product 2", description: "Description 2. Short Description.", price: 14.99 },
          { _id: "p3", name: "Product 3", description: "Description 3. Short Description.", price: 9.99 }
        ]
      }
    ]
});

describe("User Order Component", () => {

    localStorage.setItem("auth", mockAuthData); // Ensure localStorage has auth data
    
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue([
            JSON.parse(mockAuthData), // Return mock auth state
            jest.fn(), // Mock setAuth function
        ]);
    });

    test("renders correct order data", async () => {
        axios.get.mockResolvedValue(mockOrders);
        render(
            <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
                <Routes>
                    <Route path="/dashboard" element={<Outlet />} >
                        <Route path="user/orders" element={<Orders />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
        
        // Check if the order details are rendered correctly. Wait for loading.
        await waitFor(() => {
            expect(screen.getByText("Shipped")).toBeInTheDocument();
        
        })

        const johnDoeNames = screen.getAllByText("John Doe");
        expect(johnDoeNames.length).toBe(mockOrders.data.length + 1); // MockOrders has two orders for John Doe, plus the header row

        expect(johnDoeNames[0]).toBeInTheDocument();
        expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
        expect(screen.getByText("Success")).toBeInTheDocument();
        expect(screen.getByText("Product 1")).toBeInTheDocument();

        // Check the second order's details
        expect(screen.getByText("Not Process")).toBeInTheDocument();
        expect(johnDoeNames[1]).toBeInTheDocument();
        expect(screen.getByText("Failed")).toBeInTheDocument();
        expect(screen.getByText("Product 2")).toBeInTheDocument();
        expect(screen.getByText("Product 3")).toBeInTheDocument();
    })

    test("trims long descriptions to 200 characters with ellipsis", async () => {
        axios.get.mockResolvedValue(mockOrders);
        render(
          <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
            <Routes>
              <Route path="/dashboard" element={<Outlet />}>
                <Route path="user/orders" element={<Orders />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
    
        await waitFor(() => {
          const longDescription = mockOrders.data[0].products[0].description;
          const trimmedDescription = `${longDescription.substring(0, 200)}...`;
    
          // Check if the trimmed description is rendered correctly and with ellipsis
          expect(screen.getByText(trimmedDescription)).toBeInTheDocument();
        });
    });

    test("does not trim short descriptions", async () => {
        axios.get.mockResolvedValue(mockOrders);
        render(
          <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
            <Routes>
              <Route path="/dashboard" element={<Outlet />}>
                <Route path="user/orders" element={<Orders />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
    
        await waitFor(() => {
          const shortDescription = mockOrders.data[1].products[0].description;
    
          // Check if the short description is rendered without trimming and ellipsis
          expect(screen.getByText(shortDescription)).toBeInTheDocument();
        });
    });

    test("displays 'No orders found.' message when no orders", async () => {
        axios.get.mockResolvedValue({ data: [] });
        render(
            <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
                <Routes>
                    <Route path="/dashboard" element={<Outlet />} >
                        <Route path="user/orders" element={<Orders />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
    
        await waitFor(() => {
            expect(screen.getByText("No orders found.")).toBeInTheDocument();
        });
    });

    test("displays loading state when fetching orders", async () => {
        axios.get.mockImplementation(
          () =>
            new Promise((resolve) => setTimeout(() => resolve(mockOrders), 1000))
        );
        render(
          <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
            <Routes>
              <Route path="/dashboard" element={<Outlet />}>
                <Route path="user/orders" element={<Orders />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
    
        expect(screen.getByText("Loading...")).toBeInTheDocument();
        await waitFor(() => {
          expect(screen.getByText("All Orders")).toBeInTheDocument();
        });
      });
    
      test("displays error message when API call fails", async () => {
        axios.get.mockRejectedValue(new Error("Network Error"));
        render(
          <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
            <Routes>
              <Route path="/dashboard" element={<Outlet />}>
                <Route path="user/orders" element={<Orders />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
    
        await waitFor(() => {
          expect(
            screen.getByText("Failed to fetch orders. Please try again later.")
          ).toBeInTheDocument();
        });
      });

})