/** @type {import('jest').Config} */
module.exports = {
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: false,
        },
      },
      module: {
        type: 'commonjs',
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    '/node_modules/',
  ],
};