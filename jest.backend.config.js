export default {  
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/*/*.test.js"],

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "middlewares/**"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
