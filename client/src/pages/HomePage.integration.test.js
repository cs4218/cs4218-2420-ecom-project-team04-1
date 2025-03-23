import React from 'react';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../context/cart';
import { AuthProvider } from '../context/auth';
import { SearchProvider } from '../context/search';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import HomePage from './HomePage';
import { toBeInTheDocument } from '@testing-library/jest-dom/extend-expect';

const mockAxios = new MockAdapter(axios);

const categories = [
  { _id: 'cat1', name: 'Electronics' },
  { _id: 'cat2', name: 'Clothing' },
  { _id: 'cat3', name: 'Books' }
];

const products = [
  {
    _id: 'prod1',
    name: 'Laptop',
    price: 1200,
    description: 'Powerful laptop for all your needs with high-end specifications.',
    slug: 'laptop',
    category: 'cat1'
  },
  {
    _id: 'prod2',
    name: 'T-shirt',
    price: 25,
    description: 'Comfortable cotton t-shirt for everyday wear in various colors.',
    slug: 't-shirt',
    category: 'cat2'
  },
  {
    _id: 'prod3',
    name: 'Smartphone',
    price: 800,
    description: 'Latest smartphone with advanced camera and long battery life.',
    slug: 'smartphone',
    category: 'cat1'
  },
  {
    _id: 'prod4',
    name: 'Programming Book',
    price: 50,
    description: 'Comprehensive guide to modern programming techniques and best practices.',
    slug: 'programming-book',
    category: 'cat3'
  }
];

const renderWithProviders = (ui) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            {ui}
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('HomePage Integration Tests', () => {

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        })),
    });
  });
  beforeEach(() => {
    mockAxios.reset();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });

    mockAxios.onGet('/api/v1/category/get-category').reply(200, {
      success: true,
      category: categories
    });

    mockAxios.onGet('/api/v1/product/product-count').reply(200, {
      total: products.length + 2
    });

    mockAxios.onGet('/api/v1/product/product-list/1').reply(200, {
      products: products
    });

    // Mock product photos endpoint to return a placeholder
    mockAxios.onGet(/\/api\/v1\/product\/product-photo\/.*/).reply(200, 'photo-data');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should filter products by category', async () => {
    // Arrange
    mockAxios.onPost('/api/v1/product/product-filters').reply((config) => {
      const { checked } = JSON.parse(config.data);
      const filteredProducts = products.filter(p => checked.includes(p.category));
      return [200, { products: filteredProducts }];
    });
  
    renderWithProviders(<HomePage />);
  
    await waitFor(() => screen.getByLabelText('Electronics'));
  
    const electronicsCheckbox = screen.getByLabelText('Electronics');
    fireEvent.click(electronicsCheckbox);
  
    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Smartphone')).toBeInTheDocument();
      expect(screen.queryByText('T-shirt')).not.toBeInTheDocument();
      expect(screen.queryByText('Programming Book')).not.toBeInTheDocument();
    });
  });

  it('should filter products by price', async () => {
        mockAxios.onPost('/api/v1/product/product-filters').reply((config) => {
            const { radio } = JSON.parse(config.data);
            if (!radio || !radio.length) return [200, { products }];
            
            const [min, max] = radio;
            const filteredProducts = products.filter(p => 
            p.price >= min && (max ? p.price <= max : true)
            );
            return [200, { products: filteredProducts }];
        });
        
        renderWithProviders(<HomePage />);
        
        const priceRadio = screen.getByLabelText('$20 to 39');
        fireEvent.click(priceRadio);
        
        await waitFor(() => {
            expect(screen.getByText('T-shirt')).toBeInTheDocument();
            expect(screen.queryByText('Programming Book')).not.toBeInTheDocument();
            expect(screen.queryByText('Laptop')).not.toBeInTheDocument();
            expect(screen.queryByText('Smartphone')).not.toBeInTheDocument();
        });
  });

  it('should apply both category and price filters together', async () => {
    mockAxios.onPost('/api/v1/product/product-filters').reply((config) => {
      const { checked, radio } = JSON.parse(config.data);
      
      let filteredProducts = products;
      
      if (checked && checked.length) {
        filteredProducts = filteredProducts.filter(p => checked.includes(p.category));
      }
      
      if (radio && radio.length) {
        const [min, max] = radio;
        filteredProducts = filteredProducts.filter(p => 
          p.price >= min && (max ? p.price <= max : true)
        );
      }
      
      return [200, { products: filteredProducts }];
    });
  
    renderWithProviders(<HomePage />);
  
    await waitFor(() => screen.getByText('$0 to 19'));
    await waitFor(() => screen.getByLabelText('Electronics'));
    fireEvent.click(screen.getByLabelText('Electronics'));
    fireEvent.click(screen.getByLabelText('$0 to 19'));
  
    await waitFor(() => {
      expect(screen.queryByText('Laptop')).not.toBeInTheDocument(); 
      expect(screen.queryByText('Smartphone')).not.toBeInTheDocument(); 
      expect(screen.queryByText('T-shirt')).not.toBeInTheDocument(); 
      expect(screen.queryByText('Programming Book')).not.toBeInTheDocument(); 
    });
  });


  it('should reset filters when reset button is clicked', async () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, reload: jest.fn() };

    renderWithProviders(<HomePage />);

    fireEvent.click(screen.getByText('RESET FILTERS'));

    expect(window.location.reload).toHaveBeenCalled();

    window.location = originalLocation;
  });

  it('should load more products when "Load more" button is clicked', async () => {
    const page2Products = [
      {
        _id: 'prod5',
        name: 'Headphones',
        price: 150,
        description: 'Noise-cancelling headphones with premium sound quality.',
        slug: 'headphones',
        category: 'cat1',
      },
      {
        _id: 'prod6',
        name: 'Jeans',
        price: 60,
        description: 'Classic denim jeans with comfortable fit and durable material.',
        slug: 'jeans',
        category: 'cat2',
      },
    ];
  
    mockAxios.onGet('/api/v1/product/product-list/1').reply(200, {
      products: products,
    });
  
    mockAxios.onGet('/api/v1/product/product-list/2').reply(200, {
      products: page2Products,
    });
  
    renderWithProviders(<HomePage />);

    await waitFor(() => screen.getByText('Laptop'));
    await waitFor(() => screen.getByText('T-shirt'));
  
    const loadMoreButton = screen.getByText(/Load more/i);
    fireEvent.click(loadMoreButton);
  
    await waitFor(() => {
      expect(screen.getByText('Headphones')).toBeInTheDocument();
      expect(screen.getByText('Jeans')).toBeInTheDocument();
    });
  });
});