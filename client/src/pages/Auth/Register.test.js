import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock('../../hooks/useCategory', () => jest.fn(() => []));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Object.defineProperty(window, "localStorage", {
//   value: {
//     setItem: jest.fn(),
//     getItem: jest.fn(),
//     removeItem: jest.fn(),
//   },
//   writable: true,
// });

// // prevent jest from crashing
// window.matchMedia =
//   window.matchMedia ||
//   function () {
//     return {
//       matches: false,
//       addListener: function () {},
//       removeListener: function () {},
//     };
//   };

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const fillForm = (getByPlaceholderText) => {
    fireEvent.change(getByPlaceholderText('Enter Your Name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
      target: { value: '1234567890' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), {
      target: { value: '123 Street' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), {
      target: { value: '2000-01-01' },
    });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), {
      target: { value: 'Football' },
    });
  };

  it('should register the user successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fillForm(getByPlaceholderText);
    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(
      'Register Successfully, please login'
    );
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should display error message on failed registration', async () => {
    axios.post.mockRejectedValueOnce({ message: 'User already exists' });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fillForm(getByPlaceholderText);
    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('should display error message when server returns success: false', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Email already registered',
      },
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fillForm(getByPlaceholderText);
    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Email already registered');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should validate form inputs correctly', async () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Instead of spying on checkValidity, we'll directly test the form submission behavior
    // The form has required fields, so submitting an empty form should not call axios.post

    // Get the form and submit button
    const submitButton = getByText('REGISTER');

    // Click the submit button without filling the form
    fireEvent.click(submitButton);

    // Axios.post should not be called because the form validation should prevent submission
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should update state when input values change', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    const nameInput = getByPlaceholderText('Enter Your Name');
    const emailInput = getByPlaceholderText('Enter Your Email');
    const passwordInput = getByPlaceholderText('Enter Your Password');
    const phoneInput = getByPlaceholderText('Enter Your Phone');
    const addressInput = getByPlaceholderText('Enter Your Address');
    const dobInput = getByPlaceholderText('Enter Your DOB');
    const answerInput = getByPlaceholderText('What is Your Favorite sports');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(addressInput, { target: { value: '123 Street' } });
    fireEvent.change(dobInput, { target: { value: '2000-01-01' } });
    fireEvent.change(answerInput, { target: { value: 'Football' } });

    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(phoneInput.value).toBe('1234567890');
    expect(addressInput.value).toBe('123 Street');
    expect(dobInput.value).toBe('2000-01-01');
    expect(answerInput.value).toBe('Football');
  });

  it('should send correct data to the server', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    const testData = {
      name: 'John Doe',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Street',
      DOB: '2000-01-01',
      answer: 'Football',
    };

    fireEvent.change(getByPlaceholderText('Enter Your Name'), {
      target: { value: testData.name },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: testData.email },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: testData.password },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
      target: { value: testData.phone },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), {
      target: { value: testData.address },
    });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), {
      target: { value: testData.DOB },
    });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), {
      target: { value: testData.answer },
    });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/auth/register',
        testData
      );
    });
  });
});
