/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

jest.mock('jest-resolve');

const path = require('path');
const utils = require('jest-util');
const normalize = require('../normalize');

const DEFAULT_JS_PATTERN = require('../constants').DEFAULT_JS_PATTERN;
const DEFAULT_CSS_PATTERN = '^.+\\.(css)$';

describe('normalize', () => {
  let root;
  let expectedPathFooBar;
  let expectedPathFooQux;
  let expectedPathAbs;
  let expectedPathAbsAnother;

  // Windows uses backslashes for path separators, which need to be escaped in
  // regular expressions. This little helper function helps us generate the
  // expected strings for checking path patterns.
  function joinForPattern() {
    return Array.prototype.join.call(
      arguments,
      utils.escapeStrForRegex(path.sep),
    );
  }

  // this helper takes a path starting from root and normalize it to unix style
  function uniformPath(pathToUniform) {
    const resolved = path.resolve(pathToUniform);
    return '/' + resolved.replace(root, '').split(path.sep).join('/');
  }

  beforeEach(() => {
    root = path.resolve('/');
    expectedPathFooBar = path.join(root, 'root', 'path', 'foo', 'bar', 'baz');
    expectedPathFooQux = path.join(root, 'root', 'path', 'foo', 'qux', 'quux');
    expectedPathAbs = path.join(root, 'an', 'abs', 'path');
    expectedPathAbsAnother = path.join(root, 'another', 'abs', 'path');
  });

  it('errors when an invalid config option is passed in', () => {
    const error = console.error;
    console.error = jest.fn();
    normalize({
      rootDir: '/root/path/foo',
      thisIsAnInvalidConfigKey: 'with a value even!',
    });

    expect(console.error).toBeCalledWith(
      'Error: Unknown config option "thisIsAnInvalidConfigKey" with value ' +
      '"with a value even!". This is either a typing error or a user ' +
      'mistake and fixing it will remove this message.',
    );

    console.error = error;
  });

  it('picks a name based on the rootDir', () => {
    expect(normalize({
      rootDir: '/root/path/foo',
    }).name).toBe('-root-path-foo');
  });

  it('keeps custom names based on the rootDir', () => {
    expect(normalize({
      name: 'custom-name',
      rootDir: '/root/path/foo',
    }).name).toBe('custom-name');
  });

  it('sets coverageReporters correctly when argv.json is set', () => {
    expect(normalize({
      rootDir: '/root/path/foo',
    }, {json: true}).coverageReporters).toEqual(['json', 'lcov', 'clover']);
  });

  describe('rootDir', () => {
    it('throws if the config is missing a rootDir property', () => {
      expect(() => {
        normalize({});
      }).toThrow(new Error(`Jest: 'rootDir' config value must be specified.`));
    });
  });

  describe('automock', () => {
    it('falsy automock is not overwritten', () => {
      const consoleWarn = console.warn;
      console.warn = jest.fn();
      const config = normalize({
        rootDir: '/root/path/foo',
        automock: false,
      });

      expect(config.automock).toBe(false);

      console.warn = consoleWarn;
    });
  });

  describe('browser', () => {
    it('falsy browser is not overwritten', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        browser: true,
      });

      expect(config.browser).toBe(true);
    });
  });

  describe('collectCoverageOnlyFrom', () => {
    it('normalizes all paths relative to rootDir', () => {
      const config = normalize({
        rootDir: '/root/path/foo/',
        collectCoverageOnlyFrom: {
          'bar/baz': true,
          'qux/quux/': true,
        },
      }, '/root/path');

      const expected = {};
      expected[expectedPathFooBar] = true;
      expected[expectedPathFooQux] = true;

      expect(config.collectCoverageOnlyFrom).toEqual(expected);
    });

    it('does not change absolute paths', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        collectCoverageOnlyFrom: {
          '/an/abs/path': true,
          '/another/abs/path': true,
        },
      });

      const expected = {};
      expected[expectedPathAbs] = true;
      expected[expectedPathAbsAnother] = true;

      expect(config.collectCoverageOnlyFrom).toEqual(expected);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        collectCoverageOnlyFrom: {
          '<rootDir>/bar/baz': true,
        },
      });

      const expected = {};
      expected[expectedPathFooBar] = true;

      expect(config.collectCoverageOnlyFrom).toEqual(expected);
    });
  });

  function testPathArray(key) {
    it('normalizes all paths relative to rootDir', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        [key]: [
          'bar/baz',
          'qux/quux/',
        ],
      }, '/root/path');

      expect(config[key]).toEqual([
        expectedPathFooBar, expectedPathFooQux,
      ]);
    });

    it('does not change absolute paths', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        [key]: [
          '/an/abs/path',
          '/another/abs/path',
        ],
      });

      expect(config[key]).toEqual([
        expectedPathAbs, expectedPathAbsAnother,
      ]);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        [key]: [
          '<rootDir>/bar/baz',
        ],
      });

      expect(config[key]).toEqual([expectedPathFooBar]);
    });
  }

  describe('testPathDirs', () => {
    testPathArray('testPathDirs');
  });

  describe('snapshotSerializers', () => {
    testPathArray('snapshotSerializers');
  });

  describe('transform', () => {
    it('normalizes the path according to rootDir', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        transform: {
          [DEFAULT_JS_PATTERN]: 'bar/baz',
          [DEFAULT_CSS_PATTERN]: 'qux/quux',
        },
      }, '/root/path');

      expect(config.transform).toEqual([
        [DEFAULT_JS_PATTERN, expectedPathFooBar],
        [DEFAULT_CSS_PATTERN, expectedPathFooQux],
      ]);
    });

    it('does not change absolute paths', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        transform: {
          [DEFAULT_JS_PATTERN]: '/an/abs/path',
          [DEFAULT_CSS_PATTERN]: '/an/abs/path',
        },
      });

      expect(config.transform).toEqual([
        [DEFAULT_JS_PATTERN, expectedPathAbs],
        [DEFAULT_CSS_PATTERN, expectedPathAbs],
      ]);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        transform: {
          [DEFAULT_JS_PATTERN]: '<rootDir>/bar/baz',
          [DEFAULT_CSS_PATTERN]: '<rootDir>/qux/quux',
        },
      });

      expect(config.transform).toEqual([
        [DEFAULT_JS_PATTERN, expectedPathFooBar],
        [DEFAULT_CSS_PATTERN, expectedPathFooQux],
      ]);
    });
  });

  describe('setupTestFrameworkScriptFile', () => {
    it('normalizes the path according to rootDir', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: 'bar/baz',
      }, '/root/path');

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathFooBar);
    });

    it('does not change absolute paths', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: '/an/abs/path',
      });

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathAbs);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: '<rootDir>/bar/baz',
      });

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathFooBar);
    });
  });

  describe('setupTestFrameworkScriptFile', () => {
    it('normalizes the path according to rootDir', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: 'bar/baz',
      }, '/root/path');

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathFooBar);
    });

    it('does not change absolute paths', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: '/an/abs/path',
      });

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathAbs);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: '<rootDir>/bar/baz',
      });

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathFooBar);
    });
  });

  describe('coveragePathIgnorePatterns', () => {
    it('does not normalize paths relative to rootDir', () => {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      const config = normalize({
        rootDir: '/root/path/foo',
        coveragePathIgnorePatterns: [
          'bar/baz',
          'qux/quux',
        ],
      }, '/root/path');

      expect(config.coveragePathIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux'),
      ]);
    });

    it('does not normalize trailing slashes', () => {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      const config = normalize({
        rootDir: '/root/path/foo',
        coveragePathIgnorePatterns: [
          'bar/baz',
          'qux/quux/',
        ],
      });

      expect(config.coveragePathIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux', ''),
      ]);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        coveragePathIgnorePatterns: [
          'hasNoToken',
          '<rootDir>/hasAToken',
        ],
      });

      expect(config.coveragePathIgnorePatterns).toEqual([
        'hasNoToken',
        joinForPattern('', 'root', 'path', 'foo', 'hasAToken'),
      ]);
    });
  });

  describe('testPathIgnorePatterns', () => {
    it('does not normalize paths relative to rootDir', () => {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      const config = normalize({
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: [
          'bar/baz',
          'qux/quux',
        ],
      }, '/root/path');

      expect(config.testPathIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux'),
      ]);
    });

    it('does not normalize trailing slashes', () => {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      const config = normalize({
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: [
          'bar/baz',
          'qux/quux/',
        ],
      });

      expect(config.testPathIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux', ''),
      ]);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: [
          'hasNoToken',
          '<rootDir>/hasAToken',
        ],
      });

      expect(config.testPathIgnorePatterns).toEqual([
        'hasNoToken',
        joinForPattern('', 'root', 'path', 'foo', 'hasAToken'),
      ]);
    });
  });

  describe('modulePathIgnorePatterns', () => {
    it('does not normalize paths relative to rootDir', () => {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      const config = normalize({
        rootDir: '/root/path/foo',
        modulePathIgnorePatterns: [
          'bar/baz',
          'qux/quux',
        ],
      }, '/root/path');

      expect(config.modulePathIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux'),
      ]);
    });

    it('does not normalize trailing slashes', () => {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      const config = normalize({
        rootDir: '/root/path/foo',
        modulePathIgnorePatterns: [
          'bar/baz',
          'qux/quux/',
        ],
      });

      expect(config.modulePathIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux', ''),
      ]);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        modulePathIgnorePatterns: [
          'hasNoToken',
          '<rootDir>/hasAToken',
        ],
      });

      expect(config.modulePathIgnorePatterns).toEqual([
        'hasNoToken',
        joinForPattern('', 'root', 'path', 'foo', 'hasAToken'),
      ]);
    });
  });

  describe('testRunner', () => {
    it('defaults to Jasmine 2', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
      });

      expect(config.testRunner).toMatch('jasmine2');
    });

    it('can be changed to jasmine1', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        testRunner: 'jasmine1',
      });

      expect(config.testRunner).toMatch('jasmine1');
    });

    it('is overwritten by argv', () => {
      const config = normalize(
        {
          rootDir: '/root/path/foo',
        },
        {
          testRunner: 'jasmine1',
        },
      );

      expect(config.testRunner).toMatch('jasmine1');
    });
  });

  describe('testEnvironment', () => {
    let Resolver;
    beforeEach(() => {
      Resolver = require('jest-resolve');
      Resolver.findNodeModule = jest.fn(name => {
        if (name === 'jsdom') {
          return 'node_modules/jsdom';
        }
        if (name === 'jest-environment-jsdom') {
          return 'node_modules/jest-environment-jsdom';
        }
        return null;
      });
    });

    it('resolves to an environment and prefers jest-environment-`name`', () => {
      const config = normalize({
        rootDir: '/root',
        testEnvironment: 'jsdom',
      });

      expect(config.testEnvironment)
        .toEqual('node_modules/jest-environment-jsdom');
    });

    it('throws on invalid environment names', () => {
      expect(() => normalize({
        rootDir: '/root',
        testEnvironment: 'phantom',
      })).toThrow(new Error(
        `Jest: test environment "phantom" cannot be found. Make sure the ` +
        `"testEnvironment" configuration option points to an existing node ` +
        `module.`,
      ));
    });
  });

  describe('babel-jest', () => {
    let Resolver;
    beforeEach(() => {
      Resolver = require('jest-resolve');
      Resolver.findNodeModule = jest.fn(
        name => 'node_modules' + path.sep + name,
      );
    });

    it('correctly identifies and uses babel-jest', () => {
      const config = normalize({
        rootDir: '/root',
      });

      expect(config.usesBabelJest).toBe(true);
      const jsTransformerPath = uniformPath(config.transform[0][1]);
      expect(config.transform[0][0]).toBe(DEFAULT_JS_PATTERN);
      expect(jsTransformerPath).toEqual('/root/node_modules/babel-jest');
      expect(config.setupFiles.map(uniformPath))
        .toEqual(['/root/node_modules/babel-polyfill']);
    });

    it('uses babel-jest if babel-jest is explicitly specified in a custom transform config', () => {
      const customJSPattern = '^.+\\.js$';
      const ROOT_DIR = '<rootDir>' + path.sep;
      const config = normalize({
        rootDir: '/root',
        transform: {
          [customJSPattern]: ROOT_DIR + Resolver.findNodeModule(
            'babel-jest',
          ),
        },
      });

      expect(config.usesBabelJest).toBe(true);
      const jsTransformerPath = uniformPath(config.transform[0][1]);
      expect(config.transform[0][0]).toBe(customJSPattern);
      expect(jsTransformerPath).toEqual('/root/node_modules/babel-jest');
      expect(config.setupFiles.map(uniformPath))
        .toEqual(['/root/node_modules/babel-polyfill']);
    });

    it(`doesn't use babel-jest if its not available`, () => {
      Resolver.findNodeModule.mockImplementation(() => null);

      const config = normalize({
        rootDir: '/root',
      });

      expect(config.usesBabelJest).toEqual(undefined);
      expect(config.transform).toEqual(undefined);
      expect(config.setupFiles).toEqual([]);
    });

    it('uses polyfills if babel-jest is explicitly specified', () => {
      const ROOT_DIR = '<rootDir>' + path.sep;

      const config = normalize({
        rootDir: '/root',
        transform: {
          [DEFAULT_JS_PATTERN]: ROOT_DIR + Resolver.findNodeModule(
            'babel-jest',
          ),
        },
      });

      expect(config.usesBabelJest).toBe(true);
      expect(config.setupFiles.map(uniformPath))
        .toEqual(['/root/node_modules/babel-polyfill']);
    });
  });

  describe('Upgrade help', () => {

    let consoleWarn;

    beforeEach(() => {
      consoleWarn = console.warn;
      console.warn = jest.fn();
    });

    afterEach(() => {
      console.warn = consoleWarn;
    });

    it('logs a warning when `scriptPreprocessor` and/or `preprocessorIgnorePatterns` are used', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        scriptPreprocessor: 'bar/baz',
        preprocessorIgnorePatterns: ['bar/baz', 'qux/quux'],
      });

      expect(config.transform).toEqual([['.*', expectedPathFooBar]]);
      expect(config.transformIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux'),
      ]);

      expect(config.scriptPreprocessor).toBe(undefined);
      expect(config.preprocessorIgnorePatterns).toBe(undefined);

      expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
    });
  });

});
