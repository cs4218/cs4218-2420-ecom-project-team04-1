import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import HomePage from './HomePage';
import { toBeInTheDocument } from '@testing-library/jest-dom/extend-expect';
import { useCart } from "../context/cart";

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]),
}));

jest.mock('../hooks/useCategory', () => jest.fn(() => []));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('HomePage', () => {
  const mockNavigate = jest.fn();
  const mockSetCart = jest.fn();
  const mockCart = [];
  const originalLocation = window.location;
  beforeAll(() => {
    delete window.location;
    window.location = { ...originalLocation, reload: jest.fn() };
  });
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useCart.mockReturnValue([mockCart, mockSetCart]);
    Storage.prototype.setItem = jest.fn();
  });
  afterAll(() => {
    window.location = originalLocation;
  });
  it('should fetch and display categories', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [
          { _id: '1', name: 'Category 1' },
          { _id: '2', name: 'Category 2' },
        ],
      },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 2 },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Category 1 Product',
            price: 100,
            description: 'Description 1',
            slug: 'product-1',
          },
        ],
      },
    });

    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Category 1')).toBeInTheDocument();
      expect(getByText('Category 2')).toBeInTheDocument();
    });
  });

  it('should fetch and display products', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 1 },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Test Product',
            price: 100,
            description: 'Description 1',
            slug: 'product-1',
          },
        ],
      },
    });

    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('should fetch and set total product count', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 10 },
    });
    axios.get.mockResolvedValueOnce({
      data: { products: [] },
    });

    render(
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
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 4 },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Initial Product',
            price: 100,
            description: 'Description 1',
            slug: 'product-1',
          },
        ],
      },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '2',
            name: 'Loaded Product',
            price: 200,
            description: 'Description 2',
            slug: 'product-2',
          },
        ],
      },
    });

    const { getByText, queryByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Initial Product')).toBeInTheDocument();
      expect(queryByText('Loaded Product')).not.toBeInTheDocument();
    });

    fireEvent.click(getByText('Load more'));

    await waitFor(() => {
      expect(getByText('Loaded Product')).toBeInTheDocument();
    });
  });

  it('should filter products by category', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [
        { _id: '1', name: 'Test Category' },
        { _id: '2', name: 'Another Category' },
      ] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 2 },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Category 1 Product',
            price: 100,
            description: 'Description 1',
            slug: 'product-1',
          },
          {
            _id: '2',
            name: 'Another Category Product',
            price: 50,
            description: 'Description 2',
            slug: 'product-2',
          },
        ],
      },
    });
    axios.post.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Filtered Product',
            price: 100,
            description: 'Description 1',
            slug: 'filtered-product',
          },
        ],
      },
    });

    const { getByText, getByLabelText, queryByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Test Category')).toBeInTheDocument();
      expect(getByText('Another Category')).toBeInTheDocument();

    });

    fireEvent.click(getByLabelText('Test Category'));

    await waitFor(() => {
      expect(getByText('Filtered Product')).toBeInTheDocument();
      expect(queryByText('Other Category Product')).not.toBeInTheDocument();
    });
  });

  it('should filter products by price', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 1 },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Filtered Product',
            price: 150,
            description: 'Description 1',
            slug: 'filtered-product',
          },
          {
            _id: '2',
            name: 'Another Product',
            price: 50,
            description: 'Description 2',
            slug: 'non-filtered-product',
          },
        ],
      },
    });
    axios.post.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Filtered Product',
            price: 150,
            description: 'Description 1',
            slug: 'filtered-product',
          },
        ],
      },
    });

    const { getByText, getByLabelText, queryByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Filter By Price')).toBeInTheDocument();
    });

    fireEvent.click(getByLabelText('$100 or more'));

    await waitFor(() => {
      expect(getByText('Filtered Product')).toBeInTheDocument();
      expect(queryByText('Another Product')).not.toBeInTheDocument();
    });
  });
  
  it('should filter products by both price and category', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [
        { _id: '1', name: 'Test Category' },
        { _id: '2', name: 'Another Category' },
      ] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 2 },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Filtered Product',
            price: 150,
            description: 'Description 1',
            slug: 'filtered-product',
          },
          {
            _id: '2',
            name: 'Another Category Product',
            price: 50,
            description: 'Description 2',
            slug: 'another-category-product',
          },
        ],
      },
    });
    axios.post.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Filtered Product',
            price: 150,
            description: 'Description 1',
            slug: 'filtered-product',
          },
        ],
      },
    });

    const { getByText, getByLabelText, queryByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Test Category')).toBeInTheDocument();
      expect(getByText('Another Category')).toBeInTheDocument();
      expect(getByText('Filter By Price')).toBeInTheDocument();
    });

    fireEvent.click(getByLabelText('Test Category'));
    fireEvent.click(getByLabelText('$100 or more'));

    await waitFor(() => {
      expect(getByText('Filtered Product')).toBeInTheDocument();
      expect(queryByText('Another Category Product')).not.toBeInTheDocument();
    });
  });

  it('should reset filters when "RESET FILTERS" button is clicked', async () => {
    window.location.reload.mockClear();
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [
        { _id: '1', name: 'Test Category' },
        { _id: '2', name: 'Other Category' },
      ] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 2 },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Product 1',
            price: 100,
            description: 'Description 1',
            slug: 'product-1',
          },
          {
            _id: '2',
            name: 'Product 2',
            price: 200,
            description: 'Description 2',
            slug: 'product-2',
          },
        ],
      },
    });

    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Product 1')).toBeInTheDocument();
      expect(getByText('Product 2')).toBeInTheDocument();
    });

    fireEvent.click(getByText('RESET FILTERS'));

    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('should navigate to product details page when "More Details" button is clicked', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 1 },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Product 1',
            price: 100,
            description: 'Description 1',
            slug: 'product-1',
          },
        ],
      },
    });

    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Product 1')).toBeInTheDocument();
    });

    fireEvent.click(getByText('More Details'));

    expect(mockNavigate).toHaveBeenCalledWith('/product/product-1');
  });

  it('should add product to cart when "ADD TO CART" button is clicked', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 1 },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Product 1',
            price: 100,
            description: 'Description 1',
            slug: 'product-1',
          },
        ],
      },
    });
    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Product 1')).toBeInTheDocument();
    });

    fireEvent.click(getByText('ADD TO CART'));

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, {
      _id: '1',
      name: 'Product 1',
      price: 100,
      description: 'Description 1',
      slug: 'product-1',
    }]);
    expect(localStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify([{
      _id: '1',
      name: 'Product 1',
      price: 100,
      description: 'Description 1',
      slug: 'product-1',
    }]));
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });

  it('should log error to console when fetching categories fails', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch categories'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(new Error('Failed to fetch categories'));
    });
  });

  it('should log error to console when fetching products fails', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch products'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(new Error('Failed to fetch products'));
    });
  });
});
