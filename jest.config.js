module.exports = {
    testMatch: ["<rootDir>/tests/node/**/*.test.js"],
    verbose: true, // display each test name
    silent: true, // supress console.log()
    setupFilesAfterEnv: ["./jest.setup.js"],
};
