const _ = require('lodash');
const Identifyable = require('../../mixins/identifyable');
const JsonValidateable = require('../../mixins/json-validateable');
const Logable = require('../../mixins/logable');


/**
 *  Representative of a confirmation field used for interactive elements
 *  in a slack message. Common use cases are with an {@link InteractiveButtonAction}
 *  and a {@link SelectAction}.
 *
 *  @extends Identifyable
 *  @extends JsonValidateable
 *  @extends Logable
 *  @mixes Identifyable
 *  @mixes JsonValidateable
 *  @mixes Logable
 *
 *  @param {object} options                 For descriptions, see {@link attachmentActionConfirmation}.
 *  @param {string} options.title
 *  @param {string} options.text
 *  @param {string} [options.okText='Okay']
 *  @param {string} [options.dismissText='Cancel']
 *
 *  @see https://api.slack.com/docs/interactive-message-field-guide#confirmation_fields
 */
class ActionConfirmation extends JsonValidateable(Logable(Identifyable())) {
  get validationTemplate() {
    const template = {
      title: t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      text: t => _.isString(t) && !_.isEmpty(t),
      ok_text: t => _.isString(t) && !_.isEmpty(t),
      dismiss_text: t => _.isString(t) && !_.isEmpty(t),
    };
    return Object.assign({}, template);
  }

  constructor({ title = null, text = null, okText = 'Okay', dismissText = 'Cancel' } = {}) {
    const json = { title, text, ok_text: okText, dismiss_text: dismissText };
    super({ json });
  }
}


module.exports = ActionConfirmation;
