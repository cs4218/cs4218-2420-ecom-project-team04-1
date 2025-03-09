import React from 'react';
import { render } from '@testing-library/react';
import { Helmet } from "react-helmet";
import Layout from './Layout';
import '@testing-library/jest-dom/extend-expect';

jest.mock('./Header', () => () => <div>Header</div>);
jest.mock('./Footer', () => () => <div>Footer</div>);

describe('Layout', () => {
    it('should set the meta tags and title correctly', () => {
        render(
            <Layout
              title="Test Title"
              description="Test Description"
              keywords="test,keywords"
              author="Test Author"
            >
              <div>Test Content</div>
            </Layout>
        );
        const helmet = Helmet.peek()
        expect(helmet.title).toBe('Test Title');
        expect(helmet.metaTags.find(tag => tag.name === 'description').content).toBe('Test Description');
        expect(helmet.metaTags.find(tag => tag.name === 'keywords').content).toBe('test,keywords');
        expect(helmet.metaTags.find(tag => tag.name === 'author').content).toBe('Test Author');
      });

  it('should render the Header and Footer components', () => {
    const { getByText } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
    );

    expect(getByText('Header')).toBeInTheDocument();
    expect(getByText('Footer')).toBeInTheDocument();
  });

  it('should render the children', () => {
    const { getByText } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });
});