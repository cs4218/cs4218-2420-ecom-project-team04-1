import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CartPage from './CartPage';
import axios from 'axios';
import { useCart } from '../context/cart';
import { useAuth } from '../context/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '@testing-library/jest-dom/extend-expect';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../context/cart', () => ({
  useCart: jest.fn(),
}));
jest.mock('../context/auth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  MemoryRouter: ({ children }) => <div>{children}</div>,
}));
jest.mock('../components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('braintree-web-drop-in-react', () => {
  return function MockDropIn(props) {
    return (
      <div>
        <button onClick={() => props.onInstance({ requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: 'fake-nonce' }) })}>
          Mock DropIn
        </button>
      </div>
    );
  };
});

const mockNavigate = jest.fn();
const mockUser = { name: 'Alex Tan', address: '123 Street' };
const mockAuth = [{ token: 'test-token', user: mockUser }, jest.fn()];
const mockCartItems = [
  { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' },
  { _id: '2', name: 'Product 2', price: 200, description: 'Description 2' },
];

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

beforeEach(() => {
  useNavigate.mockReturnValue(mockNavigate);
  axios.get.mockResolvedValue({ data: { clientToken: 'test-client-token' } });
  axios.post.mockResolvedValue({ data: { success: true } });
  
  Object.defineProperty(window, 'localStorage', { 
    value: localStorageMock,
    writable: true
  });
  
  jest.clearAllMocks();
});

const renderCartPage = () => {
  return render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );
};

describe('CartPage when user logged in', () => {
  beforeEach(() => {
    useAuth.mockReturnValue(mockAuth);
  });

  it('should render the Cart Page with respective items', async () => {
    useCart.mockReturnValue([mockCartItems, jest.fn()]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Hello Alex Tan')).toBeInTheDocument();
      expect(getByText('You have 2 items in your cart.')).toBeInTheDocument();
      expect(getByText('Product 1')).toBeInTheDocument();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(getByText('Total : $300.00')).toBeInTheDocument();
    });
  });

  it('should display cart empty message when cart is empty', async () => {
    useCart.mockReturnValue([[], jest.fn()]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Hello Alex Tan')).toBeInTheDocument();
      expect(getByText('Your Cart Is Empty')).toBeInTheDocument();
    });
  });

  it('should remove the only item from the cart', async () => {
    const singleItemCart = [mockCartItems[0]];
    const setCartMock = jest.fn();
    useCart.mockReturnValue([singleItemCart, setCartMock]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Product 1')).toBeInTheDocument();
    });

    const product1RemoveButton = getByText('Remove');
    fireEvent.click(product1RemoveButton);

    expect(setCartMock).toHaveBeenCalledWith([]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', '[]');
  });

  it('should remove one item from the cart with two items', async () => {
    const setCartMock = jest.fn();
    useCart.mockReturnValue([mockCartItems, setCartMock]);

    const { getByText, getAllByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Product 1')).toBeInTheDocument();
      expect(getByText('Product 2')).toBeInTheDocument();
    });

    const removeButtons = getAllByText('Remove');
    fireEvent.click(removeButtons[0]); // Remove first product

    expect(setCartMock).toHaveBeenCalledWith([mockCartItems[1]]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', JSON.stringify([mockCartItems[1]]));
  });

  it('should handle successful payment', async () => {
    const setCartMock = jest.fn();
    useCart.mockReturnValue([mockCartItems, setCartMock]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Make Payment')).toBeInTheDocument();
    });

    fireEvent.click(getByText('Mock DropIn'));
    fireEvent.click(getByText('Make Payment'));

    await waitFor(() => { // Payment API
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/product/braintree/payment', 
        { nonce: 'fake-nonce', cart: mockCartItems }
      );
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cart'); // Cart should be cleared
      expect(setCartMock).toHaveBeenCalledWith([]);
      
      expect(toast.success).toHaveBeenCalledWith('Payment Completed Successfully ');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/orders');
    });
  });

  it('should handle payment error', async () => {
    const setCartMock = jest.fn();
    useCart.mockReturnValue([mockCartItems, setCartMock]);
    
    axios.post.mockRejectedValueOnce(new Error('Payment failed'));
    
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Make Payment')).toBeInTheDocument();
    });
    fireEvent.click(getByText('Mock DropIn'));
    fireEvent.click(getByText('Make Payment'));

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
      
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      expect(setCartMock).not.toHaveBeenCalledWith([]);
    });
    
    console.log = originalConsoleLog;
  });

  it('should navigate to update address page when update address button is clicked', async () => {
    useCart.mockReturnValue([mockCartItems, jest.fn()]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Update Address')).toBeInTheDocument();
    });

    fireEvent.click(getByText('Update Address'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/profile');
  });

  it('should display the correct total price', async () => {
    useCart.mockReturnValue([mockCartItems, jest.fn()]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Total : $300.00')).toBeInTheDocument();
    });
  });

  it('should not show payment section if user has no address', async () => {
    useCart.mockReturnValue([mockCartItems, jest.fn()]);
    useAuth.mockReturnValue([{ 
      token: 'test-token', 
      user: { name: 'Alex Tan', address: '' } 
    }, jest.fn()]);

    const { getByText, queryByTestId } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Update Address')).toBeInTheDocument();
      expect(queryByTestId('dropin-container')).not.toBeInTheDocument();
    });
  });

  it('should show the current address if user has an address', async () => {
    useCart.mockReturnValue([mockCartItems, jest.fn()]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Current Address')).toBeInTheDocument();
      expect(getByText('123 Street')).toBeInTheDocument();
    });
  });
});

