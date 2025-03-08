import { hashPassword, comparePassword } from '../helpers/authHelper';
import bcrypt from 'bcrypt';

const originalConsoleLog = console.log;
beforeAll(() => {
    console.log = jest.fn();
});

afterAll(() => {
    console.log = originalConsoleLog;
});

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

describe('Auth Helper Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('hashPassword', () => {
        it('should hash a password successfully', async () => {
            const plainPassword = 'testpassword123';
            const hashedPasswordMock = '#fakeh4sh3edPA5sw0rd';
            bcrypt.hash.mockResolvedValue(hashedPasswordMock);

            const result = await hashPassword(plainPassword);

            expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
            expect(result).toBe(hashedPasswordMock);
        });

        it('should handle errors during hashing', async () => {
            const plainPassword = 'testpassword123';
            const error = new Error('Hashing error');
            bcrypt.hash.mockRejectedValue(error);

            const result = await hashPassword(plainPassword);

            expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
            expect(console.log).toHaveBeenCalledWith(error);
            expect(result).toBeUndefined();
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching passwords', async () => {
            const plainPassword = 'testpassword123';
            const hashedPassword = '$2b$10$abcdefghijklmnopqrstuv';
            bcrypt.compare.mockResolvedValue(true);

            const result = await comparePassword(plainPassword, hashedPassword);

            expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
            expect(result).toBe(true);
        });

        it('should return false for non-matching passwords', async () => {
            const plainPassword = 'wrongpassword';
            const hashedPassword = '#fakeh4sh3edPA5sw0rd';
            bcrypt.compare.mockResolvedValue(false);

            const result = await comparePassword(plainPassword, hashedPassword);

            expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
            expect(result).toBe(false);
        });

        it('should propagate errors from bcrypt.compare', async () => {
            const plainPassword = 'testpassword123';
            const hashedPassword = '#fakeh4sh3edPA5sw0rd';
            const error = new Error('Comparison error');
            bcrypt.compare.mockRejectedValue(error);

            await expect(comparePassword(plainPassword, hashedPassword)).rejects.toThrow('Comparison error');
            expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
        });
    });
});