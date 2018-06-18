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
const _validate = Symbol('validate');


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
    this[_attachment] = this[_template]();
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
  author({ name, link, icon } = {}) {
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
   *  @returns {Array<attachment>}
   */
  build() {
    this[_addAttachment]();
    const attachments = this[_attachments].slice(0);
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
  button({ text, url, style} = {}) {
    const newButton = { type: 'button', text, url, style };
    this[_attachment].actions.push(newButton);
    return this;
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
   *  @param {slackAttachmentField} A `slackAttachmentField` object.
   *  @returns {AttachmentsBuilder}
   */
  field({ title, value, short = false } = {}) {
    this[_attachment].fields.push({ title, value, short });
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
  footer({ text, icon } = {}) {
    if (text) {
      this[_merge]({ footer: text });
    }
    if (icon) {
      this[_merge]({ footer_icon: icon });
    }
    return this;
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
   *  This is optional text that appears above the message attachment block.
   *
   *  @param {string} pretext
   *  @returns {AttachmentsBuilder}
   */
  pretext(pretext) {
    return this[_merge]({ pretext });
  }

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
  title({ title, link } = {}) {
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
   *  Pushes the working `attachment` onto the stack of attachments and then
   *  generates a new working attachment from the template.
   *
   *  @returns {boolean} Whether or not the operation was successful.
   *  @private
   */
  [_addAttachment]() {
    if (this[_validate](this[_attachment])) {
      this[_attachments].push(this[_attachment]);
      this[_attachment] = this[_template]();
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
    Object.assign(this[_attachment], source);
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

// A message attachment may contain 1 to 5 actions, each with their type set
// to button and including a url attribute pointing to the link's destination.

// Unlike message buttons, link buttons don't dispatch actions to your interactive
// components request URL. Use chat.update to update the original message as needed.

module.exports = AttachmentsBuilder;


/**
 *  @typedef {object} attachment
 *  @property {string} fallback
 *  @property {string} color
 *  @property {string} pretext
 *  @property {string} author_name
 *  @property {string} author_link
 *  @property {string} author_icon
 *  @property {string} title
 *  @property {string} title_link
 *  @property {string} text
 *  @property {string} image_url
 *  @property {string} thumb_url
 *  @property {string} footer
 *  @property {string} footer_icon
 *  @property {string|number} ts
 *  @property {array.<slackAttachmentField>} fields
 *  @property {array.<slackAttachmentAction>} actions
 */
/**
 *  The name may be misleading, as this type is only for displaying data.
 *
 *  @typedef {object} slackAttachmentField
 *  @property {string} title          Shown as a bold heading above the value text.
 *                                    It cannot contain markup and will be escaped
 *                                    for you.
 *  @property {string} value          The text value of the field. It may contain
 *                                    standard message markup and must be escaped
 *                                    as normal. May be multi-line.
 *  @property {boolean} [short=false] An optional flag indicating whether
 *                                    the value is short enough to be displayed
 *                                    side-by-side with other values.
 */
/**
 *  All fields are required when using link buttons unless noted.
 *
 *  @typedef {object} slackAttachmentAction
 *  @property {string} type    Provide `button` to tell Slack you want to render a button.
 *  @property {string} text    A UTF-8 string label for this button. Be brief but
 *                             descriptive and actionable.
 *  @property {string} url     The fully qualified `http` or `https` URL to deliver users to.
 *                             Invalid URLs will result in a message posted with the
 *                             button omitted.
 *  @property {string} [style] Setting to `primary` turns the button green and indicates
 *                             the best forward action to take. Providing `danger` turns the
 *                             button red and indicates it some kind of destructive action.
 *                             Use sparingly. Be default, buttons will use the UI's default
 *                             text color.
 */

