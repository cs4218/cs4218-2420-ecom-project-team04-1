import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserMenu from './UserMenu';
import '@testing-library/jest-dom/extend-expect';

describe('UserMenu', () => {
  it('should render the UserMenu component', () => {
    const { getByText } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(getByText('Dashboard')).toBeInTheDocument();
  });

  it('should contain the Profile and Orders links', () => {
    const { getByText } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(getByText('Profile')).toBeInTheDocument();
    expect(getByText('Orders')).toBeInTheDocument();
  });

  it('should have correct link hrefs', () => {
    const { getByText } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(getByText('Profile').closest('a')).toHaveAttribute('href', '/dashboard/user/profile');
    expect(getByText('Orders').closest('a')).toHaveAttribute('href', '/dashboard/user/orders');
  });
});