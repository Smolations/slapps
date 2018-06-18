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
 */
class Field extends JsonValidateable(Logable(Identifyable())) {
  get validationTemplate() {
    const template = {
      title: t => _.isString(t) && !_.isEmpty(t),
      value: t => _.isString(t) && !_.isEmpty(t),
      short: t => _.isBoolean(t),
    };
    return Object.assign({}, template);
  }


  constructor({ title = null, value = null, short = false } = {}) {
    const json = { title, value, short };
    super({ json });
  }
}


module.exports = Field;
