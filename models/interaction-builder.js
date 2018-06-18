const _ = require('lodash');

const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');

const ObjectValidator = require('./object-validator');


const _addAttachment = Symbol('addAttachment');
const _attachments = Symbol('attachments');
const _attachment = Symbol('attachment');
const _merge = Symbol('merge');
const _template = Symbol('template');
const _validateAttachment = Symbol('validateAttachment');
const _validateButton = Symbol('validateButton');
const _validateConfirmation = Symbol('validateConfirmation');
const _validateOption = Symbol('validateOption');
const _validateOptionGroup = Symbol('validateOptionGroup');
const _validateSelect = Symbol('validateSelect');


/**
 *  Build attachments for fancy messages. To make things simpler, an instance
 *  of this class manages the attachment object and the collection of attachments.
 *  All methods are chainable to make the creation of the message intuitive
 *  and concise. Use only the methods you need!
 *
 *  @memberOf module:slackbot/models
 *  @alias InteractionBuilder
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Logable
 *
 *  @example
 *  const intBuilder = new InteractionBuilder();
 *  const slack = Registry.for(this).get('Slack');
 *  const attachments = intBuilder
 *    .callbackId('novels')
 *    .fallback('You will see this message on your phone...')
 *    .title('The Great Escape')
 *    .button({ text: 'Get Info', name: 'info' })
 *    .button({ text: 'Read Sample', name: 'sample' })
 *    .build();
 *
 *  slack.postMessage({ channel, attachments });
 */
class InteractionBuilder extends Identifyable(Logable(Envable())) {
  constructor({ ...superOpts } = {}) {
    super(superOpts);
    this[_attachments] = [];
    this[_attachment] = this[_template]();
  }


  /**
   *  Adds in-progress attachment to attachments collection and creates a new
   *  one, ready for building.
   *
   *  @returns {InteractionBuilder}
   */
  br() {
    this[_addAttachment]();
    return this;
  }

  /**
   *  This is the last method you should call for your attachments. It will
   *  add the last in-progress attachment to the collections of attachments
   *  and then return the collection. You can then attach them to whatever
   *  message you are building.
   *
   *  It is worth noting here that an action's `options` and `option_groups`
   *  properties will be set to `null` when the `data_source` is anything
   *  other than `static` or `default`.
   *
   *  @returns {array.<attachment>}
   */
  build() {
    this[_addAttachment]();
    const attachments = this[_attachments].slice(0);
    this[_attachments] = [];

    // interactive elements have some optional properties which conflict
    // with each other if both are present, so we target and eliminate
    // properties based on that mutual exclusivity
    attachments.forEach((attachment) => {
      const { actions } = attachment;
      actions.forEach((action) => {
        if (!['default', 'static'].includes(action.data_source)) {
          delete action.option_groups;
          delete action.options;
          delete action.selected_options;
        } else if (!_.isEmpty(action.options)) {
          delete action.option_groups;
        } else if (!_.isEmpty(action.option_groups)) {
          delete action.options;
        }
      });
    });

    return attachments;
  }

  /**
   *  Adds a link button to the bottom of an attachment.
   *
   *  @param {object} options
   *  @param {string} options.name    See {@link attachmentAction}.
   *  @param {string} options.text    See {@link attachmentAction}.
   *  @param {string} options.value   See {@link attachmentAction}.
   *  @param {string} [options.style] See {@link attachmentAction}.
   *  @returns {InteractionBuilder}
   */
  button({ name, text, value, style } = {}) {
    const newButton = { type: 'button', name, text, value, style };
    if (this[_validateButton](newButton)) {
      this[_attachment].actions.push(newButton);
    } else {
      this._log.error(`Button is invalid!`);
    }
    return this;
  }

  /**
   *  The provided string will act as a unique identifier for the collection of
   *  buttons within the attachment. It will be sent back to your message button
   *  action URL with each invoked action. This field is required when the
   *  attachment contains message buttons. It is key to identifying the
   *  interaction you're working with.
   *
   *  @param {string} id
   *  @returns {InteractionBuilder}
   */
  callbackId(id) {
    return this[_merge]({ callback_id: id });
  }

