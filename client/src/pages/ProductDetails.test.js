import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductDetails from './ProductDetails';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  MemoryRouter: ({ children }) => <div>{children}</div>,
}));
jest.mock('../components/Layout', () => ({ children }) => (
  <div>{children}</div>
));

describe('ProductDetails', () => {
  const mockNavigate = jest.fn();
  const mockParams = { slug: 'product-slug' };

  beforeEach(() => {
    useParams.mockReturnValue(mockParams);
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('should render the ProductDetails component with product details', async () => {
    const mockProductData = {
      data: {
        product: {
          _id: '1',
          name: 'Product 1',
          slug: 'product-1',
          price: 100,
          description: 'Description 1',
          category: { name: 'Category 1' },
        },
      },
    };
    const mockSimilarProductsData = {
      data: {
        products: [
          {
            _id: '2',
            name: 'Product 2',
            slug: 'product-2',
            price: 200,
            description: 'Description 2',
          },
          {
            _id: '3',
            name: 'Product 3',
            slug: 'product-3',
            price: 300,
            description: 'Description 3',
          },
        ],
      },
    };
    axios.get.mockImplementation((url) => {
      if (url.includes('get-product')) {
        return Promise.resolve(mockProductData);
      }
      if (url.includes('related-product')) {
        return Promise.resolve(mockSimilarProductsData);
      }
    });

    const { getByText, getByAltText } = render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Product Details')).toBeInTheDocument();
      expect(getByText('Name : Product 1')).toBeInTheDocument();
      expect(getByText('Description : Description 1')).toBeInTheDocument();
      expect(getByText('Price : $100.00')).toBeInTheDocument();
      expect(getByText('Category : Category 1')).toBeInTheDocument();
      expect(getByAltText('Product 1')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(getByText('Similar Products ➡️')).toBeInTheDocument();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(getByAltText('Product 2')).toBeInTheDocument();
      expect(getByText('Product 3')).toBeInTheDocument();
      expect(getByAltText('Product 3')).toBeInTheDocument();
    });
  });

  it('should navigate to the respective product details page when "More Details" button is clicked', async () => {
    const mockProductData = {
      data: {
        product: {
          _id: '1',
          name: 'Product 1',
          slug: 'product-1',
          price: 100,
          description: 'Description 1',
          category: { name: 'Category 1' },
        },
      },
    };
    const mockSimilarProductsData = {
      data: {
        products: [
          {
            _id: '2',
            name: 'Product 2',
            slug: 'product-2',
            price: 200,
            description: 'Description 2',
          },
        ],
      },
    };
    axios.get.mockImplementation((url) => {
      if (url.includes('get-product')) {
        return Promise.resolve(mockProductData);
      }
      if (url.includes('related-product')) {
        return Promise.resolve(mockSimilarProductsData);
      }
    });

    const { getByText } = render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Product 2')).toBeInTheDocument();
    });

    fireEvent.click(getByText('More Details'));

    expect(mockNavigate).toHaveBeenCalledWith('/product/product-2');
  });

  it('should render the ProductDetails component with no similar products', async () => {
    const mockProductData = {
      data: {
        product: {
          _id: '1',
          name: 'Product 1',
          slug: 'product-1',
          price: 100,
          description: 'Description 1',
          category: { name: 'Category 1' },
        },
      },
    };
    const mockSimilarProductsData = {
      data: {
        products: [],
      },
    };
    axios.get.mockImplementation((url) => {
      if (url.includes('get-product')) {
        return Promise.resolve(mockProductData);
      }
      if (url.includes('related-product')) {
        return Promise.resolve(mockSimilarProductsData);
      }
    });

    const { getByText } = render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Product Details')).toBeInTheDocument();
      expect(getByText('Name : Product 1')).toBeInTheDocument();
      expect(getByText('Description : Description 1')).toBeInTheDocument();
      expect(getByText('Price : $100.00')).toBeInTheDocument();
      expect(getByText('Category : Category 1')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(getByText('Similar Products ➡️')).toBeInTheDocument();
      expect(getByText('No Similar Products found')).toBeInTheDocument();
    });
  });
});
