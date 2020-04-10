module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'tjs'],
  setupFiles: ["<rootDir>/.jest/setEnvVars.js"],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '(?:.+?)/fixtures/',
    'src/sandbox/'
  ],
  globals: {
    'ts-jest': {
      diagnostics: true,
    },
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!src/index.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!build/**',
    '!src/loaders/fsloader/__tests__/fixtures/**',
    '!**/fixtures/**',
    '!src/sandbox/**',
  ],
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 1,
      lines: 1,
      statements: 1,
    },
  },
};