  /**
   *  Used to visually distinguish an attachment from other messages. Accepts
   *  hex values and a few named colors as documented in attaching content to
   *  messages. Use sparingly and according to best practices.
   *
   *  @param {string} color
   *  @returns {InteractionBuilder}
   *
   *  @see attachment
   */
  color(color) {
    return this[_merge]({ color });
  }

  /**
   *  Add confirmation dialog to the most recently-added action.
   *
   *  @param {object} options
   *  @param {string} options.text                   See {@link attachmentActionConfirmation}.
   *  @param {string} [options.title]                See {@link attachmentActionConfirmation}.
   *  @param {string} [options.okText='Okay']        See {@link attachmentActionConfirmation}.
   *  @param {string} [options.dismissText='Cancel'] See {@link attachmentActionConfirmation}.
   *  @returns {InteractionBuilder}
   */
  confirm({ title, text, okText = 'Okay', dismissText = 'Cancel' } = {}) {
    const confirm = { title, text, ok_text: okText, dismiss_text: dismissText }
    const { actions } = this[_attachment];
    if (this[_validateConfirmation](confirm)) {
      actions[actions.length - 1].confirm = confirm;
    } else {
      this._log.error(`Confirm options invalid!`);
    }
    return this;
  }

  /**
   *  Tailored specifically for the `DeleteMessageInteractionListener`. This
   *  element is designed to be its own attachment and added at the end of
   *  a given list of attachments for a message.
   *
   *  @param {object} options
   *  @param {string} options.ts                This is critical so the button
   *                                            knows which message to remove.
   *  @param {string} [options.text='Dismiss']
   *  @param {string} [options.color='#3AA3E3']
   *  @returns {InteractionBuilder}
   */
  dismissButton({ ts, text = 'Dismiss', color = '#3AA3E3' } = {}) {
    const attachmentDirty = !_.isEqual(this[_template](), this[_attachment]);
    if (attachmentDirty) {
      this.br();
    }
    return this.callbackId('deleteMessage')
      .fallback('Darn! Tried to show Dismiss button...')
      .color(color)
      .button({ name: 'action', text, value: ts, style: 'danger' });
  }

  /**
   *  A plaintext message displayed to users using an interface that does not
   *  support attachments or interactive messages. Consider leaving a URL
   *  pointing to your service if the potential message actions are representable
   *  outside of Slack. Otherwise, let folks know what they are missing.
   *
   *  @param {string} text
   *  @returns {InteractionBuilder}
   */
  fallback(text) {
    return this[_merge]({ fallback: text });
  }


  /**
   *  Adds options to the most recently added action of type `select`. If no
   *  action of that type has been added, then it's a noop.
   *
   *  @param {array.<attachmentActionSelectOption>|array.<attachmentActionSelectOptionGroup>} options=[]
   *  @returns {InteractionBuilder}
   */
  options(options = []) {
    const selects = this[_attachment].actions.filter(action => action.type === 'select');
    const [firstOpt] = options;
    let allValid;
    let lastSelect;

    if (!selects.length) {
      this._log.error('No select elements found in working attachment!');
    } else if (!firstOpt) {
      this._log.error('No options provided!');
    } else {
      lastSelect = selects.slice(-1).pop();
      // this._log.json('selects', selects);
      // this._log.json('lastSelect', lastSelect);

      // check for options_groups
      if (firstOpt.hasOwnProperty('options')) {
        allValid = options.reduce((isValid, grp) => isValid && this[_validateOptionGroup](grp), true);
        if (allValid) {
          lastSelect.option_groups.push(...options);
        } else {
          this._log.error(`One or more option groups invalid!`);
        }
      } else {
        allValid = options.reduce((isValid, opt) => isValid && this[_validateOption](opt), true);
        if (allValid) {
          lastSelect.options.push(...options);
        } else {
          this._log.error(`One or more options invalid!`);
        }
      }
    }
    return this;
  }

