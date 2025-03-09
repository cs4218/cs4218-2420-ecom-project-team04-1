import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Pagenotfound from './Pagenotfound';

// Mock the Layout component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Wrapper component with Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Pagenotfound Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders 404 page with correct elements', () => {
    renderWithRouter(<Pagenotfound />);

    // Check if the main elements exist
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops ! Page Not Found')).toBeInTheDocument();

    // Check if the "Go Back" link exists and has correct attributes
    const goBackLink = screen.getByText('Go Back');
    expect(goBackLink).toBeInTheDocument();
    expect(goBackLink).toHaveAttribute('href', '/');
    expect(goBackLink).toHaveClass('pnf-btn');
  });

  test('renders within Layout component', () => {
    renderWithRouter(<Pagenotfound />);
    expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
  });

  test('has correct layout structure and classes', () => {
    renderWithRouter(<Pagenotfound />);

    // Check if the main container class is present
    const pnfContainer = screen.getByText('404').closest('.pnf');
    expect(pnfContainer).toBeInTheDocument();

    // Check if the title has correct class
    expect(screen.getByText('404')).toHaveClass('pnf-title');

    // Check if the heading has correct class
    expect(screen.getByText('Oops ! Page Not Found')).toHaveClass(
      'pnf-heading'
    );
  });

  test('link navigates to home page', () => {
    renderWithRouter(<Pagenotfound />);

    const homeLink = screen.getByText('Go Back');
    expect(homeLink.getAttribute('href')).toBe('/');
  });
});
