import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductDetails from './ProductDetails';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/cart';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import { act } from 'react-dom/test-utils';
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
jest.mock('../components/Layout', () => ({ children }) => <div>{children}</div>);

describe('ProductDetails', () => {
  const mockNavigate = jest.fn();
  const mockParams = { slug: 'product-slug' };
  const mockSetCart = jest.fn();
  const mockCart = [];
  beforeEach(() => {
    useParams.mockReturnValue(mockParams);
    useNavigate.mockReturnValue(mockNavigate);
    useCart.mockReturnValue([mockCart, mockSetCart]);
    Storage.prototype.setItem = jest.fn();
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
          { _id: '2', name: 'Product 2', slug: 'product-2', price: 200, description: 'Description 2' },
          { _id: '3', name: 'Product 3', slug: 'product-3', price: 300, description: 'Description 3' },
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
      expect(getByText('Price :$100.00')).toBeInTheDocument();
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
          { _id: '2', name: 'Product 2', slug: 'product-2', price: 200, description: 'Description 2' },
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
    await waitFor(() => getByText('Product 2'));
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
      expect(getByText('Price :$100.00')).toBeInTheDocument();
      expect(getByText('Category : Category 1')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(getByText('Similar Products ➡️')).toBeInTheDocument();
      expect(getByText('No Similar Products found')).toBeInTheDocument();
    });
  });

  it('should log an error if fetching product details fails', async () => {
    const mockError = new Error('Failed to fetch product details');
    axios.get.mockRejectedValueOnce(mockError);
  
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
    });
  
    consoleSpy.mockRestore();
  });
  
  it('should log an error if fetching similar products fails', async () => {
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
    const mockError = new Error('Failed to fetch similar products');
    axios.get.mockImplementation((url) => {
      if (url.includes('get-product')) {
        return Promise.resolve(mockProductData);
      }
      if (url.includes('related-product')) {
        return Promise.reject(mockError);
      }
    });
  
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
    });
  
    consoleSpy.mockRestore();
  });

  it('should add the product to the cart when "ADD TO CART" button is clicked', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        product: {
          _id: '1',
          name: 'Product 1',
          slug: 'product-1',
          price: 100,
          description: 'Description 1',
          category: { _id: '10', name: 'Category 1' },
        },
      },
    });
  
    // Mock the related products data
    axios.get.mockResolvedValueOnce({
      data: {
        products: [],
      },
    });
  
    const { getByText } = render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>
    );

    await act(async () => {
      await waitFor(() => {
        expect(getByText('ADD TO CART')).toBeInTheDocument();
      });
    });
  
    fireEvent.click(getByText('ADD TO CART'));
  
    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, {
      _id: '1',
      name: 'Product 1',
      slug: 'product-1',
      price: 100,
      description: 'Description 1',
      category: { _id: '10', name: 'Category 1' },
    }]);
    expect(localStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify([{
      _id: '1',
      name: 'Product 1',
      slug: 'product-1',
      price: 100,
      description: 'Description 1',
      category: { _id: '10', name: 'Category 1' },
    }]));
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });
});