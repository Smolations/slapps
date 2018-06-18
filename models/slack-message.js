const _ = require('lodash');

const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Jsonable = require('../mixins/jsonable');
const Logable = require('../mixins/logable');

const Registry = require('../models/registry');
const SlackPostRequest = require('../models/slack-post-request');

const _normalizeChannel = Symbol('normalizeChannel');
const _normalizeTeam = Symbol('normalizeTeam');
const _normalizeUser = Symbol('normalizeUser');
const _slack = Symbol('slack');


/**
 *  This class is meant to wrap the various incoming slack message JSON
 *  objects (via url-formencoded POST requests and responses and/or rtm
 *  messages) and normalizes them so that user, team, and channel data is
 *  always accessible at the same places. Specifically, every message should
 *  end up having the aforementioned three fields which will be objects with
 *  at least an `id` field.
 *
 *  @alias SlackMessage
 *  @memberOf module:slackbot/models
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Jsonable
 *  @mixes Logable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Jsonable
 *  @extends Logable
 *
 *  @param {object} options
 *  @param {Slack}  options.slack        A Slack instance used for various response
 *                                       methods.
 *  @param {object} [options.message={}] A POJO received from a slack hook/reponse.
 */
class SlackMessage extends Jsonable(Identifyable(Logable(Envable()))) {
  constructor({ slack, message = {}, ...superOpts } = {}) {
    super({ json: message, ...superOpts });

    this[_slack] = slack;

    this[_normalizeChannel]();
    this[_normalizeTeam]();
    this[_normalizeUser]();
  }


  /**
   *  Deletes the current message.
   *
   *  @returns {Promise} Return value from {@link Slack#deleteMessage}.
   */
  async delete() {
    const { channel, message_ts } = this._json;
    const ephemeralResponse = {
      replace_original: true,
      delete_original: true,
      text: '',
    };

    return await this[_slack].deleteMessage({ channel: channel.id, ts: message_ts })
      .catch(() => {
        this._log.warn('failed to delete. may be ephemeral so attempting response...');
        return this.respond(ephemeralResponse);
      });
  }

  /**
   *  Opens a direct message to author of this message and then sends a message
   *  to it. Uses {@link Slack#directMessage} under the hood.
   *
   *  @param {object} options
   *  @param {string} options.text The text to send in the DM.
   *  @returns {Promise}
   *
   *  @see Slack#directMessage
   */
  async dm({ text }) {
    const { user } = this._json;
    return await this[_slack].directMessage({ text, user: user.id });
  }

  openDialog() {}

  /**
   *  Convenience method to respond to messages using the `response_url`
   *  provided by all interactive messages. By default, the original message
   *  is replaced with an ephemeral message.
   *
   *  @param {object}  options
   *  @param {string}  options.text               Text of the message to send. This field is usually
   *                                              required, unless you're providing only `attachments` instead.
   *  @param {array}   [options.attachments=[]]   A JSON-based array of structured attachments, presented
   *                                              as a URL-encoded string.
   *  @param {string}  [options.thread_ts]        When replying to a parent message, this value is the `ts`
   *                                              value of the parent message to the thread.
   *  @param {string}  [options.response_type]    This field cannot be specified for a brand new message and
   *                                              must be used only in response to the execution of message
   *                                              button action or a slash command response. Defaults to `'ephemeral`
   *                                              when responding to slash commands.
   *  @param {boolean} [options.replace_original] Used __only__ when creating messages in response to a button
   *                                              action invocation.
   *  @param {boolean} [options.delete_original]  Used __only__ when creating messages in response to a button
   *                                              action invocation.
   *  @returns {Promise} Return value from the {@link SlackPostRequest}.
   */
  async respond({ text, attachments = [], thread_ts, response_type, replace_original, delete_original }) {
    const message = { text, attachments, response_type, replace_original, delete_original, thread_ts };
    const post = new SlackPostRequest();
    const url = this._json.response_url;
    let data;

    if (url) {
      this._log.json(`sending response to ${url}`, message);
      data = await post.sendJSON({ url, json: message });
      this._log.debug(data.body);
      return data;
    } else {
      this._log.error(`Message does not contain response_url field!`);
    }
  }

  /**
   *  This method posts an ephemeral message, which is visible only to the
   *  assigned user in a specific public channel, private channel, or private
   *  conversation. It uses {@link Slack#postEphemeral} under the hood.
   *
   *  @param {object}  options
   *  @param {string}  options.text               Text of the message to send. This field is usually
   *                                              required, unless you're providing only `attachments` instead.
   *  @param {boolean} [options.as_user=true]     Pass true to post the message as the authed user, instead
   *                                              of as a bot.
   *  @param {array}   [options.attachments=[]]   A JSON-based array of structured attachments, presented
   *                                              as a URL-encoded string.
   *  @param {boolean} [options.link_names=false] Find and link channel names and usernames.
   *  @param {string}  [options.parse='none']     Change how messages are treated. Can be `'none'` or `'full'`.
   *  @returns {Promise}
   *
   *  @see Slack#postEphemeral
   *  @see https://api.slack.com/methods/chat.postEphemeral
   */
  async whisper({ text, as_user = true, attachments = [], link_names = false, parse = 'none' }) {
    const { user, channel } = this._json;
    const opts = { user: user.id, channel: channel.id, text, as_user, attachments, link_names, parse };
    return await this[_slack].postEphemeral(opts);
  }


  /**
   *  Ensures the message always has a `channel` object containing at least an
   *  `id` field as well as a `name` field if available.
   *
   *  @private
   */
  [_normalizeChannel]() {
    const channel = {};
    let json = this._json;
    if (!json.channel) {
      if (json.channel_id) {
        channel.id = json.channel_id;
        delete json.channel_id;
      }
      if (json.channel_name) {
        channel.name = json.channel_name;
        delete json.channel_name;
      }
    } else if (_.isString(json.channel)) {
      channel.id = json.channel;
    }
    if (channel.id) {
      json.channel = channel;
    }
  }

  /**
   *  Ensures the message always has a `team` object containing at least an
   *  `id` field as well as a `domain` field if available.
   *
   *  @private
   */
  [_normalizeTeam]() {
    const team = {};
    let json = this._json;
    if (!json.team) {
      if (json.team_id) {
        team.id = json.team_id;
        delete json.team_id;
      }
      if (json.team_domain) {
        team.domain = json.team_domain;
        delete json.team_domain;
      }
    } else if (_.isString(json.team)) {
      team.id = json.team;
    }
    if (team.id) {
      json.team = team;
    }
  }

  /**
   *  Ensures the message always has a `user` object containing at least an
   *  `id` field as well as a `name` field if available.
   *
   *  @private
   */
  [_normalizeUser]() {
    const user = {};
    let json = this._json;
    if (!json.user) {
      if (json.user_id) {
        user.id = json.user_id;
        delete json.user_id;
      }
      if (json.user_name) {
        user.name = json.user_name;
        delete json.user_name;
      } else if (json.username) {
        user.name = json.username;
        delete json.username;
      }
    } else if (_.isString(json.user)) {
      user.id = json.user;
    }
    if (user.id) {
      json.user = user;
    }
  }
}


module.exports = SlackMessage;
