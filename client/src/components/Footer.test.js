import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';
import '@testing-library/jest-dom/extend-expect';

describe('Footer', () => {
  it('should contain the copyright text', () => {
    const { getByText } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(getByText('All Rights Reserved © TestingComp')).toBeInTheDocument();
  });

  it('should contain the correct links', () => {
    const { getByText } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(getByText('About')).toBeInTheDocument();
    expect(getByText('Contact')).toBeInTheDocument();
    expect(getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('should have correct link hrefs', () => {
    const { getByText } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(getByText('About').closest('a')).toHaveAttribute('href', '/about');
    expect(getByText('Contact').closest('a')).toHaveAttribute('href', '/contact');
    expect(getByText('Privacy Policy').closest('a')).toHaveAttribute('href', '/policy');
  });
});