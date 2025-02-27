import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Spinner from './Spinner';
import '@testing-library/jest-dom/extend-expect';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...originalModule,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/current-path' }),
  };
});

describe('Spinner', () => {
  it('should render the Spinner component', () => {
    const { getByText, getByRole } = render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>
    );

    expect(getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    expect(getByRole('status')).toBeInTheDocument();
  });

  it('should display the countdown correctly', async () => {
    const { getByText } = render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>
    );

    expect(getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();

    await waitFor(() => expect(getByText(/redirecting to you in 2 second/i)).toBeInTheDocument(), { timeout: 2000 });
    await waitFor(() => expect(getByText(/redirecting to you in 1 second/i)).toBeInTheDocument(), { timeout: 2000 });
  });

  it('should navigate after the countdown', async () => {
    render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { state: '/current-path' }), { timeout: 4000 });
  });
});