const Jsonable = require('./jsonable');
const ObjectValidator = require('../models/object-validator');


/**
 *  Using this mixin allows for a `Jsonable` instance to have built-in
 *  validation. The `Jsonable` mixin is already used here so subclasses
 *  don't need to implement it.
 *
 *  @mixin
 *  @name module:slackbot/mixins~JsonValidateable
 *  @param {*} SuperClass=class{} The class to mix onto.
 *  @returns {JsonValidateable} The mixed class.
 *
 *  @requires slackbot/mixins~Jsonable
 *  @see JsonValidateable
 */
const JsonValidateable = (SuperClass = class {}) =>

/**
 *  Using this mixin allows for a `Jsonable` instance to have built-in
 *  validation.
 *
 *  @class
 *  @alias JsonValidateable
 *  @param {object} options
 *  @param {object} options.json The JSON the class instance will wrap.
 *
 *  @see module:slackbot/mixins~JsonValidateable
 */
class extends Jsonable(SuperClass) {
  /**
   *  Whether or not the current JSON satisfies validation. Uses the {@link ObjectValidator}
   *  under the hood.
   *  @type {boolean}
   *  @readonly
   */
  get isValid() {
    this._log.debug('Validating...');
    const validator = new ObjectValidator({ template: this.validationTemplate });
    // return validator.exec(this._json);
    return validator.exec(this);
  }

  /**
   *  The validation template for use with the {@link ObjectValidator}. This
   *  template should conform to the format used by lodash's `_.conformTo()`
   *  method. This getter _should_ be overridden by subclasses. If not,
   *  the current instance will always be valid.
   *  @type {object}
   *  @default {}
   *  @readonly
   */
  get validationTemplate() {
    return {};
  }


  constructor({ json, ...superOpts } = {}) {
    super({ json, ...superOpts });
  }


  /**
   *  A convenience method to merge one object into the json of the current
   *  object.
   *
   *  @param {object} obj={} The object to merge.
   *  @returns {*} The current instance implementing this mixin.
   */
  merge(obj = {}) {
    Object.assign(this._json, obj);
    return this;
  }
};


module.exports = JsonValidateable;
