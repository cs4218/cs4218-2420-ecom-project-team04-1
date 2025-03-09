import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import useCategory from './useCategory';

jest.mock('axios');

const MockComponent = () => {
  const categories = useCategory();
  return (
    <div>
      {categories.map((category) => (
        <div key={category.id}>{category.name}</div>
      ))}
    </div>
  );
};

describe('useCategory hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return categories', async () => {
    const mockCategories = [{ id: 1, name: 'Category 1' }, { id: 2, name: 'Category 2' }];
    axios.get.mockResolvedValue({ data: { category: mockCategories } });

    const { getByText } = render(<MockComponent />);

    await waitFor(() => {
      expect(getByText('Category 1')).toBeInTheDocument();
      expect(getByText('Category 2')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });

  it('should handle error when fetching categories fails', async () => {
    const consoleErrorMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorMessage = 'Network Error';
    axios.get.mockRejectedValue(new Error(errorMessage));

    const { queryByText } = render(<MockComponent />);

    await waitFor(() => {
      expect(queryByText('Category 1')).not.toBeInTheDocument();
      expect(queryByText('Category 2')).not.toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    expect(consoleErrorMock).toHaveBeenCalledWith(new Error(errorMessage));

    consoleErrorMock.mockRestore();
  });
});