  /**
   *  Adds a select element to the interaction. Add options to the element by
   *  chaining {@see InteractionBuilder#options} calls.
   *
   *  @param {object} options
   *  @param {string} options.name                  See {@link attachmentAction}.
   *  @param {string} options.text                  See {@link attachmentAction}.
   *  @param {string} [options.dataSource='static'] See {@link attachmentAction}.
   *  @param {array}  [options.selected=[]]         See {@link attachmentAction}.
   *  @param {number} [options.minQueryLength=0]    See {@link attachmentAction}.
   *  @returns {InteractionBuilder}
   */
  select({ name, text, dataSource = 'static', selected = [], minQueryLength = 0 } = {}) {
    const select = {
      type: 'select',
      name,
      text,
      options: [],
      option_groups: [],
      data_source: dataSource,
      selected_options: selected,
      min_query_length: minQueryLength,
    };
    if (this[_validateSelect](select)) {
      this[_attachment].actions.push(select);
    } else {
      this.log.json('ERROR: Invalid select params given!', { name, text, value, dataSource, selected, minQueryLength });
    }
    return this;
  }

  /**
   *  Provide this attachment with a visual header by providing a short string
   *  here.
   *
   *  @param {string} title
   *  @returns {InteractionBuilder}
   */
  title(title) {
    return this[_merge]({ title });
  }


  [_addAttachment]() {
    if (this[_validateAttachment](this[_attachment])) {
      this[_attachments].push(this[_attachment]);
      this[_attachment] = this[_template]();
      return true;
    } else {
      this._log.error(`Attachment JSON is invalid!`);
      return false;
    }
  }

  [_merge](source = {}) {
    Object.assign(this[_attachment], source);
    return this;
  }

  [_template]() {
    return Object.assign({}, {
      callback_id: null,
      fallback: null,
      title: null,
      color: null,
      attachment_type: 'default',
      actions: [],
    });
  }

  [_validateAttachment](attachment) {
    this._log.debug('Validating attachment...');
    const template = {
      callback_id: t => _.isString(t) && !_.isEmpty(t),
      fallback: t => _.isString(t) && !_.isEmpty(t),
      title: t => _.isNil(t) || _.isString(t),
      color: t => _.isNil(t) || (_.isString(t) && /^(?:good|warning|danger|#[a-f0-9]{6})$/i.test(t)),
      attachment_type: t => t === 'default',
      actions: a => _.isArray(a) && a.length > 0 && a.length <= 5,
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(attachment);
  }

  [_validateButton](button) {
    this._log.debug('Validating button...');
    const template = {
      type: t => t === 'button',
      name: t => _.isString(t) && !_.isEmpty(t),
      text: t => _.isString(t) && !_.isEmpty(t),
      value: t => _.isNil(t) || _.isString(t),
      style: t => _.isNil(t) || /^(default|primary|danger)$/.test(t),
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(button);
  }

  [_validateConfirmation](confirm) {
    this._log.debug('Validating confirmation...');
    const template = {
      title: t => _.isNil(t) || _.isString(t),
      text: t => _.isString(t) && !_.isEmpty(t),
      dismiss_text: t => _.isString(t) && !_.isEmpty(t),
      ok_text: t => _.isString(t) && !_.isEmpty(t),
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(confirm);
  }

  [_validateOption](option) {
    this._log.debug('Validating select option...');
    const template = {
      description: t => _.isNil(t) || _.isString(t),
      text: t => _.isString(t) && !_.isEmpty(t),
      value: t => _.isString(t) && !_.isEmpty(t),
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(option);
  }

  [_validateOptionGroup](optionGroup) {
    this._log.debug('Validating select option group...');
    const template = {
      text: t => _.isString(t) && !_.isEmpty(t),
      options: o => _.isArray(o) && !_.isEmpty(o) && o.reduce((valid, opt) => valid && this[_validateOption](opt), true),
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(optionGroup);
  }

  [_validateSelect](select) {
    this._log.debug('Validating select...');
    const template = {
      type: t => t === 'select',
      name: t => _.isString(t) && !_.isEmpty(t),
      text: t => _.isString(t) && !_.isEmpty(t),
      value: t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      options: a => _.isArray(a),
      option_groups: a => _.isArray(a),
      data_source: t => _.isString(t) && /^(?:static|users|channels|converstions|external)$/.test(t),
      selected_options: a => _.isArray(a) && a.reduce((isValid, opt) => isValid && this[_validateOption](opt), true),
      min_query_length: n => _.isInteger(n) && n >= 0,
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(select);
  }
}


module.exports = InteractionBuilder;
