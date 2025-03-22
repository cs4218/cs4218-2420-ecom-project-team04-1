export default {
  // display name
  displayName: 'backend',

  // when testing backend
  testEnvironment: 'node',
  
  // check again
  // moduleNameMapper: {
  //   "^jsonwebtoken$": "<rootDir>/mocks/jsonwebtoken.js",
  // },

  // setupFilesAfterEnv: ["<rootDir>/jest.setup.backend.js"],

  // which test to run - updated to include tests in tests directory
  testMatch: [
    '<rootDir>/*/*.test.js',
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests-integration/**/*.test.js'
  ],

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**',
    'config/**',
    'middlewares/**',
    'models/**',
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
