import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { MemoryRouter } from 'react-router-dom';
import AdminRoute from './AdminRoute';
import { useAuth } from '../../context/auth';
import axios from 'axios';

jest.mock('../../context/auth');
jest.mock('axios');
jest.mock('../Spinner', () => () => <div>Loading...</div>);

describe('AdminRoute', () => {
  it('renders Spinner when auth token is missing', async () => {
    useAuth.mockReturnValue([{}], jest.fn());
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminRoute />
        </MemoryRouter>
      );
    });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders Spinner when admin authentication fails', async () => {
    useAuth.mockReturnValue([{ token: 'invalid-token' }], jest.fn());
    axios.get.mockResolvedValue({ data: { ok: false } });

    await act(async () => {
      render(
        <MemoryRouter>
          <AdminRoute />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('renders Outlet when admin authentication is successful', async () => {
    useAuth.mockReturnValue([{ token: 'valid-token' }], jest.fn());
    axios.get.mockResolvedValue({ data: { ok: true } });

    await act(async () => {
      render(
        <MemoryRouter>
          <AdminRoute />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});