describe('CartPage when not logged in', () => {
  beforeEach(() => {
    useAuth.mockReturnValue([{ user: null }, jest.fn()]);
  });

  it('should render the Cart Page with respective items', async () => {
    useCart.mockReturnValue([mockCartItems, jest.fn()]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Hello Guest')).toBeInTheDocument();
      expect(getByText('You have 2 items in your cart. Please login to checkout!')).toBeInTheDocument();
      expect(getByText('Product 1')).toBeInTheDocument();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(getByText('Total : $300.00')).toBeInTheDocument();
    });
  });

  it('should display cart empty message when cart is empty', async () => {
    useCart.mockReturnValue([[], jest.fn()]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Hello Guest')).toBeInTheDocument();
      expect(getByText('Your Cart Is Empty')).toBeInTheDocument();
    });
  });

  it('should remove the only item from the cart', async () => {
    const singleItemCart = [mockCartItems[0]];
    const setCartMock = jest.fn();
    useCart.mockReturnValue([singleItemCart, setCartMock]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Product 1')).toBeInTheDocument();
    });

    const product1RemoveButton = getByText('Remove');
    fireEvent.click(product1RemoveButton);

    expect(setCartMock).toHaveBeenCalledWith([]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', '[]');
  });

  it('should remove one item from the cart with two items', async () => {
    const setCartMock = jest.fn();
    useCart.mockReturnValue([mockCartItems, setCartMock]);

    const { getByText, getAllByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Product 1')).toBeInTheDocument();
      expect(getByText('Product 2')).toBeInTheDocument();
    });

    const removeButtons = getAllByText('Remove');
    fireEvent.click(removeButtons[0]); // Remove first product

    expect(setCartMock).toHaveBeenCalledWith([mockCartItems[1]]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', JSON.stringify([mockCartItems[1]]));
  });

  it('should display the correct total price', async () => {
    useCart.mockReturnValue([mockCartItems, jest.fn()]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Total : $300.00')).toBeInTheDocument();
    });
  });

  it('should navigate to login page when "Please Login to checkout" button clicked', async () => {
    useCart.mockReturnValue([mockCartItems, jest.fn()]);

    const { getByText } = renderCartPage();

    await waitFor(() => {
      expect(getByText('Please Login to checkout')).toBeInTheDocument();
    });

    fireEvent.click(getByText('Please Login to checkout'));
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: '/cart' });
  });
});