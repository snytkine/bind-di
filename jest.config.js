module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'tjs'],
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
    '!src/app.ts',
    '!src/Components/mongo.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!build/**',
    '!src/loaders/fsloader/__tests__/fixtures/**',
    '!**/__test__/fixtures/**',
    '!src/Controllers/__tests__/fixtures/**',
    '!src/Components/mongo_mock.ts',
    '!src/Components/index.ts',
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
