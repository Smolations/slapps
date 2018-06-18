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
class SelectActionOptionGroup extends JsonValidateable(Logable(Identifyable())) {
  get validationTemplate() {
    const template = {
      text: t => _.isString(t) && !_.isEmpty(t) && t.length <= 30,
      options: t => Array.isArray(t) && t.reduce((isValid, opt) => isValid && opt.isValid, true),
    };
    return Object.assign({}, template);
  }


  constructor({ text = null, options = [] } = {}) {
    const json = { text, options };
    super({ json });
  }
}


module.exports = SelectActionOptionGroup;
