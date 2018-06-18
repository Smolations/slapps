const _ = require('lodash');
const Action = require('./action');


/**
 *  @interface
 *  @extends Action
 */
class ButtonAction extends Action {
  get validationTemplate() {
    const actionTemplate = super.validationTemplate;
    const template = {
      type:  t => _.isString(t) && /^button$/.test(t),
      style: t => _.isString(t) && /^default|primary|danger$/.test(t),
    };
    return Object.assign({}, actionTemplate, template);
  }

  constructor({ style = 'default', ...superOpts } = {}) {
    if (new.target === ButtonAction) {
      throw new SyntaxError('You cannot instantiate an abstract class!');
    }

    super({ type: 'button', style, ...superOpts });
  }
}


module.exports = ButtonAction;
