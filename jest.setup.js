// Jest setup file

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: () => `test-uuid-${Math.random().toString(36).substr(2, 9)}`,
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
}));

// Mock expo-sqlite for database tests
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// Supabase mock is in src/services/__mocks__/supabase.ts
// and mapped via moduleNameMapper in package.json

// Silence console during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
