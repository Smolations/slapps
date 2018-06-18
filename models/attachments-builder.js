const _ = require('lodash');

const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');

const ObjectValidator = require('./object-validator');

const ActionConfirmation = require('./attachments/action-confirmation');
const Attachment = require('./attachments/attachment');
const Field = require('./attachments/field');
const InteractiveButtonAction = require('./attachments/interactive-button-action');
const LinkButtonAction = require('./attachments/link-button-action');
const SelectAction = require('./attachments/select-action');
const SelectActionOption = require('./attachments/select-action-option');
const SelectActionOptionGroup = require('./attachments/select-action-option-group');

const _addAttachment = Symbol('addAttachment');
const _attachments = Symbol('attachments');
const _attachment = Symbol('attachment');
const _merge = Symbol('merge');
const _template = Symbol('template');
const _validate = Symbol('validate');
const _validateAndAddOptions = Symbol('validateAndAddOptions');
const _validateAndAddOptionGroups = Symbol('validateAndAddOptionGroups');


/**
 *  Build attachments for fancy messages. To make things simpler, an instance
 *  of this class manages the attachment object and the collection of attachments.
 *  All methods are chainable to make the creation of the message intuitive
 *  and concise. Use only the methods you need!
 *
 *  @memberOf module:slackbot/models
 *  @alias AttachmentsBuilder
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Logable
 *
 *  @example
 *  const attachments = new AttachmentsBuilder();
 *
 *  attachments
 *    .fallback('You will see this message on your phone...')
 *    .title({ title: 'The Great Escape', link: 'http://greatescape.com' })
 *    .text('Some text here I am not creative enough to stub in...')
 *    .field({ title: 'Publication Date', value: '13/01/1983', short: true })
 *    .field({ title: 'Author', value: '(redacted) :smirk:', short: true })
 *
 *  subscriber.postMessage({ channel, attachments: attachments.build() });
 */
class AttachmentsBuilder extends Identifyable(Logable(Envable())) {
  constructor({ ...superOpts } = {}) {
    super(superOpts);
    this[_attachments] = [];
    this[_attachment] = new Attachment();
  }


  /**
   *  The author parameters will display a small section at the top of a message
   *  attachment that can contain the three documented fields.
   *
   *  @param {object} options
   *  @param {string} options.name Small text used to display the author's name.
   *  @param {string} options.link A valid URL that will hyperlink the author name
   *                               text. Will only work if author name is present.
   *  @param {string} options.icon A valid URL that displays a small 16x16px image
   *                               to the left of the author name text. Will only
   *                               work if author name is present.
   *  @returns {AttachmentsBuilder}
   */
  author({ name, link, icon }) {
    return this[_merge]({ author_name: name, author_link: link, author_icon: icon });
  }

  /**
   *  Adds in-progress attachment to attachments collection and creates a new
   *  one, ready for building.
   *
   *  @returns {AttachmentsBuilder}
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
   *  @returns {array.<attachment>}
   */
  build() {
    let allValid = true;
    let attachments;

    this[_addAttachment]();

    allValid = this[_attachments].reduce((isValid, att) => isValid && att.isValid, true);

    if (!allValid) {
      throw new SyntaxError('One or more attachments invalid!');
    }

    attachments = this[_attachments].slice(0);
    this[_attachments] = [];

    return attachments;
  }

  /**
   *  Adds a link button to the bottom of an attachment.
   *
   *  @param {object} options
   *  @param {string} options.text
   *  @param {string} options.url
   *  @param {string} options.style One of `primary` or `danger`.
   *  @returns {AttachmentsBuilder}
   */
  buttonInteraction({ name, text, value, style }) {
    const newButton = new InteractiveButtonAction({ name, text, value, style });
    // const newButton = { type: 'button', text, url, style };
    this[_attachment].actions.push(newButton);
    return this;
  }

