const _ = require('lodash');
const Identifyable = require('../../mixins/identifyable');
const JsonValidateable = require('../../mixins/json-validateable');
const Logable = require('../../mixins/logable');


/**
 *  @extends Identifyable
 *  @extends JsonValidateable
 *  @extends Logable
 *  @mixes Identifyable
 *  @mixes JsonValidateable
 *  @mixes Logable
 *
 *  @param {string} text          The user-facing text for the option seen in the `select`.
 *  @param {string} value         The value used by the server to identify the action.
 *  @param {string} [description] This shows up in gray next to the option `text`.
 */
class SelectActionOption extends JsonValidateable(Logable(Identifyable())) {
  get validationTemplate() {
    const template = {
      description: t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t) && t.length <= 30),
      text:        t => _.isString(t) && !_.isEmpty(t) && t.length <= 30,
      value:       t => _.isString(t) && !_.isEmpty(t) && t.length <= 2000,
    };
    return Object.assign({}, template);
  }


  constructor({ text = null, description = null, value = null } = {}) {
    const json = { text, description, value };
    super({ json });
    console.log(this);
    console.log(this._json);
  }
}


module.exports = SelectActionOption;
