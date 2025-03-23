import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../context/cart';
import { AuthProvider } from '../context/auth';
import { SearchProvider } from '../context/search';
import CartPage from './CartPage';

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

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('CartPage Integration Tests', () => {
  it('should initialize cart from localStorage on load', () => {
    const mockCartData = [
        { _id: '1', name: 'Product 1', price: 100, description: 'This is product 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'This is product 2' },
    ];
    window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockCartData));

    renderWithProviders(<CartPage />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Total : $300.00')).toBeInTheDocument();
  });

  it('should remove items from the cart and update localStorage', () => {
    const mockCartData = [
        { _id: '1', name: 'Product 1', price: 100, description: 'This is product 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'This is product 2' },
    ];
    window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockCartData));

    renderWithProviders(<CartPage />);

    const removeButton = screen.getAllByText('Remove')[0];
    fireEvent.click(removeButton);

    const setItemCalls = window.localStorage.setItem.mock.calls;
    const lastCall = setItemCalls[setItemCalls.length - 1];
    expect(lastCall).toEqual([
      'cart',
      JSON.stringify([{ _id: '2', name: 'Product 2', price: 200, description: 'This is product 2' }]),
    ]);
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Total : $200.00')).toBeInTheDocument();
    expect(() => screen.getByText('Product 1')).toThrow();
  });

  it('should persist cart data across sessions', () => {
    const mockCartData = [
        { _id: '1', name: 'Product 1', price: 100, description: 'This is product 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'This is product 2' },
    ];
    window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockCartData));

    renderWithProviders(<CartPage />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Total : $300.00')).toBeInTheDocument();

    const newCartData = [
      ...mockCartData,
      { _id: '3', name: 'Product 3', price: 150 , description: 'This is product 3'},
    ];
    window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(newCartData));
    renderWithProviders(<CartPage />);

    expect(screen.getByText('Product 3')).toBeInTheDocument();
    expect(screen.getByText('Total : $450.00')).toBeInTheDocument();
  });

  it('should display an empty cart message when no items are in the cart', () => {
    window.localStorage.getItem.mockReturnValueOnce(JSON.stringify([]));

    renderWithProviders(<CartPage />);

    expect(screen.getByText('Your Cart Is Empty')).toBeInTheDocument();
  });
});