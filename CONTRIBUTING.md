# Contributing

- Fork the repository and create a pull request with your changes. Please make sure to follow the code style.
- To assist with development, you can use code agents. The instructions for those are defined in the AGENTS.md file.
- You will either need to decompile the app for analysis, or use a tool like Frida to hook into the app and intercept requests.
- Instructions for app decompilation are in the AGENTS.md file.

## Writing the code and releasing a new version of the npm package

1. Do whatever code changes are necessary.
2. Bump the package number based on semver.
3. Run `npm install` to bump the version in the lockfile.
4. Run `npm run build` to build the code.
5. Run `npm run test` to run the tests to see if everything still works.
6. Merge the PR to main.
7. Create a tag with the new version.
8. Create release notes with the changes.
9. Publish the package to npm with `npm publish`.
