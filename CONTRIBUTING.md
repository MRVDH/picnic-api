# Contributing

## Setting up the development environment and intercepting requests

1. Install android emulator (from Android Studio for example).
2. Install apk-mitm.
3. Install mitmproxy.
4. Download the Picnic APK from APK Pure or get it from your phone.
5. Run apk-mitm on the picnic apk. It might complain about it being bundled, you can ignore that.
6. Install the apk on the emulator.
7. Go to the network settings on android and disable mobile data.
8. In wifi, go to the network and set the proxy to the IP of the machine or 10.0.2.2.
9. Run mitmproxy (or mitmweb for an easier interface in the browser).
10. On Android open the browser and go to mitm.it.
11. Download the certificate from the page and install it through the android settings.
12. Open the picnic app and watch as the requests come in on the mitmproxy.

## Writing the code and releasing a new version of the npm package

1. Do whatever code changes are necessary.
2. Bump the package number based on semver.
3. Run `npm run build` to build the code.
4. Run `npm run test` to run the tests to see if everything still works.
5. Merge the PR to main.
6. Create a tag with the new version.
7. Create release notes with the changes.
8. Publish the package to npm with `npm publish`.
