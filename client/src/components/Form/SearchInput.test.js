import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import SearchInput from './SearchInput';
import '@testing-library/jest-dom/extend-expect';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  MemoryRouter: ({ children }) => <div>{children}</div>,
}));
jest.mock('../../context/search', () => ({
  useSearch: jest.fn(),
}));

describe('SearchInput', () => {
  const mockNavigate = jest.fn();
  const mockSetValues = jest.fn();
  const mockUseSearch = jest.fn(() => [{ keyword: '' }, mockSetValues]);

  beforeEach(() => {
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    require('../../context/search').useSearch.mockReturnValue(mockUseSearch());
  });

  it('should render the SearchInput component', () => {
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    expect(getByPlaceholderText('Search')).toBeInTheDocument();
    expect(getByText('Search')).toBeInTheDocument();
  });

  it('should change value on input change', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const input = getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'New Keyword' } });

    expect(mockSetValues).toHaveBeenCalledWith({ keyword: 'New Keyword' });
  });

  it('should call handleSubmit when Search button is clicked and navigate accordingly', async () => {
    axios.get.mockResolvedValue({ data: 'search results' });
    const { getByText } = render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const button = getByText('Search');
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/');
      expect(mockSetValues).toHaveBeenCalledWith({ keyword: '', results: 'search results' });
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });

  it('should handle error when api call fails', async () => {
    const consoleErrorMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorMessage = 'Network Error';
    axios.get.mockRejectedValue(new Error(errorMessage));

    const { getByText } = render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const button = getByText('Search');
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/');
      expect(consoleErrorMock).toHaveBeenCalledWith(new Error(errorMessage));
    });

    consoleErrorMock.mockRestore();
  });
});