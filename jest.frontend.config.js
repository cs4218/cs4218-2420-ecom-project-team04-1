module.exports = {  
  // name displayed during tests
  displayName: 'frontend',

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: 'jest-environment-jsdom',

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ['/node_modules/(?!(styleMock\\.js)$)'],

  // only run these tests

  testMatch: [
    '<rootDir>/client/src/components/*.test.js',
    '<rootDir>/client/src/components/*/*.test.js',
    '<rootDir>/client/src/pages/*.test.js',
    '<rootDir>/client/src/pages/*/*.test.js',
  ],
  testMatch: ["<rootDir>/client/src/components/*.test.js","<rootDir>/client/src/components/*/*.test.js","<rootDir>/client/src/pages/*/*.test.js" ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'client/src/components/Header.js',
    'client/src/components/Footer.js',
    'client/src/components/Layout.js',
    'client/src/components/Spinner.js',
    'client/src/components/UserMenu.js',
    'client/src/components/AdminMenu.js',
    'client/src/components/Form/CategoryForm.js',
    'client/src/components/Form/SearchInput.js',
    'client/src/components/Routes/Private.js',
    'client/src/pages/Auth/Login.js',
    'client/src/pages/Auth/Register.js',
    'client/src/pages/About.js',
    'client/src/pages/Contact.js',
    'client/src/pages/Policy.js',
    'client/src/pages/PageNotFound.js',
    'client/src/pages/HomePage.js',
    'client/src/pages/Search.js',
    "client/src/pages/user/Profile.js",
    "client/src/pages/user/Orders.js",
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
