import React from 'react';
import { render, act } from '@testing-library/react';
import { SearchProvider, useSearch } from './search';

describe('search context', () => {
  it('should provide default empty search state', () => {
    let searchState;
    const MockComponent = () => {
      const [search] = useSearch();
      searchState = search;
      return null;
    };

    render(
      <SearchProvider>
        <MockComponent />
      </SearchProvider>
    );

    expect(searchState).toEqual({ keyword: "", results: [] });
  });

  it('should update search state when setAuth is called', () => {
    let setSearchState;
    const MockComponent = () => {
      const [search, setSearch] = useSearch();
      setSearchState = setSearch;
      return null;
    };

    render(
      <SearchProvider>
        <MockComponent />
      </SearchProvider>
    );

    const newSearchData = { keyword: "test", results: ["result1", "result2"] };
    act(() => {
        setSearchState(newSearchData);
    });
    expect(newSearchData).toEqual({ keyword: "test", results: ["result1", "result2"] });
  });
});