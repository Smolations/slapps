const _ = require('lodash');

const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');

const ObjectValidator = require('./object-validator');


const _dialog = Symbol('attachment');
const _merge = Symbol('merge');
const _template = Symbol('template');
const _validateDialog = Symbol('validateDialog');
const _validateOption = Symbol('validateOption');
const _validateOptionGroup = Symbol('validateOptionGroup');
const _validateSelect = Symbol('validateSelect');
const _validateText = Symbol('validateText');
const _validateTextarea = Symbol('validateTextarea');


/**
 *  Build attachments for fancy messages. To make things simpler, an instance
 *  of this class manages the attachment object and the collection of attachments.
 *  All methods are chainable to make the creation of the message intuitive
 *  and concise. Use only the methods you need!
 *
 *  @memberOf module:slackbot/models
 *  @alias DialogBuilder
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Logable
 *
 *  @example
 *  const dialogBuilder = new DialogBuilder();
 *  const slack = Registry.for(this).get('Slack');
 *  const selectOpts = [...];
 *  const trigger_id = { message }; // acquired from triggering message
 *
 *  const dialog = dialogBuilder
 *    .callbackId('myCallbackId')
 *    .title('Dialog title')
 *    .select({ name: 'someName', label: 'I am a label' })
 *    .options(selectOpts)
 *    .textarea({ name: 'someLongText', label: 'Cool textarea bro' })
 *    .submitLabel('OneWordLabel')
 *    .build(trigger_id);
 *
 *  slack.openDialog(dialog);
 */
class DialogBuilder extends Identifyable(Logable(Envable())) {
  constructor({ ...superOpts } = {}) {
    super(superOpts);
    this[_dialog] = this[_template]();
  }


  /**
   *  This is the last method you should call for your dialog. It will
   *  return the last in-progress dialog and then reset the builder, making it
   *  ready for a new dialog to be created.
   *
   *  @param {string} triggerId The trigger ID to which this dialog is responding.
   *  @returns {SlackDialog|null} Returns `null` if validation fails.
   */
  build(triggerId) {
    const dialog = this[_dialog];
    const payload = { trigger_id: triggerId, dialog };

    const selects = dialog.elements.filter(element => element.type === 'select');
    selects.forEach((select) => {
      if (select.data_source !== 'static') {
        delete select.option_groups;
        delete select.options;
        delete select.selected_options;
      } else if (!_.isEmpty(select.options)) {
        delete select.option_groups;
      } else if (!_.isEmpty(select.option_groups)) {
        delete select.options;
      }
    });

    if (!_.isString(triggerId) || _.isEmpty(triggerId)) {
      this._log.error('Trigger ID must be a non-empty string!');
    } else if (this[_validateDialog](dialog)) {
      this._log.debug('dialog valid');
      this[_dialog] = this[_template]();
      this._log.debug('returning payload');
      return payload;
    } else {
      this._log.error('Dialog JSON is invalid!');
    }

    return null;
  }

  /**
   *  The provided string will act as a unique identifier for the response of
   *  the dialog. It will be sent back to your interactive message endpoint
   *  with the `callback_id` once the dialog is submitted. It is key to identifying
   *  the interaction with which you're working.
   *
   *  @param {string} id
   *  @returns {DialogBuilder}
   */
  callbackId(id) {
    return this[_merge]({ callback_id: id });
  }

  /**
   *  Whether or not you want to be notified when the dialog's cancel button
   *  is clicked. If not set, will default to `false`.
   *
   *  @param {boolean} notify
   *  @returns {DialogBuilder}
   */
  notifyOnCancel(notify) {
    return this[_merge]({ notify_on_cancel: notify });
  }

