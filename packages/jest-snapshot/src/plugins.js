/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {Path} from 'types/Config';

const ReactElementPlugin = require('pretty-format/plugins/ReactElement');
const ReactTestComponentPlugin = require('pretty-format/plugins/ReactTestComponent');

let PLUGINS = [ReactElementPlugin, ReactTestComponentPlugin];

exports.addPlugins = (plugins: Array<Path>) => {
  PLUGINS = PLUGINS.concat(plugins.map(p => {
    /* $FlowFixMe */
    return require(p);
  }));
};

exports.getPlugins = () => PLUGINS;
