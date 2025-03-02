import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock auth context
const mockSetAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [{ user: null, token: '' }, mockSetAuth]), // Mock useAuth hook
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]), // Mock useSearch hook
}));

jest.mock('../../hooks/useCategory', () => jest.fn(() => []));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// Mock useNavigate and useLocation
const mockNavigate = jest.fn();
const mockLocation = { state: '/dashboard' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock window.matchMedia
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const fillLoginForm = (
    getByPlaceholderText,
    email = 'test@example.com',
    password = 'password123'
  ) => {
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: email },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: password },
    });
  };

  it('renders login form', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('LOGIN FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    expect(getByText('Forgot Password')).toBeInTheDocument();
    expect(getByText('LOGIN')).toBeInTheDocument();
  });

  it('inputs should be initially empty', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(getByPlaceholderText('Enter Your Password').value).toBe('');
  });

  it('should allow typing email and password', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fillLoginForm(getByPlaceholderText);

    expect(getByPlaceholderText('Enter Your Email').value).toBe(
      'test@example.com'
    );
    expect(getByPlaceholderText('Enter Your Password').value).toBe(
      'password123'
    );
  });

  it('should login the user successfully', async () => {
    const mockUserData = {
      success: true,
      message: 'Login successful',
      user: { id: 1, name: 'John Doe', email: 'test@example.com' },
      token: 'mockToken',
    };

    axios.post.mockResolvedValueOnce({
      data: mockUserData,
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fillLoginForm(getByPlaceholderText);
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(toast.success).toHaveBeenCalledWith(mockUserData.message, {
      duration: 5000,
      icon: '🙏',
      style: {
        background: 'green',
        color: 'white',
      },
    });

    expect(mockSetAuth).toHaveBeenCalledWith({
      user: mockUserData.user,
      token: mockUserData.token,
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'auth',
      JSON.stringify(mockUserData)
    );

    expect(mockNavigate).toHaveBeenCalledWith(mockLocation.state);
  });

  it('should display error message on failed login', async () => {
    axios.post.mockRejectedValueOnce({ message: 'Invalid credentials' });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fillLoginForm(getByPlaceholderText);
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('should display error message when server returns success: false', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Invalid email or password',
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fillLoginForm(getByPlaceholderText);
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Invalid email or password');
    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('should navigate to forgot password page when clicking the forgot password button', () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(getByText('Forgot Password'));
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('should validate form inputs correctly', async () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    // Instead of spying on checkValidity, we'll directly test the form submission behavior
    // The form has required fields, so submitting an empty form should not call axios.post

    // Get the submit button
    const submitButton = getByText('LOGIN');

    // Click the submit button without filling the form
    fireEvent.click(submitButton);

    // Axios.post should not be called because the form validation should prevent submission
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should navigate to home page if location.state is not provided', async () => {
    // Override the mock for this specific test
    jest
      .spyOn(require('react-router-dom'), 'useLocation')
      .mockReturnValue({ state: null });

    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Login successful',
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken',
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fillLoginForm(getByPlaceholderText);
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
