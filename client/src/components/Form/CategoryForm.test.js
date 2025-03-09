import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CategoryForm from './CategoryForm';
import '@testing-library/jest-dom/extend-expect';

describe('CategoryForm', () => {
  it('should render the CategoryForm component', () => {
    const { getByPlaceholderText, getByText } = render(
      <CategoryForm handleSubmit={jest.fn()} value="" setValue={jest.fn()} />
    );

    expect(getByPlaceholderText('Enter new category')).toBeInTheDocument();
    expect(getByText('Submit')).toBeInTheDocument();
  });

  it('should change value on input change', () => {
    const setValue = jest.fn();
    const { getByPlaceholderText } = render(
      <CategoryForm handleSubmit={jest.fn()} value="" setValue={setValue} />
    );

    const input = getByPlaceholderText('Enter new category');
    fireEvent.change(input, { target: { value: 'New Category' } });

    expect(setValue).toHaveBeenCalledWith('New Category');
  });

  it('should call handleSubmit when Submit button is clicked', () => {
    const handleSubmit = jest.fn();
    const { getByText } = render(
      <CategoryForm handleSubmit={handleSubmit} value="" setValue={jest.fn()} />
    );

    const button = getByText('Submit');
    fireEvent.submit(button.closest('form')); // For simulating form submission

    expect(handleSubmit).toHaveBeenCalled();
  });
});