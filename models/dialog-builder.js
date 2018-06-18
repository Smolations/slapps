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


// If your app finds any errors with the submission, respond with an application/json payload
// describing the elements and error messages. The API returns these errors to the user in-app,
// allowing the user to make corrections and submit again.

module.exports = DialogBuilder;
