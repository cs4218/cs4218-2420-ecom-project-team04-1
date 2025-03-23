// Mock Braintree Module
const mockTransaction = {
    sale: jest.fn().mockResolvedValue({
        success: true,
        transaction: { id: "fake_txn_id", status: "submitted_for_settlement" }
    }),
};

const mockGateway = {
    transaction: mockTransaction,
    clientToken: {
        generate: jest.fn().mockResolvedValue({ success: true, clientToken: "fake_client_token" }),
    },
};

export default {
    BraintreeGateway: jest.fn(() => mockGateway),
    Environment: {
        Sandbox: "sandbox",
    },
};
