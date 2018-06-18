const _ = require('lodash');
const Identifyable = require('../../mixins/identifyable');
const JsonValidateable = require('../../mixins/json-validateable');
const Logable = require('../../mixins/logable');


/**
 *  This is a base class meant to be subclassed for any and all action types
 *  that can be included in an attachment's `actions` array. Subclass constructor
 *  `options` objects should pass the following to the `super(object)`:
 *  - `(string) type` - Should be either `button` or `select`.
 *  - `(string) text` - The text to be shown with the action.
 *
 *  @interface
 *  @extends Identifyable
 *  @extends JsonValidateable
 *  @extends Logable
 *  @mixes Identifyable
 *  @mixes JsonValidateable
 *  @mixes Logable
 *
 *  @param {object} options
 *  @param {string} options.type Should be `button` or `select`.
 *  @param {string} options.text The text to be shown with the action.
 *
 *  @throws {SyntaxError} If this interface is instantiated directly.
 */
class Action extends JsonValidateable(Logable(Identifyable())) {
  static get [Symbol.species]() {
    return Action;
  }

  /**
   *  Identifies the action as interactive (which means the attachment it
   *  belongs to must have a `callback_id`) or not interactive.
   *  @type {boolean}
   *  @readonly
   */
  get isInteractive() {
    return false;
  }

  get validationTemplate() {
    const template = {
      type: t => _.isString(t) && /^button|select$/.test(t),
      text: t => _.isString(t) && !_.isEmpty(t) && t.length <= 30,
    };
    return Object.assign({}, template);
  }

  constructor({ type, text, ...superOpts }) {
    const json = { type, text, ...superOpts };

    if (new.target === Action) {
      throw new SyntaxError('You cannot instantiate an abstract class!');
    }

    super({ json });
  }
}


module.exports = Action;
