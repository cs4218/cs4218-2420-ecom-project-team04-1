import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Contact from './Contact';

// Mock the Layout component since we're only testing Contact component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Mock the react-icons
jest.mock('react-icons/bi', () => ({
  BiMailSend: () => <span data-testid="mail-icon">Mail Icon</span>,
  BiPhoneCall: () => <span data-testid="phone-icon">Phone Icon</span>,
  BiSupport: () => <span data-testid="support-icon">Support Icon</span>,
}));

describe('Contact Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders contact page with correct elements', () => {
    render(<Contact />);

    // Check if the main heading exists
    expect(screen.getByText('CONTACT US')).toBeInTheDocument();

    // Check if the contact information text exists
    expect(
      screen.getByText(/For any query or info about product/)
    ).toBeInTheDocument();

    // Check if the image exists with correct attributes
    const contactImage = screen.getByAltText('contactus');
    expect(contactImage).toBeInTheDocument();
    expect(contactImage).toHaveAttribute('src', '/images/contactus.jpeg');
    expect(contactImage.style.width).toBe('100%');
  });

  test('renders within Layout component', () => {
    render(<Contact />);
    expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
  });

  test('has correct layout structure', () => {
    render(<Contact />);

    // Check if the main container classes are present
    const contactContainer = screen
      .getByText(/For any query/)
      .closest('.contactus');
    expect(contactContainer).toHaveClass('row');

    // Check if the image container exists
    expect(contactContainer.querySelector('.col-md-6')).toBeInTheDocument();

    // Check if the content container exists
    expect(contactContainer.querySelector('.col-md-4')).toBeInTheDocument();
  });
});
