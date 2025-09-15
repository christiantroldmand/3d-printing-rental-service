module.exports = {
  transformIgnorePatterns: [
    'node_modules/(?!(three|@react-three|@react-three/fiber|@react-three/drei)/)'
  ],
  moduleNameMapper: {
    '^three/examples/jsm/(.*)$': '<rootDir>/src/__mocks__/three-examples.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
};
