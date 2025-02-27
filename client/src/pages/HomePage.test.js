import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import HomePage from './HomePage';
import { toBeInTheDocument } from '@testing-library/jest-dom/extend-expect';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));
describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and display categories', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }, { _id: '2', name: 'Category 2' }] },
    });

    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    await waitFor(() => expect(getByText('Category 1')).toBeInTheDocument());
    await waitFor(() => expect(getByText('Category 2')).toBeInTheDocument());
  });

  it('should fetch and display products', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 1 },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });
    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(getByText('Product 1')).toBeInTheDocument());
  });

  it('should fetch and set total product count', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 10 },
    });
  
    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-count');
    });
  });

  it('should load more products', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, products: [{ _id: '1', name: 'Product 1', price: 100, description: 'Description 1', slug: 'product-1' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, products: [{ _id: '2', name: 'Product 2', price: 200, description: 'Description 2', slug: 'product-2' }] },
    });
  
    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(getByText('Product 1')).toBeInTheDocument();
    });
  
    fireEvent.click(getByText('Loadmore'));
  
    await waitFor(() => {
      expect(getByText('Product 2')).toBeInTheDocument();
    });
  });
  
  it('should filter products by category', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }] },
    });
    axios.post.mockResolvedValueOnce({
      data: { products: [{ _id: '1', name: 'Filtered Product', price: 100, description: 'Description 1', slug: 'filtered-product' }] },
    });
  
    const { getByText, getByLabelText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(getByText('Category 1')).toBeInTheDocument();
    });
  
    fireEvent.click(getByLabelText('Category 1'));
  
    await waitFor(() => {
      expect(getByText('Filtered Product')).toBeInTheDocument();
    });
  });
});