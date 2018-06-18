const _ = require('lodash');
const ButtonAction = require('./button-action');


/**
 *  @extends ButtonAction
 */
class InteractiveButtonAction extends ButtonAction {
  get isInteractive() {
    return true;
  }

  get validationTemplate() {
    const buttonActionTemplate = super.validationTemplate;
    const template = {
      name: t => _.isString(t) && !_.isEmpty(t),
      value: t => _.isString(t) && !_.isEmpty(t),
      confirm: c => _.isNil(c) || (c._className === 'ActionConfirmation' && c.isValid),
    };
    return Object.assign({}, buttonActionTemplate, template);
  }

  constructor({ name = null, value = null, confirm = null, ...superOpts } = {}) {
    super({ name, value, confirm, ...superOpts });
  }
}


module.exports = InteractiveButtonAction;
