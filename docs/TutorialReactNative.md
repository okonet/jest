---
id: tutorial-react-native
title: Tutorial – React Native
layout: docs
category: Quick Start
permalink: docs/tutorial-react-native.html
next: tutorial-async
---

At Facebook, we use Jest to test [React Native](http://facebook.github.io/react-native/)
applications.

Get a deeper insight into testing a working example React Native app reading the following series: [Part 1: Jest – Snapshot come into play](https://blog.callstack.io/unit-testing-react-native-with-the-new-jest-i-snapshots-come-into-play-68ba19b1b9fe#.12zbnbgwc) and [Part 2: Jest – Redux Snapshots for your Actions and Reducers](https://blog.callstack.io/unit-testing-react-native-with-the-new-jest-ii-redux-snapshots-for-your-actions-and-reducers-8559f6f8050b).

## Setup

We'll need to use the `jest-react-native` preset and we are going to use the `babel-jest` package as a transformer
for Jest. Also see [babel integration](/jest/docs/getting-started.html#babel-integration).

Run the following command to install the necessary dependencies:
```
npm install --save-dev jest babel-jest jest-react-native babel-preset-react-native react-test-renderer
```

Add the following configuration to your package.json file:
```javascript
// package.json
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "preset": "jest-react-native"
  }
```

And create a `.babelrc` file with the following contents, if you haven't already:
```javascript
// .babelrc
{
  "presets": ["react-native"]
}
```

**And you're good to go!**

## Snapshot Test

Snapshot testing was introduced in Jest 14.0. More information on how it works and why we built it can be found on the [release blog post](/jest/blog/2016/07/27/jest-14.html).

Let's build a small intro component with a few views and text components and some styles.

```javascript
// Intro.js
import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default class Intro extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          This is a React Native snapshot test.
        </Text>
      </View>
    );
  }
}
```

Now let's use React's test renderer and Jest's snapshot feature to interact with the component and capture the rendered output and create a snapshot file:

```javascript
// __tests__/Intro-test.js
import 'react-native';
import React from 'react';
import Intro from '../Intro';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  const tree = renderer.create(
    <Intro />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
```

When you run `npm test` or `jest`, this will produce an output file like this:

```javascript
// __tests__/__snapshots__/Intro-test.js.snap
exports[`Intro renders correctly 1`] = `
<View
  style={
    Object {
      "alignItems": "center",
      "backgroundColor": "#F5FCFF",
      "flex": 1,
      "justifyContent": "center",
    }
  }>
  <Text
    style={
      Object {
        "fontSize": 20,
        "margin": 10,
        "textAlign": "center",
      }
    }>
    Welcome to React Native!
  </Text>
  <Text
    style={
      Object {
        "color": "#333333",
        "marginBottom": 5,
        "textAlign": "center",
      }
    }>
    This is a React Native snapshot test.
  </Text>
</View>
`;
```

The next time you run the tests, the rendered output will be compared to the previously created snapshot. The snapshot should be committed along code changes. When a snapshot test fails, you need to inspect whether it is an intended or unintended change. If the change is expected you can invoke Jest with `jest -u` to overwrite the existing snapshot.

The code for this example is available at
[examples/react-native](https://github.com/facebook/jest/tree/master/examples/react-native).

## Preset configuration

The preset sets up the environment and is very opinionated and based on what we found to be useful at Facebook. All of the configuration options can be overwritten just as they can be customized when no preset is used.

### Node Environment

Instead of `jsdom`, a simple `node` environment is loaded that is similar to a react-native environment. Because the node environment doesn't load any DOM or browser APIs it improves Jest's startup greatly.

### transformIgnorePatterns customization

The [`transformIgnorePatterns`](api.html#transformignorepatterns-array-string) option can be used to whitelist or blacklist files from being transformed with babel. Many react-native npm modules unfortunately don't pre-compile their source code before publishing.

By default the jest-react-native preset only processes the project's own source files and react-native. If you have npm dependencies that have to be transformed you can customize this configuration option by whitelisting modules other than react-native:

```js
"transformIgnorePatterns": [
  "node_modules/(?!react-native|my-project|react-native-button)"
]
```

### setupFiles

If you'd like to provide additional configuration for every test file, the [`setupFiles`](api.html#setupfiles-array) configuration option can be used to specify setup scripts.

### moduleNameMapper

The [`moduleNameMapper`](api.html#modulenamemapper-object-string-string) can be used to map a module path to a different module. By default the preset maps all images to an image stub module but if a module cannot be found this configuration option can help:

```js
"moduleNameMapper": {
  "my-module.js": "<rootDir>/path/to/my-module.js"
}
```

## Tips

### Mock native modules using jest.mock

The jest-react-native preset comes with a few default mocks that are applied on a react-native repository. However some react-native components or third party components rely on native code to be rendered. In such cases, Jest's manual mocking system can help to mock out the underlying implementation.

For example, if your code depends on a third party native video component called `react-native-video` you might want to stub it out with a manual mock like this:

```js
jest.mock('react-native-video', () => 'Video');
```

This will render the component as `<Video {...props} />` with all of its props in the snapshot output.

Sometimes you need to provide a more complex manual mock. For example if you'd like to forward the prop types or static fields of a native component to a mock, you can return a different React component from a mock through this helper from jest-react-native:

```js
jest.mock('path/to/MyNativeComponent', () => {
  const jestReactNative = require('jest-react-native');
  return jestReactNative.mockComponent('path/to/MyNativeComponent');
});
```

Or if you'd like to create your own manual mock, you can do something like this:

```js
jest.mock('Text', () => {
  const RealComponent = require.requireActual('Text');
  const React = require('React');
  class Text extends React.Component {
    render() {
      return React.createElement('Text', this.props, this.props.children);
    }
  }
  Text.propTypes = RealComponent.propTypes;
  return Text;
});
```

In other cases you may want to mock a native module that isn't a React component. The same technique can be applied. We recommend inspecting the native module's source code and logging the module when running a react native app on a real device and then modeling a manual mock after the real module.

If you end up mocking the same modules over and over it is recommended to define these mocks in a separate file and add it to the list of `setupFiles`.

### require react-native before the test renderer

Currently it is required to require react-native before loading the test renderer:

```
import 'react-native';
// Require after react-native
import renderer from 'react-test-renderer';
```

### `@providesModule`
If you'd like to use Facebook's `@providesModule` module system through an npm package, the default haste config option must be overwritten and npm modules must be added to `providesModuleNodeModules`:

```js
"haste": {
  "defaultPlatform": "ios",
  "platforms": ["android", "ios"],
  "providesModuleNodeModules": [
    "react",
    "react-native",
    "my-awesome-module",
    "my-text-component"
  ]
},
```

If you'd like to test a different default platform or if you are building for other platforms, the `defaultPlatform` and `platforms` configuration option can be updated.
