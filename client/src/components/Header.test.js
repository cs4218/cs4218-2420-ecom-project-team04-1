import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from './Header';
import '@testing-library/jest-dom/extend-expect';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import useCategory from '../hooks/useCategory';

jest.mock('react-hot-toast');
jest.mock('../context/auth');
jest.mock('../context/cart');
jest.mock('../hooks/useCategory');
jest.mock('./Form/SearchInput', () => () => <div>SearchInput</div>);

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue([{ _id: '1', name: 'Category 1', slug: 'category-1' }]);
    useCart.mockReturnValue([[{}, {}, {}], jest.fn()]); // Mock cart with 3 items
  });

  it('should render the Header component', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('🛒 Virtual Vault')).toBeInTheDocument();
  });

  it('should display respective category in the categories dropdown', async () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText, queryByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(queryByText('Category 1')).toBeInTheDocument();
  });

  it('should display user name, dashboard and logout link when logged in as user', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Test User')).toBeInTheDocument();
    expect(getByText('Dashboard')).toBeInTheDocument();
    expect(getByText('Logout')).toBeInTheDocument();
  });

  it('should display user name, dashboard and logout link when logged in as admin', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test Admin', role: 1 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Test Admin')).toBeInTheDocument();
    expect(getByText('Dashboard')).toBeInTheDocument();
    expect(getByText('Logout')).toBeInTheDocument();
  });

  it('should display toast message on logout', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    fireEvent.click(getByText('Test User'));
    fireEvent.click(getByText('Logout'));

    expect(toast.success).toHaveBeenCalledWith('Logout Successfully');
  });

  it('should display cart count as 3', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('3')).toBeInTheDocument(); // Check if the cart count is 3
  });

  it('should display login and register links when user is not logged in', () => {
    useAuth.mockReturnValue([null, jest.fn()]);

    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Login')).toBeInTheDocument();
    expect(getByText('Register')).toBeInTheDocument();
  });

  it('should have correct link hrefs when not logged in', () => {
    useAuth.mockReturnValue([null, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Home').closest('a')).toHaveAttribute('href', '/');
    expect(getByText('Categories').closest('a')).toHaveAttribute('href', '/categories');
    expect(getByText('All Categories').closest('a')).toHaveAttribute('href', '/categories');
    expect(getByText('Category 1').closest('a')).toHaveAttribute('href', '/category/category-1');
    expect(getByText('Register').closest('a')).toHaveAttribute('href', '/register');
    expect(getByText('Login').closest('a')).toHaveAttribute('href', '/login');
  });
  
  it('should have correct link hrefs when logged in as user', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Home').closest('a')).toHaveAttribute('href', '/');
    expect(getByText('Categories').closest('a')).toHaveAttribute('href', '/categories');
    expect(getByText('All Categories').closest('a')).toHaveAttribute('href', '/categories');
    expect(getByText('Category 1').closest('a')).toHaveAttribute('href', '/category/category-1');
    expect(getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard/user');
    expect(getByText('Logout').closest('a')).toHaveAttribute('href', '/login');
  });

  it('should have correct link hrefs when logged in as admin', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test Admin', role: 1 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Home').closest('a')).toHaveAttribute('href', '/');
    expect(getByText('Categories').closest('a')).toHaveAttribute('href', '/categories');
    expect(getByText('All Categories').closest('a')).toHaveAttribute('href', '/categories');
    expect(getByText('Category 1').closest('a')).toHaveAttribute('href', '/category/category-1');
    expect(getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard/admin');
    expect(getByText('Logout').closest('a')).toHaveAttribute('href', '/login');
  });
});