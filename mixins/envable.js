const _ = require('lodash');

let _env = process.env.NODE_ENV || 'development';


/**
 *  Using this mixin allows for an instance to have a reference to a specified
 *  environment, which may or may not change its behavior. The default
 *  value for the environment is `process.env.NODE_ENV || 'development'`. Use
 *  `Envable.env()` to change the value for all `Envable`s.
 *
 *  @mixin
 *  @name module:slackbot/mixins~Envable
 *  @param {*} SuperClass=class{} The class to mix onto.
 *  @returns {Envable} The mixed class.
 *
 *  @see Envable
 */
const Envable = (SuperClass = class {}) =>

/**
 *  Using this mixin allows for an instance to have a reference to a specified
 *  environment, which may or may not change its behavior.
 *
 *  @class
 *  @alias Envable
 *
 *  @see module:slackbot/mixins~Envable
 */
class extends SuperClass {
  /**
   *  Returns the current environment for the instance.
   *  @type {string}
   *  @readonly
   */
  get _env() {
    return _env;
  }
};


/**
 *  Get/Set the current environment for all `Envable` instances. If no argument
 *  is provided, the current environment is returned.
 *
 *  @function
 *  @name module:slackbot/mixins~Envable.env
 *  @param {string} [env]
 *  @returns {string} The current environment.
 *
 *  @throws {TypeError} If the given environment is not a valid string.
 */
Envable.env = (env) => {
  if (env) {
    if (!_.isString(env) || _.isEmpty(env)) {
      throw new TypeError('Must provide valid environment string!');
    }
    _env = env;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Envable]  Environment set to: ${env}`);
    }
  }
  return _env;
}


module.exports = Envable;
