const Log = require('../models/log');

const _log = Symbol('log');


/**
 *  Using this mixin allows for an instance to gain access to a singleton
 *  logger via a {@link Log}, which will attempt log messages using the class's
 *  name as a prefix (guaranteed if the mixed class is {@link Identifyable}.
 *
 *  @mixin
 *  @name module:slackbot/mixins~Logable
 *  @param {*} SuperClass=class{} The class to mix onto.
 *  @returns {Logable} The mixed class.
 */
const Logable = (SuperClass = class {}) =>

/**
 *  Using this mixin allows for an instance to gain access to a singleton
 *  logger, which will log messages using the class's name as a prefix.
 *
 *  @class
 *  @alias Logable
 *
 *  @see module:slackbot/mixins~Logable
 */
class extends SuperClass {
  /**
   *  Allows for static methods/getters to log with an identity.
   *  @type {Log}
   *  @readonly
   */
  static get _log() {
    const label = this.name;
    this[_log] = this[_log] || new Log({ label });
    return this[_log];
  }

  /**
   *  Returns the singleton `Log` instance for logging.
   *  @type {Log}
   *  @readonly
   */
  get _log() {
    const label = this._className || this.constructor.name;
    this[_log] = this[_log] || new Log({ label });
    return this[_log];
  }
};


module.exports = Logable;