  /**
   *  Adds a link button to the bottom of an attachment.
   *
   *  @param {object} options
   *  @param {string} options.text
   *  @param {string} options.url
   *  @param {string} options.style One of `primary` or `danger`.
   *  @returns {AttachmentsBuilder}
   */
  buttonLink({ text, url, style }) {
    const newButton = new LinkButtonAction({ text, url, style});
    // const newButton = { type: 'button', text, url, style };
    this[_attachment].actions.push(newButton);
    return this;
  }

  callbackId(callbackId) {
    return this[_merge]({ callback_id: callbackId });
  }

  /**
   *  Like traffic signals, color-coding messages can quickly communicate intent
   *  and help separate them from the flow of other messages in the timeline.
   *
   *  An optional value that can either be one of `good`, `warning`, `danger`, or any
   *  hex color code (eg. `#439FE0`). This value is used to color the border along
   *  the left side of the message attachment.
   *
   *  @param {string} color
   *  @returns {AttachmentsBuilder}
   */
  color(color) {
    return this[_merge]({ color });
  }

  /**
   *  A plain-text summary of the attachment. This text will be used in clients
   *  that don't show formatted text (eg. IRC, mobile notifications) and should
   *  not contain any markup. Message must contain either `fallback` or `text`.
   *
   *  @param {string} fallback
   *  @returns {AttachmentsBuilder}
   */
  fallback(fallback) {
    return this[_merge]({ fallback });
  }

  /**
   *  Hashes contained within fields will be displayed in a table inside the
   *  message attachment.
   *
   *  @param {attachmentField} A `attachmentField` object.
   *  @returns {AttachmentsBuilder}
   */
  field({ title, value, short = false } = {}) {
    const field = new Field({ title, value, short });
    this[_attachment].fields.push(field);
    return this;
  }

  /**
   *  Add some brief text to help contextualize and identify an attachment. Limited
   *  to 300 characters, and may be truncated further when displayed to users in
   *  environments with limited screen real estate.
   *
   *  To render a small icon beside your footer text, provide a publicly accessible
   *  URL string in the footer_icon field. You must also provide a footer for the
   *  field to be recognized. We'll render what you provide at 16px by 16px. It's best
   *  to use an image that is similarly sized.
   *
   *  @param {object} options
   *  @param {string} options.icon
   *  @param {string} options.text
   *  @returns {AttachmentsBuilder}
   */
  footer({ text, icon }) {
    return this[_merge]({ footer: text, footer_icon: icon });
  }

  /**
   *  A valid URL to an image file that will be displayed inside a message attachment.
   *  Slack currently supports the following formats: GIF, JPEG, PNG, and BMP.
   *
   *  Large images will be resized to a maximum width of 360px or a maximum
   *  height of 500px, while still maintaining the original aspect ratio.
   *
   *  The thumbnail's longest dimension will be scaled down to 75px while maintaining
   *  the aspect ratio of the image. The filesize of the image must also be less
   *  than 500 KB. For best results, use a 75x75 image.
   *
   *  @param {object} options
   *  @param {string} options.url
   *  @param {string} options.thumb
   *  @returns {AttachmentsBuilder}
   */
  image({ url, thumb }) {
    return this[_merge]({ image_url: url, thumb_url: thumb });
  }

