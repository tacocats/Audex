export default {
  testEnvironment: 'node',
  transform: {},
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/logger.js', '!src/utils/globals.js'],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      lines: 22,
      functions: 50,
    },
  },
}
