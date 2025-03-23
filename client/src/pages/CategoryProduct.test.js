import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CategoryProduct from './CategoryProduct';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  MemoryRouter: ({ children }) => <div>{children}</div>,
}));
jest.mock('../components/Layout', () => ({ children }) => (
  <div>{children}</div>
));

describe('CategoryProduct', () => {
  const mockNavigate = jest.fn();
  const mockParams = { slug: 'category-slug' };

  beforeEach(() => {
    useParams.mockReturnValue(mockParams);
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('should render the CategoryProduct component with respective products', async () => {
    const mockData = {
      data: {
        products: [
          {
            _id: '1',
            name: 'Product 1',
            slug: 'product-1',
            price: 100,
            description: 'Description 1',
          },
          {
            _id: '2',
            name: 'Product 2',
            slug: 'product-2',
            price: 200,
            description: 'Description 2',
          },
        ],
        category: { name: 'Category 1' },
      },
    };
    axios.get.mockResolvedValue(mockData);

    const { getByText, getByAltText } = render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Category - Category 1')).toBeInTheDocument();
      expect(getByText('2 result found')).toBeInTheDocument();
      expect(getByText('Product 1')).toBeInTheDocument();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(getByAltText('Product 1')).toBeInTheDocument();
      expect(getByAltText('Product 2')).toBeInTheDocument();
    });
  });

  it('should navigate to product details page when "More Details" button is clicked', async () => {
    const mockData = {
      data: {
        products: [
          {
            _id: '1',
            name: 'Product 1',
            slug: 'product-1',
            price: 100,
            description: 'Description 1',
          },
        ],
        category: { name: 'Category Name' },
      },
    };
    axios.get.mockResolvedValue(mockData);

    const { getByText } = render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Product 1')).toBeInTheDocument();
    });

    fireEvent.click(getByText('More Details'));

    expect(mockNavigate).toHaveBeenCalledWith('/product/product-1');
  });

  it('should render the CategoryProduct component with no products', async () => {
    const mockData = {
      data: {
        products: [],
        category: { name: 'Category 1' },
      },
    };
    axios.get.mockResolvedValue(mockData);

    const { getByText } = render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Category - Category 1')).toBeInTheDocument();
      expect(getByText('0 result found')).toBeInTheDocument();
    });
  });

  it('should handle error when getting products by category fails', async () => {
    const consoleErrorMock = jest
      .spyOn(console, 'log')
      .mockImplementation(() => {});
    const errorMessage = 'Network Error';
    axios.get.mockRejectedValue(new Error(errorMessage));

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalledWith(new Error(errorMessage));
    });

    consoleErrorMock.mockRestore();
  });

  it('should not fetch products when params.slug is undefined', async () => {
    // Clear all mocks before test
    jest.clearAllMocks();

    // Mock useParams to return undefined slug
    useParams.mockReturnValue({}); // Changed to empty object instead of {slug: undefined}

    const mockGetProducts = jest.spyOn(axios, 'get');

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // No need to wait, verify immediately
    expect(mockGetProducts).not.toHaveBeenCalled();
  });
});