  /**
   *  Adds provided options (or option groups) to an existing select action with
   *  the name `selectName` or to the most recently added select action if `selectName`
   *  is not provided.
   *
   *  @param {array.<attachmentActionSelectOption>|array.<SelectActionOption>|array.<attachmentActionSelectOptionGroup>|array.<SelectActionOptionGroup>} options=[]
   *  @param {string} [selectName=null] If there are existing `select` elements, the
   *                                    options will be added to it if `selectName` matches
   *                                    the name given when it was created.
   *  @returns {AttachmentsBuilder}
   *
   *  @throws {Error} If there are no select actions in the working attachment.
   *  @throws {SyntaxError} If `options` array is empty.
   *  @throws {SyntaxError} If `selectName` is given but no matching select action is found.
   */
  options(options = [], selectName = null) {
    const selects = this[_attachment].actions.filter(action => action.type === 'select');
    const [firstOpt] = options;
    let allValid;
    let lastSelect;
    let targetSelect;
    console.log(this[_attachment].actions)

    if (!selects.length) {
      throw new Error('No select elements found in working attachment!');
    } else if (!firstOpt) {
      throw new SyntaxError('No options provided!');
    } else {
      if (_.isString(selectName)) {
        targetSelect = selects.find(select => select.name === selectName);
        if (!targetSelect) {
          throw new SyntaxError(`Unable to find select with name "${selectName}" to which options should be added!`);
        }
      } else {
        targetSelect = selects.slice(-1).pop();
      }

      // check for options_groups
      if (Array.isArray(firstOpt.options)) {
        this[_validateAndAddOptionGroups](options, targetSelect);
      } else {
        this[_validateAndAddOptions](options, targetSelect);
      }
    }
    return this;
  }

  /**
   *  This is optional text that appears above the message attachment block.
   *
   *  @param {string} pretext
   *  @returns {AttachmentsBuilder}
   */
  pretext(pretext) {
    return this[_merge]({ pretext });
  }

  /**
   *  Adds a select element to the interaction. Add options to the element by
   *  chaining {@see AttachmentsBuilder#options} calls.
   *
   *  @param {object} options
   *  @param {string} options.name                  See {@link attachmentActionSelect}.
   *  @param {string} options.text                  See {@link attachmentActionSelect}.
   *  @param {string} [options.dataSource='static'] See {@link attachmentActionSelect}.
   *  @param {number} [options.minQueryLength=1]    See {@link attachmentActionSelect}.
   *  @returns {AttachmentsBuilder}
   */
  select({ name, text, dataSource = 'static', minQueryLength = 1 } = {}) {
    const selectOpts = {
      name,
      text,
      dataSource,
      minQueryLength,
    };
    const select = new SelectAction(selectOpts);
    this[_attachment].actions.push(select);
    return this;
  }

  // how to handle?
  selectedOption() {}

  /**
   *  This is the main text in a message attachment, and can contain standard
   *  message markup. The content will automatically collapse if it contains
   *  700+ characters or 5+ linebreaks, and will display a "Show more..." link
   *  to expand the content. Links posted in the `text` field will not unfurl.
   *  Must include this value or `fallback`.
   *
   *  @param {string} text
   *  @returns {AttachmentsBuilder}
   */
  text(text) {
    return this[_merge]({ text });
  }

  /**
   *  The title is displayed as larger, bold text near the top of a message
   *  attachment. By passing a valid URL in the `link` parameter (optional),
   *  the title text will be hyperlinked.
   *
   *  @param {object} options
   *  @param {string} options.title
   *  @param {string} options.link
   *  @returns {AttachmentsBuilder}
   */
  title({ title, link }) {
    return this[_merge]({ title, title_link: link });
  }

  /**
   *  By providing the `ts` field with an integer value in "epoch time", the attachment
   *  will display an additional timestamp value as part of the attachment's footer.
   *
   *  Use `ts` when referencing articles or happenings. Your message will have its
   *  own timestamp when published.
   *
   *  @param {string|number} timeStamp
   *  @returns {AttachmentsBuilder}
   */
  ts(timeStamp) {
    return this[_merge]({ ts: timeStamp });
  }


  /**
   *  @private
   */
  [_validateAndAddOptions](options, select) {
    const wrappedOpts = options.map(opt => _.isPlainObject(opt) ? new SelectActionOption(opt) : opt);
    const allValid = wrappedOpts.reduce((isValid, opt) => {
      const isClassInstance = opt instanceof SelectActionOption;
      console.log(`isClassInstance = ${isClassInstance}`);
      console.log(`opt.isValid = ${opt.isValid}`);
      return isValid && isClassInstance && opt.isValid;
    }, true);
    if (allValid) {
      select.options.push(...wrappedOpts);
    } else {
      throw new Error(`One or more options invalid!`);
    }
  }

