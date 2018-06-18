const _ = require('lodash');
const ButtonAction = require('./button-action');


/**
 *  @extends ButtonAction
 */
class LinkButtonAction extends ButtonAction {
  get validationTemplate() {
    const buttonActionTemplate = super.validationTemplate;
    const template = {
      url: t => _.isString(t) && /^https?:\/\//.test(t),
    };
    return Object.assign({}, buttonActionTemplate, template);
  }

  constructor({ url = null, ...superOpts } = {}) {
    super({ url, ...superOpts });
  }
}


module.exports = LinkButtonAction;