  /**
   *  Adds options to the most recently added action of type `select`. If no
   *  action of that type has been added, then it's a noop.
   *
   *  @param {array.<slackDialogSelectOption>|array.<slackDialogSelectOptionGroup>} options=[]
   *  @returns {DialogBuilder}
   */
  options(options = []) {
    const selects = this[_dialog].elements.filter(element => element.type === 'select');
    const [firstOpt] = options;
    let allValid;
    let lastSelect;

    if (!selects.length) {
      this._log.error('No select elements found in working dialog!');
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
   *  chaining {@see DialogBuilder#options} calls.
   *
   *  @param {object}  options
   *  @param {string}  options.name                  See {@link slackDialogSelectElement}.
   *  @param {string}  options.label                 See {@link slackDialogSelectElement}.
   *  @param {string}  [options.value]               See {@link slackDialogSelectElement}.
   *  @param {boolean} [options.optional=false]      See {@link slackDialogSelectElement}.
   *  @param {string}  [options.dataSource='static'] See {@link slackDialogSelectElement}.
   *  @param {array}   [options.selected=[]]         See {@link slackDialogSelectElement}.
   *  @returns {DialogBuilder}
   */
  select({ name, label, value, dataSource = 'static', selected = [], optional = false } = {}) {
    const select = {
      type: 'select',
      name,
      label,
      value,
      optional,
      options: [],
      option_groups: [],
      data_source: dataSource,
      selected_options: selected,
    };
    if (this[_validateSelect](select)) {
      this[_dialog].elements.push(select);
    }
    return this;
  }

  /**
   *  The label for the submit button. If not set, will default to `Submit`.
   *
   *  @param {string} label
   *  @returns {DialogBuilder}
   */
  submitLabel(label) {
    return this[_merge]({ submit_label: label });
  }

  /**
   *  @param {object} options
   *  @param {object} options.label            See {@link slackDialogTextElement}.
   *  @param {object} options.name             See {@link slackDialogTextElement}.
   *  @param {object} [options.hint]           See {@link slackDialogTextElement}.
   *  @param {object} [options.subtype]        See {@link slackDialogTextElement}.
   *  @param {object} [options.placeholder]    See {@link slackDialogTextElement}.
   *  @param {object} [options.optional=false] See {@link slackDialogTextElement}.
   *  @param {object} [options.minLength=0]    See {@link slackDialogTextElement}.
   *  @param {object} [options.maxLength=150]  See {@link slackDialogTextElement}.
   *  @param {object} [options.defaultValue]   See {@link slackDialogTextElement}.
   *  @returns {DialogBuilder}
   */
  text({ label, name, hint, subtype, defaultValue, placeholder, maxLength = 150, minLength = 0, optional = false}) {
    const element = {
      type: 'text',
      label,
      name,
      hint,
      subtype,
      placeholder,
      optional,
      max_length: maxLength,
      min_length: minLength,
      value: defaultValue,
    };
    if (this[_validateText](element)) {
      this[_dialog].elements.push(element);
    }
    return this;
  }

  /**
   *  @param {object} options
   *  @param {object} options.label            See {@link slackDialogTextareaElement}.
   *  @param {object} options.name             See {@link slackDialogTextareaElement}.
   *  @param {object} [options.hint]           See {@link slackDialogTextareaElement}.
   *  @param {object} [options.subtype]        See {@link slackDialogTextareaElement}.
   *  @param {object} [options.placeholder]    See {@link slackDialogTextareaElement}.
   *  @param {object} [options.optional=false] See {@link slackDialogTextareaElement}.
   *  @param {object} [options.minLength=0]    See {@link slackDialogTextareaElement}.
   *  @param {object} [options.maxLength=3000] See {@link slackDialogTextareaElement}.
   *  @param {object} [options.defaultValue]   See {@link slackDialogTextareaElement}.
   *  @returns {DialogBuilder}
   */
  textarea({ label, name, hint, subtype, defaultValue, placeholder, maxLength = 3000, minLength = 0, optional = false}) {
    const element = {
      type: 'textarea',
      label,
      name,
      hint,
      subtype,
      placeholder,
      optional,
      max_length: maxLength,
      min_length: minLength,
      value: defaultValue,
    };
    if (this[_validateTextarea](element)) {
      this[_dialog].elements.push(element);
    }
    return this;
  }

  /**
   *  Provide this dialog with a visual header by providing a short string
   *  here.
   *
   *  @param {string} title
   *  @returns {DialogBuilder}
   */
  title(title) {
    return this[_merge]({ title });
  }


  [_merge](source = {}) {
    Object.assign(this[_dialog], source);
    return this;
  }

  [_template]() {
    return Object.assign({}, {
      title: null,
      callback_id: null,
      elements: [],
      submit_label: null,
      notify_on_cancel: false,
    });
  }

  [_validateDialog](dialog) {
    this._log.debug(`Validating dialog...`);
    const template = {
      title: t => _.isString(t) && _.inRange(t.length, 1, 25),
      callback_id: t => _.isString(t) && _.inRange(t.length, 1, 256),
      submit_label: t => _.isNil(t) || (_.isString(t) && _.inRange(t.length, 1, 25)),
      notify_on_cancel: t => _.isBoolean(t),
      elements: a => _.isArray(a) && a.length > 0 && a.length <= 5,
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(dialog);
  }

  [_validateOption](option) {
    this._log.debug(`Validating select option...`);
    const template = {
      label: t => _.isString(t) && _.inRange(t.length, 1, 76),
      value: t => _.isString(t) && _.inRange(t.length, 1, 76),
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(option);
  }

  [_validateOptionGroup](optionGroup) {
    this._log.debug(`Validating select option group...`);
    const template = {
      label: t => _.isString(t) && _.inRange(t.length, 1, 76),
      options: o => _.isArray(o) && !_.isEmpty(o) && o.reduce((valid, opt) => valid && this[_validateOption](opt), true),
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(optionGroup);
  }

  [_validateSelect](select) {
    this._log.debug(`Validating select element...`);
    const template = {
      label: t => _.isString(t) && _.inRange(t.length, 1, 25),
      name: t => _.isString(t) && _.inRange(t.length, 1, 301),
      type: t => t === 'select',
      value: t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      placeholder: t => _.isNil(t) || (_.isString(t) && _.inRange(t.length, 1, 151)),
      optional: t => _.isBoolean(t),
      options: a => _.isArray(a) && a.length <= 100,
      option_groups: a => _.isArray(a),
      data_source: t => _.isString(t) && /^(?:static|users|channels|converstions|external)$/.test(t),
      selected_options: a => _.isArray(a) && a.reduce((isValid, opt) => isValid && this[_validateOption](opt), true),
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(select);
  }

  [_validateText](textElement) {
    this._log.debug(`Validating text element...`);
    const template = {
      label: t => _.isString(t) && _.inRange(t.length, 1, 25),
      name: t => _.isString(t) && _.inRange(t.length, 1, 301),
      type: t => t === 'text',
      max_length: t => _.isInteger(t) && _.inRange(t, 0, 151),
      min_length: t => _.isInteger(t) && _.inRange(t, 0, 151),
      optional: t => _.isBoolean(t),
      hint: t => _.isNil(t) || (_.isString(t) && _.inRange(t.length, 1, 151)),
      subtype: t => _.isNil(t) || _.includes(['email','number','tel','url'], t),
      value: t => _.isNil(t) || (_.isString(t) && _.inRange(t.length, 1, 501)),
      placeholder: t => _.isNil(t) || (_.isString(t) && _.inRange(t.length, 1, 151)),
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(textElement);
  }

  [_validateTextarea](textareaElement) {
    this._log.debug(`Validating textarea element...`);
    const template = {
      label: t => _.isString(t) && _.inRange(t.length, 1, 25),
      name: t => _.isString(t) && _.inRange(t.length, 1, 301),
      type: t => t === 'textarea',
      max_length: t => _.isInteger(t) && _.inRange(t, 0, 3001),
      min_length: t => _.isInteger(t) && _.inRange(t, 0, 3001),
      optional: t => _.isBoolean(t),
      hint: t => _.isNil(t) || (_.isString(t) && _.inRange(t.length, 1, 151)),
      subtype: t => _.isNil(t) || _.includes(['email','number','tel','url'], t),
      value: t => _.isNil(t) || (_.isString(t) && _.inRange(t.length, 1, 3001)),
      placeholder: t => _.isNil(t) || (_.isString(t) && _.inRange(t.length, 1, 151)),
    };
    const validator = new ObjectValidator({ template });
    return validator.exec(textareaElement);
  }
}


module.exports = DialogBuilder;


/**
 *  @typedef {object} slackDialog
 *  @property {string} title        User-facing title of this entire dialog. 24 characters to work
 *                                  with and it's required.
 *  @property {string} callback_id  An identifier strictly for you to recognize submissions of this
 *                                  particular instance of a dialog. Use something meaningful to your
 *                                  app. 255 characters maximum. Absolutely required.
 *  @property {array.<*>} elements  Up to 5 form elements are allowed per dialog. Any combination of
 *                                  {@link slackDialogTextElement}, {@link slackDialogTextareaElement},
 *                                  or {@link slackDialogSelectElement}. Required.
 *  @property {string} [submit_label='Submit'] User-facing string for whichever button-like thing submits the form,
 *                                  depending on form factor. Defaults to `Submit`, localized in whichever
 *                                  language the end user prefers. 24 characters maximum, and may
 *                                  contain only a single word.
 *  @property {boolean} [notify_on_cancel=false] Whether or not slack should notify the bot that the
 *                                  cancel button has been clicked.
 */
/**
 *  Text inputs work well with concise free-form answers and inputs with unestablished bounds, such as
 *  names, email addresses, or ticket titles if your form is used for something like a bug tracker.
 *
 *  @typedef {object} slackDialogTextElement
 *  @property {string}  hint        Helpful text provided to assist users in answering a question.
 *                                  Up to 150 characters.
 *  @property {string}  label       Label displayed to user. Required. 24 character maximum.
 *  @property {number}  max_length  Maximum input length allowed for element. Up to 150 characters.
 *                                  Defaults to 150.
 *  @property {number}  min_length  Minimum input length allowed for element. Up to 150 characters.
 *                                  Defaults to 0.
 *  @property {string}  name        Name of form element. Required. No more than 300 characters.
 *  @property {boolean} optional    Provide `true` when the form element is not required. By default,
 *                                  form elements are required.
 *  @property {string}  placeholder A string displayed as needed to help guide users in completing
 *                                  the element. 150 character maximum.
 *  @property {string}  subtype     A subtype for this text input. Accepts `email`, `number`, `tel`, or `url`.
 *                                  In some form factors, optimized input is provided for this subtype.
 *  @property {string}  type        The type of form element. For a text input, the type is always `text`.
 *                                  Required.
 *  @property {string}  value       A default value for this field. Up to 500 characters.
 *
 *  @see https://api.slack.com/dialogs#text_elements
 */
/**
 *  Text Areas are best when the expected answer is long — over 150 characters or so —. It is best
 *  for open-ended and qualitative questions.
 *
 *  @typedef {object} slackDialogTextareaElement
 *  @property {string}  hint        Helpful text provided to assist users in answering a question.
 *                                  Up to 150 characters.
 *  @property {string}  label       Label displayed to user. Required. No more than 24 characters.
 *  @property {number}  max_length  Maximum input length allowed for element. 0-3000 characters.
 *                                  Defaults to 3000.
 *  @property {number}  min_length  Minimum input length allowed for element. 1-3000 characters.
 *                                  Defaults to 0.
 *  @property {string}  name        Name of form element. Required. No more than 300 characters.
 *  @property {boolean} optional    Provide `true` when the form element is not required. By default,
 *                                  form elements are required.
 *  @property {string}  placeholder A string displayed as needed to help guide users in completing
 *                                  the element. 150 character maximum.
 *  @property {string}  subtype     A subtype for this text area, just in case you need a lot of
 *                                  space for them. `email`, `number`, `tel`, or `url`.
 *  @property {string}  type        For a text area, the type is always `textarea`. It's required.
 *  @property {string}  value       A default value for this field. Up to 3000 characters.
 *
 *  @see https://api.slack.com/dialogs#textarea_elements
 */
/**
 *  Select menus are for multiple choice questions, and great for close-ended quantitative questions,
 *  such as office locations, priority level, meal preference, etc. The select elements may contain
 *  static menus or dynamically loaded menus specified with an optional data_source.
 *
 *  @typedef {object} slackDialogSelectElement
 *  @property {string}  label            Label displayed to user. Required. No more than 24 characters.
 *  @property {string}  name             Name of form element. Required. No more than 300 characters.
 *  @property {string}  type             Set this to `select` for select elements.
 *  @property {string}  data_source      Set this to either `users`, `channels`, `conversations`, or `external`.
 *                                       Default value is `static`.
 *  @property {string}  placeholder      A string displayed as needed to help guide users in completing
 *                                       the element. 150 character maximum.
 *  @property {boolean} optional         Provide `true` when the form element is not required. By default,
 *                                       form elements are required.
 *  @property {string}  value            A default value for static `select`, also, the data source types,
 *                                       `users`, `channels`, and `conversations`. **This option is invalid in
 *                                       `external`, where you must use `selected_options`.**
 *  @property {string}  selected_options A default value for `external` only. (See `value`).
 *  @property {array<slackDialogSelectOption>}   options Provide up to 100 options. Either `options` or
 *                                                       `option_groups` is required for the `static`
 *                                                       and `external`.
 *  @property {array}   option_groups    An array of objects containing a `label` and a list of {@link slackDialogSelectOption}s.
 *                                       Provide up to 100 option groups. Either `options` or `option_groups` is
 *                                       required for the `static` and `external`.
 *
 *  @see https://api.slack.com/dialogs#select_elements
 */
/**
 *  @typedef {object} slackDialogSelectOption
 *  @property {string} label Text visible to the user. 75 characters maximum.
 *  @property {string} value Value uses for server interaction. 75 characters maximum.
 *
 *  @see https://api.slack.com/dialogs#select_elements
 */
/**
 *  @typedef {object} slackDialogSelectOptionGroup
 *  @property {string} label Text visible to the user. 75 characters maximum.
 *  @property {array<slackDialogSelectOption>} options 100 options maximum.
 *
 *  @see https://api.slack.com/dialogs#select_elements
 */
/**
 *  @typedef {object} slackDialogResponse
 *  @property {string} type         To differentiate from other interactive components,
 *                                  look for the string value `dialog_submission`.
 *  @property {object} submission   A hash of key/value pairs representing the user's
 *                                  submission. Each key is a `name` field your app provided
 *                                  when composing the form. Each `value` is the user's submitted
 *                                  value, or in the case of a static select menu, the `value`
 *                                  you assigned to a specific response. The selection from a
 *                                  dynamic menu, the value can be a channel ID, user ID, etc.
 *  @property {string} callback_id  This value is the unique `callback_id` identifier your app
 *                                  gave this instance of the dialog.
 *  @property {object} team         This simple hash contains the `id` and `name` of the workspace
 *                                  from which this interaction occurred.
 *  @property {object} user         This simple hash contains the `id` and `name` of the user who
 *                                  completed the form.
 *  @property {object} channel      This simple hash contains the `id` and `name` of the channel
 *                                  or conversation where this dialog was completed.
 *  @property {string} action_ts    This is a unique identifier for this specific action
 *                                  occurrence generated by Slack. It can be evaluated as a
 *                                  timestamp with milliseconds if that is helpful to you.
 *  @property {string} token        The verification token shared between your app and Slack
 *                                  used to validate an incoming request originates from Slack.
 *  @property {string} response_url The URL can be used to post responses to dialog submissions.
 *
 *  @see https://api.slack.com/dialogs#dialog_submission_sequence
 */


// If your app finds any errors with the submission, respond with an application/json payload
// describing the elements and error messages. The API returns these errors to the user in-app,
// allowing the user to make corrections and submit again.
