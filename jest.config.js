module.exports = {
  // Test-Umgebung
  testEnvironment: 'node',
  
  // Test-Dateien finden
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],
  
  // Dateien ignorieren
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],
  
  // Setup-Dateien
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage-Konfiguration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Server-Startup ausschließen
    '!src/database/seed.js', // Seed-Skripte ausschließen
    '!**/node_modules/**'
  ],
  
  // Coverage-Schwellenwerte (Produktions-Standards: 100%)
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // Module-Mapping für Aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Test-Timeout
  testTimeout: 30000,
  
  // Verbose Output
  verbose: true,
  
  // Farben in der Konsole
  colors: true,
  
  // Parallele Tests
  maxWorkers: '50%',
  
  // Test-Ergebnisse bereinigen
  clearMocks: true,
  restoreMocks: true,
  
  // Globals für Tests
  globals: {
    'process.env.NODE_ENV': 'test'
  }
};