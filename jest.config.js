module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // *.live.test.ts files call the live Picnic API with PICNIC_AUTH_KEY. CI has no auth key, so it skips them.
  testPathIgnorePatterns: process.env.CI ? ["/node_modules/", "\\.live\\.test\\.ts$"] : ["/node_modules/"],
};
