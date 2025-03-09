import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { MemoryRouter } from 'react-router-dom';
import PrivateRoute from './Private';
import { useAuth } from '../../context/auth';
import axios from 'axios';
import Spinner from '../Spinner';


jest.mock("../../context/auth");
jest.mock("axios");
jest.mock("../Spinner", () => () => <div>Loading...</div>);


describe("Private", () => {
    it("renders Spinner when auth token is missing", async () => {
        useAuth.mockReturnValue([{}], jest.fn());
        await act(async () => {
            render(
                <MemoryRouter>
                    <PrivateRoute />
                </MemoryRouter>
            );
        });
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it("renders Spinner when user authentication fails", async () => {
        useAuth.mockReturnValue([{ token: "invalid-token" }], jest.fn());
        axios.get.mockResolvedValue({ data: { ok: false } });

        await act(async () => {
            render(
                <MemoryRouter>
                    <PrivateRoute />
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText("Loading...")).toBeInTheDocument();
        });
    });
    
    it("renders Outlet when user authentication is successful", async () => {
        useAuth.mockReturnValue([{ token: "valid-token" }], jest.fn());
        axios.get.mockResolvedValue({ data: { ok: true } });

        await act(async () => {
            render(
                <MemoryRouter>
                    <PrivateRoute />
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        });
    });
});