const _ = require('lodash');
const Proxyable = require('./proxyable');


/**
 *  Meant to be used when a model wraps a JSON object/POJO. Allows for adding
 *  convenience/helper methods to the object without modifying the object itself.
 *
 *  @mixin
 *  @name module:slackbot/mixins~Jsonable
 *  @param {*} SuperClass=class{} The class to mix onto.
 *  @returns {Jsonable} The mixed class.
 *
 *  @requires slackbot/mixins~Proxyable
 *  @see Jsonable
 */
const Jsonable = (SuperClass = class {}) =>

/**
 *  Meant to be used when a model wraps a JSON object/POJO. Allows for adding
 *  convenience/helper methods to the object without modifying the object itself.
 *
 *  @class
 *  @alias Jsonable
 *  @extends Proxyable
 *
 *  @param {object} options
 *  @param {object} options.json={} The JSON object to wrap.
 *
 *  @see module:slackbot/mixins~Jsonable
 *  @throws {TypeError} If `options.json` is not a valid object.
 */
class extends Proxyable(SuperClass) {
  /**
   *  Returns the current json object proxied by the instance.
   *  @type {object}
   *  @readonly
   */
  get _json() {
    return this._proxied;
  }


  constructor({ json = {}, ...superOpts } = {}) {
    const obj = _.isString(json) ? JSON.parse(json) : json;

    if (!_.isObject(obj)) {
      // console.error(`Jsonable must be provided with valid JSON string or POJO!`);
      throw new TypeError(`Jsonable must be provided with valid JSON string or POJO!`);
    }

    super({ proxy: obj, ...superOpts });
  }

  /**
   *  Returns the current json object proxied by the instance So that `JSON.stringify`
   *  will function as expected.
   *  @returns {object}
   */
  toJSON() {
    return this._json;
  }

  /**
   *  Returns the current json object proxied by the instance after it is
   *  run through `JSON.stringify`.
   *  @returns {string}
   */
  toString() {
    return JSON.stringify(this._json);
  }
};


module.exports = Jsonable;
