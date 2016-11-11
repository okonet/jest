---
id: troubleshooting
title: Troubleshooting
layout: docs
category: Reference
permalink: docs/troubleshooting.html
next: mock-functions
---

Uh oh, something went wrong? Use this guide to resolve issues with Jest.

### Tests are Failing and You Don't Know Why

Try using the debugging support built into Node.

Place a `debugger;` statement in any of your tests, and then, in your project's directory, run:

`node --debug-brk ./node_modules/.bin/jest -i [any other arguments here]`

This will run Jest in a Node process that an external debugger can connect to. Note that the process
will pause until the debugger has connected to it.

For example, to connect the [Node Inspector](https://github.com/node-inspector/node-inspector)
debugger to the paused process, you would first install it (if you don't have it installed already):

`npm install -g node-inspector`

Then simply run it:

`node-inspector`

This will output a link that you can open in Chrome. After opening that link, the Chrome Developer Tools will be displayed, and a breakpoint will be set at the first line of the Jest CLI script (this is done simply to give you time to open the developer tools and to prevent Jest from executing before you have time to do so). Click the button that looks like a "play" button in the upper right hand side of the screen to continue execution. When Jest executes the test that contains the `debugger` statement, execution will pause and you can examine the current scope and call stack.

*Note: the `-i` cli option makes sure Jest runs test in the same process rather than spawning processes for individual tests. Normally Jest parallelizes test runs across processes but it is hard to debug many processes at the same time.*

More information on Node debugging can be found here: https://nodejs.org/api/debugger.html

### Caching Issues

The transform script was changed or babel was updated and the changes aren't
being recognized by Jest?

Retry with `--no-cache`.

Explanation: Jest caches transformed module files to speed up test execution.
If you are using your own custom transformer, consider adding a `getCacheKey`
function to it: [getCacheKey in Relay](https://github.com/facebook/relay/blob/master/scripts/jest/preprocessor.js#L63-L67).

### Unresolved Promises

If a promise doesn't resolve at all, this error might be thrown:

```
- Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.`
```

Most commonly this is being caused by conflicting Promise implementations.
Consider replacing the global promise implementation with your own, for example
`global.Promise = require.requireActual('promise');` and/or consolidate the
used Promise libraries to a single one.

If your test is long running, you may want to consider to increase the timeout
specified in `jasmine.DEFAULT_TIMEOUT_INTERVAL`.

```
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; // 10 second timeout
```

### Watchman Issues

Try running Jest with `--no-watchman` or set the `watchman` configuration option
to `false`.

Also see [watchman troubleshooting](https://facebook.github.io/watchman/docs/troubleshooting.html).

### I'm using npm3 and my node_modules aren't properly loading.

Upgrade `jest-cli` to `0.9.0` or above.

### I'm using babel and my unmocked imports aren't working?

Upgrade `jest-cli` to `0.9.0` or above.

Explanation:

```js
jest.dontMock('foo');

import foo from './foo';
```

In ES2015, import statements get hoisted before all other

```js
var foo = require('foo');
jest.dontMock('foo'); // Oops!
```

In Jest 0.9.0, a new API `jest.unmock` was introduced. Together with a plugin
for babel, this will now work properly when using `babel-jest`:

```js
jest.unmock('foo'); // Use unmock!

import foo from './foo';

// foo is not mocked!
```

See the [Getting Started](/jest/docs/getting-started.html) guide on how to
enable babel support.

### I upgraded to Jest 0.9.0 and my tests are now failing?

Jest is now using Jasmine 2 by default. It should be easy to upgrade using the
Jasmine [upgrade guide](http://jasmine.github.io/2.0/introduction.html).

If you would like to continue using Jasmine 1, set the `testRunner` config
option to `jasmine1` or pass `--testRunner=jasmine1` as a command line option.

### Compatibility issues

Jest takes advantage of new features added to Node 4. We recommend that you
upgrade to the latest stable release of Node. The minimum supported version is
`v4.0.0`. Versions `0.x.x` are not supported.

### Still unresolved?

See [Support](/jest/support.html).
