import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminMenu from './AdminMenu';
import '@testing-library/jest-dom/extend-expect';

describe('AdminMenu', () => {
  it('should render the AdminMenu component', () => {
    const { getByText } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(getByText('Admin Panel')).toBeInTheDocument();
  });

  it('should contain the Create Category, Create Product, Products, and Orders links', () => {
    const { getByText } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(getByText('Create Category')).toBeInTheDocument();
    expect(getByText('Create Product')).toBeInTheDocument();
    expect(getByText('Products')).toBeInTheDocument();
    expect(getByText('Orders')).toBeInTheDocument();
  });

  it('should have correct link hrefs', () => {
    const { getByText } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(getByText('Create Category').closest('a')).toHaveAttribute('href', '/dashboard/admin/create-category');
    expect(getByText('Create Product').closest('a')).toHaveAttribute('href', '/dashboard/admin/create-product');
    expect(getByText('Products').closest('a')).toHaveAttribute('href', '/dashboard/admin/products');
    expect(getByText('Orders').closest('a')).toHaveAttribute('href', '/dashboard/admin/orders');
  });
});