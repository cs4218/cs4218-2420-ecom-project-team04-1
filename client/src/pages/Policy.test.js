import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Policy from './Policy';

// Mock the Layout component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

describe('Policy Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders policy page with correct elements', () => {
    render(<Policy />);

    // Check if the privacy policy text exists (all instances)
    const policyTexts = screen.getAllByText('add privacy policy');
    expect(policyTexts).toHaveLength(7); // There should be 7 instances

    // Check if the image exists with correct attributes
    const policyImage = screen.getByAltText('contactus');
    expect(policyImage).toBeInTheDocument();
    expect(policyImage).toHaveAttribute('src', '/images/contactus.jpeg');
    expect(policyImage.style.width).toBe('100%');
  });

  test('renders within Layout component', () => {
    render(<Policy />);
    expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
  });

  test('has correct layout structure', () => {
    render(<Policy />);

    // Check if the main container classes are present
    const policyContainer = screen
      .getAllByText('add privacy policy')[0]
      .closest('.contactus');
    expect(policyContainer).toHaveClass('row');

    // Check if the image container exists
    expect(policyContainer.querySelector('.col-md-6')).toBeInTheDocument();

    // Check if the content container exists
    expect(policyContainer.querySelector('.col-md-4')).toBeInTheDocument();
  });

  test('renders all privacy policy paragraphs', () => {
    render(<Policy />);

    const contentSection = screen
      .getAllByText('add privacy policy')[0]
      .closest('.col-md-4');
    const paragraphs = contentSection.getElementsByTagName('p');
    expect(paragraphs.length).toBe(7);
  });
});
