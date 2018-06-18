const octokit = require('@octokit/rest')(); // https://github.com/octokit/rest.js

const Configable = require('../../mixins/configable');
const Identifyable = require('../../mixins/identifyable');
const Logable = require('../../mixins/logable');
const Proxyable = require('../../mixins/proxyable');

const _authenticate = Symbol('authenticate');
const _authenticated = Symbol('authenticated');


/**
 *  A wrapper around the github api. This handles authentication by accessing
 *  config values. Each instance meant to be registered as a singleton within
 *  a subscriber. The corresponding config key needs only a token, but can
 *  contain any other arbitrary data.
 *
 *  @alias Github
 *  @memberOf module:slackbot/models
 *  @mixes Configable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @mixes Proxyable
 *  @extends Configable
 *  @extends Identifyable
 *  @extends Logable
 *  @extends Proxyable
 *
 *  @see external:github-api
 */
class Github extends Proxyable(Identifyable(Logable(Configable()))) {
  constructor({ ...superOpts } = {}) {
    super({ proxy: octokit, ...superOpts });
    this[_authenticate]();
  }


  [_authenticate]() {
    if (this[_authenticated]) {
      return this;
    } else if (!this._config.token) {
      throw new Error('No configuration token found!');
    }

    return this._proxied.authenticate({ type: 'token', token: this._config.token });
  }
}


module.exports = Github;
