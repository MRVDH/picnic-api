# Contributing

- Fork the repository and create a pull request with your changes. Please make sure to follow the code style.
- To assist with development, you can use code agents. The instructions for those are defined in the AGENTS.md file.
- You will either need to decompile the app for analysis, or use a tool like Frida to hook into the app and intercept requests.
- Instructions for app decompilation are in the AGENTS.md file.

## Writing the code and releasing a new version of the npm package

1. Do whatever code changes are necessary.
2. Bump the version based on semver with `npm version <patch|minor|major|x.y.z> --no-git-tag-version`. This updates
   both `package.json` and the lockfile.
3. Run `npm run test`, including the `*.live.test.ts` files: they need `PICNIC_AUTH_KEY` in `.env` and the publish
   workflow skips them.
4. Merge the PR to main.
5. Draft a new release on GitHub with a new tag `v<version>` (e.g. `v4.11.0`), click "Generate release notes" and
   publish it.

6. Approve the staged version on npmjs.com under "Staged Packages" (requires 2FA).

Publishing the release starts the [publish workflow](.github/workflows/publish.yml). It checks that the tag matches
the version in `package.json`, builds, runs the tests and stages the version on npm through trusted publishing. The
version becomes available on npm after the approval in step 6.
