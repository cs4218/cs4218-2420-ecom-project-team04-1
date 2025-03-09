import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { CartProvider, useCart } from './cart';

describe('cart context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should provide default empty cart state', () => {
    let cartState;
    const MockComponent = () => {
      const [cart] = useCart();
      cartState = cart;
      return null;
    };

    render(
      <CartProvider>
        <MockComponent />
      </CartProvider>
    );

    expect(cartState).toEqual([]);
  });

  it('should set cart state from localStorage when data exists', () => {
    const mockCartData = [{ id: 1, name: 'Test Product', quantity: 2 }];
    localStorage.setItem('cart', JSON.stringify(mockCartData));

    let cartState;
    const MockComponent = () => {
      const [cart] = useCart();
      cartState = cart;
      return null;
    };

    render(
      <CartProvider>
        <MockComponent />
      </CartProvider>
    );

    expect(cartState).toEqual(mockCartData);
  });


  it('should update cart state and localStorage when setCart is called', async () => {
    let setCartState;
    const MockComponent = () => {
      const [cart, setCart] = useCart();
      setCartState = setCart;
      return null;
    };

    render(
      <CartProvider>
        <MockComponent />
      </CartProvider>
    );

    const newCartData = [{ id: 2, name: 'Added Product', quantity: 1 }];
    act(() => {
      setCartState(newCartData);
    });

    await waitFor(() => {
      expect(localStorage.getItem('cart')).toBe(JSON.stringify(newCartData));
    });
  });
});