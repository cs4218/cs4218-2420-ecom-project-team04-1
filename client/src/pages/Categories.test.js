import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Categories from './Categories';
import useCategory from '../hooks/useCategory';
import '@testing-library/jest-dom/extend-expect';

jest.mock('../hooks/useCategory');
jest.mock('../components/Layout', () => ({ children }) => <div>{children}</div>);

describe('Categories', () => {
  it('should render the Categories component with respective categories', () => {
    const mockCategories = [
      { _id: '1', name: 'Category 1', slug: 'category-1' },
      { _id: '2', name: 'Category 2', slug: 'category-2' },
    ];
    useCategory.mockReturnValue(mockCategories);

    const { getByText } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(getByText('Category 1')).toBeInTheDocument();
    expect(getByText('Category 2')).toBeInTheDocument();
    expect(getByText('Category 1').closest('a')).toHaveAttribute('href', '/category/category-1');
    expect(getByText('Category 2').closest('a')).toHaveAttribute('href', '/category/category-2');
  });

  it('should render the Categories component with no categories', () => {
    useCategory.mockReturnValue([]);

    const { queryByText } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(queryByText('Category 1')).not.toBeInTheDocument();
    expect(queryByText('Category 2')).not.toBeInTheDocument();
  });
});