  /**
   *  @private
   */
  [_validateAndAddOptionGroups](optionGroups, select) {
    const wrappedOpts = optionGroups.map(grp => _.isPlainObject(grp) ? new SelectActionOptionGroup(grp) : grp);
    const allValid = optionGroups.reduce((isValid, group) => {
      const isClassInstance = group instanceof SelectActionOptionGroup;
      return isValid && isClassInstance && group.isValid;
    }, true);
    if (allValid) {
      select.option_groups.push(...wrappedOpts);
    } else {
      throw new Error(`One or more option groups invalid!`);
    }
  }

  /**
   *  Pushes the working `attachment` onto the stack of attachments and then
   *  generates a new working attachment from the template.
   *
   *  @returns {boolean} Whether or not the operation was successful.
   *  @private
   */
  [_addAttachment]() {
    this[_attachments].push(this[_attachment]);
    this[_attachment] = new Attachment();
    return;
    // if (this[_validate](this[_attachment])) {
    if (this[_attachment].isValid) {
      this[_attachments].push(this[_attachment]);
      // this[_attachment] = this[_template]();
      this[_attachment] = new Attachment();
      return true;
    } else {
      this._log.error(`Attachment JSON does not conform!`);
      return false;
    }
  }

  /**
   *  A DRY method to update the working `attachment`.
   *
   *  @param {object} source={} The source object to merge into the working `attachment`.
   *  @returns {AttachmentsBuilder}
   *  @private
   */
  [_merge](source = {}) {
    this[_attachment].merge(source);
    return this;
  }

  /**
   *  Generate a default `attachment` template.
   *
   *  @returns {attachment}
   *  @private
   */
  [_template]() {
    return Object.assign({}, {
      fallback: null,
      color: null,
      pretext: null,
      author_name: null,
      author_link: null,
      author_icon: null,
      title: null,
      title_link: null,
      text: null,
      fields: [],
      image_url: null,
      thumb_url: null,
      footer: null,
      footer_icon: null,
      ts: null,
      actions: [],
    });
  }

  /**
   *  A validator for a single attachment.
   *
   *  @param {attachment} attachment The `attachment` to validate.
   *  @returns {boolean} Whether or not the `attachment` is valid.
   *  @private
   */
  [_validate](attachment) {
    this._log.debug('Validating attachment...');
    const template = {
      fallback: t =>    _.isNil(t) || _.isString(t),
      color: t =>       _.isNil(t) || /^(good|warning|danger|#[a-fA-F0-9]{6})$/.test(t),
      pretext: t =>     _.isNil(t) || _.isString(t),
      author_name: t => _.isNil(t) || _.isString(t),
      author_link: t => _.isNil(t) || _.isString(t),
      author_icon: t => _.isNil(t) || _.isString(t),
      title: t =>       _.isNil(t) || _.isString(t),
      title_link: t =>  _.isNil(t) || _.isString(t),
      text: t =>        _.isNil(t) || _.isString(t),
      image_url: t =>   _.isNil(t) || _.isString(t),
      thumb_url: t =>   _.isNil(t) || _.isString(t),
      footer: t =>      _.isNil(t) || _.isString(t),
      footer_icon: t => _.isNil(t) || _.isString(t),
      ts: t =>          _.isNil(t) || _.isNumber(t) || (_.isString(t) && /^\d+$/.test(t)),
      fields: a =>      _.isArray(a),
      actions: a =>     _.isArray(a) && a.length <= 5,
    };
    const validator = new ObjectValidator({ template });
    const reqsMet = attachment.text || attachment.fallback;
    if (!reqsMet) {
      this._log.error(`reqsMet = ${reqsMet} | attachment.text = '${attachment.text}' | attachment.fallback = '${attachment.fallback}'`, attachment);
    }
    return reqsMet && validator.exec(attachment);
  }
}


module.exports = AttachmentsBuilder;
