/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

const jestExpect = require('../').expect;
const matcherUtils = require('jest-matcher-utils');

jestExpect.extend({
  toBeDivisibleBy(actual, expected) {
    const pass = actual % expected === 0;
    const message = pass
      ? `expected ${actual} not to be divisible by ${expected}`
      : `expected ${actual} to be divisible by ${expected}`;

    return {message, pass};
  },
});

it('is available globally', () => {
  jestExpect(15).toBeDivisibleBy(5);
  jestExpect(15).toBeDivisibleBy(3);
  jestExpect(15).not.toBeDivisibleBy(6);

  jestExpect(() => jestExpect(15).toBeDivisibleBy(2))
    .toThrowErrorMatchingSnapshot();
});

it('exposes matcherUtils in context', () => {
  jestExpect.extend({
    _shouldNotError(actual, expected) {
      const pass = this.utils === matcherUtils;
      const message = pass
        ? `expected this.utils to be defined in an extend call`
        : `expected this.utils not to be defined in an extend call`;

      return {pass, message};
    },
  });

  jestExpect()._shouldNotError();
});
