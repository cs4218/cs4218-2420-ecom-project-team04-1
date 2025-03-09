import React from 'react';
import { render } from '@testing-library/react';
import axios from 'axios';
import { AuthProvider, useAuth } from './auth';

jest.mock('axios');

describe('auth context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should provide default auth state', () => {
    let authState;
    const TestComponent = () => {
      const [auth] = useAuth();
      authState = auth;
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(authState).toEqual({ user: null, token: '' });
  });

  it('should set auth state from localStorage when data exists', () => {
    const mockAuthData = { user: { name: 'Test User' }, token: 'test-token' };
    localStorage.setItem('auth', JSON.stringify(mockAuthData));

    let authState;
    const TestComponent = () => {
      const [auth] = useAuth();
      authState = auth;
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(authState).toEqual(mockAuthData);
  });

  it('should update axios default headers with token', () => {
    const mockAuthData = { user: { name: 'Test User' }, token: 'test-token' };
    localStorage.setItem('auth', JSON.stringify(mockAuthData));

    render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    );

    expect(axios.defaults.headers.common['Authorization']).toBe('test-token');
  });
});