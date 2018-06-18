const _ = require('lodash');
const Action = require('./action');
const Field = require('./field');
const Identifyable = require('../../mixins/identifyable');
const JsonValidateable = require('../../mixins/json-validateable');
const Logable = require('../../mixins/logable');


/**
 *  @extends Identifyable
 *  @extends JsonValidateable
 *  @extends Logable
 *  @mixes Identifyable
 *  @mixes JsonValidateable
 *  @mixes Logable
 */
class Attachment extends JsonValidateable(Logable(Identifyable())) {
  get validationTemplate() {
    const isInteractive = Boolean(this._json.actions.find(a => a.isInteractive));
    const template = {
      attachment_type: t => t === 'default',
      fallback:        t => _.isString(t) && !_.isEmpty(t),
      callback_id:     t => isInteractive ? (_.isString(t) && !_.isEmpty(t)) : _.isNil(t),
      color:           t => _.isNil(t) || (_.isString(t) && /^(?:good|warning|danger|#[a-f0-9]{6})$/i.test(t)),
      pretext:         t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      author_name:     t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      author_link:     t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      author_icon:     t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      title:           t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      title_link:      t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      text:            t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      image_url:       t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      thumb_url:       t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      footer:          t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      footer_icon:     t => _.isNil(t) || (_.isString(t) && !_.isEmpty(t)),
      ts:              t => _.isNil(t) || _.isNumber(t) || (_.isString(t) && /^\d+$/.test(t)),
      fields:          a => Array.isArray(a) && a.reduce((isValid, f) => isValid && f instanceof Field && f.isValid, true),
      actions:         a => Array.isArray(a) && (5 - a.length) >= 0 && a.reduce((isValid, atn) => isValid && atn instanceof Action && atn.isValid, true),
    };
    return Object.assign({}, template);
  }


  constructor({
    fallback = null,
    callbackId = null,
    color = null,
    pretext = null,
    authorName = null,
    authorLink = null,
    authorIcon = null,
    title = null,
    titleLink = null,
    text = null,
    imageUrl = null,
    thumbUrl = null,
    footer = null,
    footerIcon = null,
    ts = null,
    actions = [],
    fields = [],
  } = {}) {
    const json = {
      fallback,
      callback_id: callbackId,
      color,
      pretext,
      author_name: authorName,
      author_link: authorLink,
      author_icon: authorIcon,
      title,
      title_link: titleLink,
      text,
      image_url: imageUrl,
      thumb_url: thumbUrl,
      footer,
      footer_icon: footerIcon,
      ts,
      attachment_type: 'default',
      actions,
      fields,
    };
    super({ json });
    // console.log(this._json);
  }
}


module.exports = Attachment;
