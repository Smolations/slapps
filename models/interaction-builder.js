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
   *  @returns {Array<attachment>}
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
   *  @param {string} options.name    See {@link slackInteractiveMessageAction}.
   *  @param {string} options.text    See {@link slackInteractiveMessageAction}.
   *  @param {string} options.value   See {@link slackInteractiveMessageAction}.
   *  @param {string} [options.style] See {@link slackInteractiveMessageAction}.
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
   *  @see slackInteractiveMessageAttachment
   */
  color(color) {
    return this[_merge]({ color });
  }

  /**
   *  Add confirmation dialog to the most recently-added action.
   *
   *  @param {object} options
   *  @param {string} options.text                   See {@link slackInteractiveMessageConfirmation}.
   *  @param {string} [options.title]                See {@link slackInteractiveMessageConfirmation}.
   *  @param {string} [options.okText='Okay']        See {@link slackInteractiveMessageConfirmation}.
   *  @param {string} [options.dismissText='Cancel'] See {@link slackInteractiveMessageConfirmation}.
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
   *  @param {array.<slackInteractiveMessageSelectOption>|array.<slackInteractiveMessageSelectOptionGroup>} options=[]
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
   *  @param {string} options.name                  See {@link slackInteractiveMessageAction}.
   *  @param {string} options.text                  See {@link slackInteractiveMessageAction}.
   *  @param {string} [options.value]               See {@link slackInteractiveMessageAction}.
   *  @param {string} [options.dataSource='static'] See {@link slackInteractiveMessageAction}.
   *  @param {array}  [options.selected=[]]         See {@link slackInteractiveMessageAction}.
   *  @param {number} [options.minQueryLength=0]    See {@link slackInteractiveMessageAction}.
   *  @returns {InteractionBuilder}
   */
  select({ name, text, value, dataSource = 'static', selected = [], minQueryLength = 0 } = {}) {
    const select = {
      type: 'select',
      name,
      text,
      value,
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


/**
 *  @typedef {object} slackInteractiveMessage
 *  @property {string}  text       The basic text of the message. Only required if the
 *                                 message contains zero attachments.
 *  @property {array.<attachment>} attachments Provide a JSON array of `attachment` objects.
 *                                 Adds additional components to the message. Messages
 *                                 should contain no more than 20 attachments.
 *  @property {string}  thread_ts  When replying to a parent message, this value is the
 *                                 `ts` value of the parent message to the thread.
 *  @property {string}  response_type  Expects one of two values:
 *    - `in_channel`: display the message to all users in the channel where a message button
 *    was clicked. Messages sent in response to invoked button actions are set to `in_channel`
 *    by default.
 *    - `ephemeral`:  display the message only to the user who clicked a message button.
 *    Messages sent in response to Slash commands are set to `ephemeral` by default.
 *    This field cannot be specified for a brand new message and must be used only in response
 *    to the execution of message button action or a slash command response. Once a
 *    `response_type` is set, it cannot be changed when updating the message.
 *  @property {boolean} replace_original  Used only when creating messages in response to a
 *                                 button action invocation. When set to `true`, the inciting
 *                                 message will be replaced by this message you're providing.
 *                                 When `false`, the message you're providing is considered a
 *                                 brand new message.
 *  @property {boolean} delete_original  Used only when creating messages in response to a
 *                                 button action invocation. When set to `true`, the inciting
 *                                 message will be deleted and if a message is provided, it
 *                                 will be posted as a brand new message.
 */
/**
 *  Attachments house message buttons and/or menus.
 *
 *  @typedef {object} slackInteractiveMessageAttachment
 *  @property {string} fallback                       A plaintext message displayed to users using an
 *                                                    interface that does not support attachments or
 *                                                    interactive messages. Consider leaving a URL
 *                                                    pointing to your service if the potential message
 *                                                    actions are representable outside of Slack.
 *                                                    Otherwise, let folks know what they are missing.
 *  @property {string} callback_id                    The provided string will act as a unique identifier
 *                                                    for the collection of buttons within the attachment.
 *                                                    It will be sent back to your message button action
 *                                                    URL with each invoked action. This field is required
 *                                                    when the attachment contains message buttons. It is
 *                                                    key to identifying the interaction you're working with.
 *  @property {array.<slackInteractiveMessageAction>} actions=[] A collection of actions (buttons or menus) to
 *                                                    include in the attachment. Required when using message
 *                                                    buttons or message menus. A maximum of 5 actions per
 *                                                    attachment may be provided.
 *  @property {string} [title]                        Provide this attachment with a visual header by
 *                                                    providing a short string here.
 *  @property {string} [color]                        Used to visually distinguish an attachment from other
 *                                                    messages. Accepts hex values and a few named colors
 *                                                    Use sparingly and according to best practices.
 *  @property {string} [attachment_type='default']    Even for message menus, remains the default value `default`.
 */
/**
 *  The actions you provide will be rendered as message buttons or menus to users.
 *
 *  @typedef {object} slackInteractiveMessageAction
 *  @property {string} name            Provide a string to give this specific action a name.
 *                                     The name will be returned to your Action URL along
 *                                     with the message's `callback_id` when this action is
 *                                     invoked. Use it to identify this particular response
 *                                     path. **If multiple actions share the same name, only
 *                                     one of them can be in a triggered state.**
 *  @property {string} text            The user-facing label for the message button or menu
 *                                     representing this action. Cannot contain markup. Best
 *                                     to keep these short and decisive. Use a maximum of
 *                                     30 characters or so for best results across form
 *                                     factors.
 *  @property {string} type            Provide `button` when this action is a message button
 *                                     or provide `select` when the action is a message menu.
 *  @property {string} [value]         Provide a string identifying this specific action. It
 *                                     will be sent to your Action URL along with the `name`
 *                                     and attachment's `callback_id`. If providing multiple
 *                                     actions with the same name, `value` can be strategically
 *                                     used to differentiate intent. Your value may contain
 *                                     up to 2000 characters.
 *  @property {slackInteractiveMessageConfirmation} [confirm] If you provide a JSON hash of
 *                                     confirmation fields, your button or menu will pop up
 *                                     a dialog with your indicated text and choices, giving
 *                                     them one last chance to avoid a destructive action or
 *                                     other undesired outcome.
 *  @property {string} [style]         Used only with message buttons, this decorates buttons
 *                                     with extra visual importance, which is especially
 *                                     useful when providing logical default action or
 *                                     highlighting a destructive activity.
 *    - `default`: Yes, it's the default. Buttons will look simple.
 *    - `primary`: Use this sparingly, when the button represents a key action to accomplish.
 *      You should probably only ever have one primary button within a set.
 *    - `danger`: Use this when the consequence of the button click will result in the
 *      destruction of something, like a piece of data stored on your servers. Use even
 *      more sparingly than primary.
 *  @property {array.<slackInteractiveMessageSelectOption>} [options] Used only with message menus.
 *                                     The individual options to appear in this menu,
 *                                     provided as an array of option fields. Required
 *                                     when `data_source` is `static` or otherwise unspecified.
 *                                     A maximum of 100 options can be provided in each
 *                                     menu.
 *  @property {array.<slackInteractiveMessageSelectOptionGroup>} [option_groups] Used only with
 *                                     message menus. An alternate, semi-hierarchal way to list
 *                                     available options. Provide an array of option group
 *                                     definitions. This replaces and supersedes the `options` array.
 *  @property {string} [data_source]   Accepts `static`, `users`, `channels`, `conversations`, or
 *                                     `external`. Our clever default behavior is `static`,
 *                                     which means the menu's options are provided directly
 *                                     in the posted message under `options`. Defaults to
 *                                     `static`. Example: `"channels"`
 *  @property {array} [selected_options] If provided, the first element of this array will be
 *                                     set as the pre-selected option for this menu. Any
 *                                     additional elements will be ignored.
 *  The selected option's `value` field is contextual based on menu type and is always required:
 *    - For menus of type `static` (the default) this should be in the list of options included in
 *      the action.
 *    - For menus of type `users`, `channels`, or `conversations`, this should be a valid ID of
 *      the corresponding type.
 *    - For menus of type `external` this can be any value, up to a couple thousand characters.
 *  @property {integer} [min_query_length] Only applies when `data_source` is set to `external`. If
 *                                     present, Slack will wait till the specified number of
 *                                     characters are entered before sending a request to your
 *                                     app's external suggestions API endpoint. Defaults to `1`.
 */
/**
 *  Protect users from destructive actions or particularly distinguished decisions by asking them to
 *  confirm their button click one more time. Use confirmation dialogs with care.
 *
 *  @typedef {object} slackInteractiveMessageConfirmation
 *  @property {string} [title]      Title the pop up window. Please be brief.
 *  @property {string} text         Describe in detail the consequences of the action and contextualize
 *                                  your button text choices. Use a maximum of 30 characters or so for
 *                                  best results across form factors.
 *  @property {string} ok_text      The text label for the button to continue with an action. Keep it
 *                                  short. Defaults to `Okay`.
 *  @property {string} dismiss_text The text label for the button to cancel the action. Keep it short.
 *                                  Defaults to `Cancel`.
 */
/**
 *  @typedef {object} slackInteractiveMessageSelectOption
 *  @property {string} text          A short, user-facing string to label this option to users.
 *                                   Use a maximum of 30 characters or so for best results across,
 *                                   you guessed it, form factors.
 *  @property {string} value         A short string that identifies this particular option to your
 *                                   application. It will be sent to your Action URL when this
 *                                   option is selected. While there's no limit to the value of
 *                                   your Slack app, this value may contain up to only 2000 characters.
 *  @property {string} [description] A user-facing string that provides more details about this option.
 *                                   Also should contain up to 30 characters.
 */
/**
 *  @typedef {object} slackInteractiveMessageSelectOptionGroup
 *  @property {string} text A short, user-facing string to label this option to users.
 *                          Use a maximum of 30 characters or so for best results across,
 *                          you guessed it, form factors.
 *  @property {array.<slackInteractiveMessageSelectOption>} options The individual options to
 *                          appear in this message menu, provided as an array of option fields.
 *                          Required when `data_source` is `default` or otherwise unspecified.
 */
