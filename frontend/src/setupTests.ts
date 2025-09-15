// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Three.js for testing
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  STLLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn(),
    parse: jest.fn()
  })),
  OBJLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn(),
    parse: jest.fn()
  }))
}));

// Mock react-three-fiber
jest.mock('@react-three/fiber', () => ({
  Canvas: jest.fn(({ children }) => children),
  useFrame: jest.fn(),
  useLoader: jest.fn()
}));

// Mock react-three-drei
jest.mock('@react-three/drei', () => ({
  OrbitControls: jest.fn(() => null),
  Environment: jest.fn(() => null),
  Grid: jest.fn(() => null)
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn(({ children, ...props }) => {
      const React = require('react');
      return React.createElement('div', props, children);
    })
  }
}));