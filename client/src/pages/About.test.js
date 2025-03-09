import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import About from './About';

// Mock the Layout component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

describe('About Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders about page with correct elements', () => {
    render(<About />);

    // Check if the text content exists
    expect(screen.getByText('Add text')).toBeInTheDocument();

    // Check if the image exists with correct attributes
    const aboutImage = screen.getByAltText('contactus');
    expect(aboutImage).toBeInTheDocument();
    expect(aboutImage).toHaveAttribute('src', '/images/about.jpeg');
    expect(aboutImage.style.width).toBe('100%');
  });

  test('renders within Layout component', () => {
    render(<About />);
    expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
  });

  test('has correct layout structure', () => {
    render(<About />);

    // Check if the main container classes are present
    const aboutContainer = screen.getByText('Add text').closest('.contactus');
    expect(aboutContainer).toHaveClass('row');

    // Check if the image container exists
    expect(aboutContainer.querySelector('.col-md-6')).toBeInTheDocument();

    // Check if the content container exists
    expect(aboutContainer.querySelector('.col-md-4')).toBeInTheDocument();
  });
});
