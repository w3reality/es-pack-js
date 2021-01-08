module.exports = {
    preset: "jest-puppeteer",
    testMatch: ["<rootDir>/tests/browser/**/*.test.js"],
    verbose: true, // display each test name
    silent: true, // supress console.log()
    setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
};
