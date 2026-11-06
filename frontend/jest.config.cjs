module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
    transform: {
        '^.+\\.(t|j)sx?$': 'babel-jest',
    },
    moduleNameMapper: {
        '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
        '\\.(svg|png|jpg|jpeg|gif|webp|avif)$': '<rootDir>/src/__tests__/__mocks__/fileMock.js',
    },
    testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{js,jsx}'],
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 70,
            functions: 70,
            lines: 70,
        },
    },
};

