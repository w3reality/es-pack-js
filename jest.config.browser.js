module.exports = {
    testMatch: ["<rootDir>/tests/browser/**/*.test.js"],
    verbose: true, // display each test name
    silent: false,// !! true, // supress console.log()
    setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
};
