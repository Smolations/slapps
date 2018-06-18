const { RTMClient, WebClient } = require('@slack/client'); // https://github.com/slackhq/node-slack-sdk

const Configable = require('../mixins/configable');
const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');

const _broadcastChannels = Symbol('broadcastChannels');
const _collectBroadcastChannels = Symbol('collectBroadcastChannels');
const _rtmClient = Symbol('rtmClient');
const _webClient = Symbol('webClient');


/**
 *  This class acts as a base class for subscribers to the slack bot. the bot
 *  will pass the defined params for each subscriber, so this class provides
 *  a common set of functionality for all subscribers. It is optional to
 *  extend from this class for new subscribers, but those subscribers will
 *  have to implement their own methods for sending/receiving messages
 *  from slack and/or webhooks from the `httpRequest` web server eventable.
 *
 *  - For rtm client api see {@link http://slackapi.github.io/node-slack-sdk/reference/RTMClient}
 *  - For web client api see {@link https://api.slack.com/methods}
 *  - For message formatting details @see {@link https://api.slack.com/docs/message-formatting}
 *
 *  @alias Slack
 *  @memberof module:slackbot/models
 *  @mixes Configable
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @extends Configable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Logable
 */
class Slack extends Configable(Logable(Identifyable(Envable()))) {
  /**
   *  The RTMClient instance.
   *  @type {slackapi}
   *  @readonly
   */
  get rtmClient() {
    return this[_rtmClient];
  }

  /**
   *  The WebClient instance.
   *  @type {slackapi}
   *  @readonly
   */
  get webClient() {
    return this[_webClient];
  }


  constructor({ ...superOpts } = {}) {
    super(superOpts);

    this[_broadcastChannels] = [];

    this[_rtmClient] = new RTMClient(this._config.token);
    this[_webClient] = new WebClient(this._config.token);
  }

  /**
   *  Get an array of all public channels (not DMs) of which the bot is a member.
   *  Options are the same as {@link Slack#getConversations} but `types` is ignored.
   *
   *  @param {object} options
   *  @returns {Promise} Resolves with an array of conversation (channel-like) objects.
   */
  async allPublicBotChannels({ ...options } = {}) {
    const channels = await this.getPublicChannels({ ...options });
    return channels.filter(channel => channel.is_member);
  }

  /**
   *  Get an array of all private channels (not DMs) of which the bot is a member.
   *  Options are the same as {@link Slack#getConversations} but `types` is ignored.
   *
   *  @param {object} options
   *  @returns {Promise} Resolves with an array of conversation (channel-like) objects.
   */
  async allPrivateBotChannels({ ...options } = {}) {
    const channels = await this.getPrivateChannels({ ...options });
    return channels.filter(channel => channel.is_member);
  }

  /**
   *  This will send a public (non-ephemeral) message to all broadcast channels
   *  that are registered in the config. If no broadcast channels are specified
   *  in the config or the specified channels could not be found, a promise
   *  rejection will be returned. When specifying broadcast channels in your
   *  config, the array may contain any combination of channel names or IDs.
   *
   *  @param {object} options Same options for {@link Slack#postMessage}, but
   *                          `channel` may be omitted.
   *  @returns {Promise}
   *
   *  @see Slack#postMessage
   */
  async broadcast({ ...options } = {}) {
    const channels = this[_broadcastChannels];
    let promise;
    let rejectMessage;

    if (!Array.isArray(this._config.broadcastChannels)) {
      rejectMessage = 'You have not specified any broadcast channels in your config!';
    } else if (channels.length === 0) {
      rejectMessage = 'Unable to find any channels matching broadcast channels in your config!';
    }

    if (rejectMessage) {
      this._log.error(rejectMessage);
      promise = await Promise.reject(rejectMessage);
    } else {
      this._log.debug(`#broadcast() sending to ${channels.length} channel(s)`);
      promise = await Promise.all(channels.map((channel) => {
        return this.postMessage({ ...options, channel: channel.id });
      }));
    }

    return promise;
  }

  /**
   *  This method deletes a message from a channel.
   *
   *  When used with a typical user token, may only delete messages posted
   *  by that user.
   *
   *  When used with an admin user's user token, may delete most messages
   *  posted in a workspace.
   *
   *  When used with a bot user's token, may delete only messages posted
   *  by that bot user.
   *
   *  @param {object} options
   *  @param {object} options.channel        Channel containing the message to be deleted.
   *  @param {object} options.ts             Timestamp of the message to be deleted.
   *  @param {object} [options.as_user=true] Pass `true` to delete the message as the
   *                                         authed user with `chat:write:user` scope.
   *  @returns {Promise}
   *
   *  @see https://api.slack.com/methods/chat.delete
   */
  async deleteMessage({ channel, ts, as_user = true }) {
    this._log.debug(`#deleteMessage('${channel}', '${ts}', ${as_user})`);
    const resp = await this[_webClient].chat.delete({ channel, ts, as_user })
      .catch((data) => {
        this._log.error(`Deleting message failed:  ${data.error}`);
        return Promise.reject(data.error);
      });
    return resp;
  }

  /**
   *  Opens a direct message channel and then sends a message to it.
   *
   *  @param {object} options
   *  @param {string} options.text The text to send in the DM.
   *  @param {string} options.user The user id of the target user.
   *  @returns {Promise}
   */
  async directMessage({ text, user }) {
    this._log.debug(`#directMessage("${text}", "${user}")`);
    const { channel } = await this.openDirectMessage(user);
    return await this[_webClient].chat.postMessage({ text, channel: channel.id });
  }

  /**
   *  Get an array of all conversations in the workspace.
   *
   *  @param {object}  options
   *  @param {object}  [options.cursor]                Paginate through collections of data by setting
   *                                                   the `cursor` parameter to a `next_cursor` attribute
   *                                                   returned by a previous request's `response_metadata`.
   *  @param {boolean} [options.exclude_archived=true] Exclude archived channels from the list.
   *  @param {number}  [options.limit=1000]            The maximum number of items to return. Fewer than the
   *                                                   requested number of items may be returned, even if
   *                                                   the end of the users list hasn't been reached. Max 1000.
   *  @param {string}  [types='public_channel,private_channel,mpim,im'] Self-explanatory (hopefully).
   *  @returns {Promise} Resolves with an array of conversation (channel-like) objects.
   */
  async getConversations({ cursor, exclude_archived = true, limit = 1000, types = 'public_channel,private_channel,mpim,im' } = {}) {
    const { channels } = await this[_webClient].conversations.list({ cursor, exclude_archived, limit, types });
    return channels;
  }

  /**
   *  Get an array of all public channels in the workspace. Options are the
   *  same for {@link Slack#getConversations} except that `types` is preset
   *  to `'public_channel'`.
   *
   *  @param {object}  options
   *  @returns {Promise} Resolves with an array of conversation (channel-like) objects.
   */
  async getPublicChannels({ ...options } = {}) {
    return await this.getConversations({ ...options, types: 'public_channel' });
  }

  /**
   *  Get an array of all private channels in a workspace. Options are the
   *  same for {@link Slack#getConversations} except that `types` is preset
   *  to `'private_channel'`.
   *
   *  @param {object} options
   *  @returns {Promise} Resolves with an array of conversation (channel-like) objects.
   */
  async getPrivateChannels({ ...options } = {}) {
    return await this.getConversations({ ...options, types: 'private_channel' });
  }

  /**
   *  Get info about a user given the user's slack `id`.
   *
   *  @param {object}        options
   *  @param {string|number} options.id
   *  @param {boolean}       [options.include_locale=false] Whether or not the user's
   *                                    locale data should be included in the response.
   *  @returns {Promise} Resolves with the user object.
   *
   *  @see https://api.slack.com/methods/users.info#response
   */
  async getUser({ id, include_locale = false }) {
    this._log.debug(`#getUser({ id: ${id} })`);
    const { user } = await this[_webClient].users.info({ user: id, include_locale });
    return user;
  }

  /**
   *  Get info about all users for a slack team.
   *
   *  @param {object}  options
   *  @param {string}  options.cursor
   *  @param {boolean} [options.include_locale=false] Whether or not the user's
   *                                     locale data should be included in the response.
   *  @param {number}  [options.limit=0] Number of records to return. A value of 0
   *                                     means all members are fetched.
   *  @returns {Promise} Resolves with the response object so that pagination can be used.
   *                     The object has 4 fields: `ok`, `members`, `cache_ts`, and `response_metadata`.
   *                     Work with pagination by utilizing `response_metadata.next_cursor`.
   *
   *  @see https://api.slack.com/methods/users.info#response
   */
  async getUsers({ cursor, include_locale = false, limit = 0 } = {}) {
    this._log.debug(`#getUsers({ cursor: '${cursor}', include_locale: ${include_locale}, limit: ${limit} })`);
    return await this[_webClient].users.list({ cursor, include_locale, limit });
  }

  /**
   *  Open a dialog with a user by exchanging a `trigger_id` received from
   *  another interaction.
   *
   *  @param {object} options
   *  @param {string} options.trigger_id
   *  @param {object} options.dialog
   *  @returns {Promise} Resolves with a {@link slackDialogResponse}.
   */
  async openDialog({ trigger_id, dialog }) {
    this._log.debug(`#openDialog("${trigger_id}")`);
    return await this[_webClient].dialog.open({ trigger_id, dialog });
  }

  /**
   *  Opens a direct message with a user. Basically you're just looking for
   *  a channel name here...
   *
   *  @param {object} options
   *  @param {string} options.user                    The user [id] with which to open a direct message.
   *  @param {boolean} [options.include_locale=false] Whether or not locale info is included.
   *  @param {boolean} [options.return_im=false]      Whether the original IM should be included.
   *  @returns {Promise} Resolves with the channel name.
   *
   *  @see https://api.slack.com/methods/im.open
   */
  async openDirectMessage({ user, include_locale = false, return_im = false }) {
    this._log.debug(`#openDirectMessage("${user}")`);
    return await this[_webClient].im.open({ user, include_locale, return_im });
  }

  /**
   *  This method posts a message to a public channel, private channel, or
   *  direct message/IM channel.
   *
   *  @param {object}  options
   *  @param {string}  options.text                    Text of the message to send. This field is usually
   *                                                   required, unless you're providing only `attachments` instead.
   *  @param {string}  options.channel                 Channel, private group, or IM channel to send message to.
   *  @param {boolean} [options.as_user=true]          Pass true to post the message as the authed user, instead
   *                                                   of as a bot.
   *  @param {array}   [options.atachments=[]]         A JSON-based array of structured attachments, presented
   *                                                   as a URL-encoded string.
   *  @param {string}  [options.icon_emoji=null]       Emoji to use as the icon for this message. Overrides `icon_url`.
   *                                                   Must be used in conjunction with `as_user` set to `false`,
   *                                                   otherwise ignored.
   *  @param {string}  [options.icon_url=null]         URL to an image to use as the icon for this message. Must be
   *                                                   used in conjunction with `as_user` set to `false`, otherwise ignored.
   *  @param {boolean} [options.link_names=true]       Find and link channel names and usernames.
   *  @param {boolean} [options.mrkdwn=true]           Disable Slack markup parsing by setting to `false`.
   *  @param {string}  [options.parse='none']          Change how messages are treated. Can be `'none'` or `'full'`.
   *  @param {boolean} [options.reply_broadcast=false] Used in conjunction with `thread_ts` and indicates whether reply
   *                                                   should be made visible to everyone in the channel or conversation.
   *  @param {number}  [options.thread_ts=null]        Provide another message's `ts` value to make this message a reply.
   *                                                   Avoid using a reply's `ts` value; use its parent instead.
   *  @param {boolean} [options.unfurl_links=false]    Pass `true` to enable unfurling of primarily text-based content.
   *  @param {boolean} [options.unfurl_media=true]     Pass `false` to disable unfurling of media content.
   *  @param {string}  [options.username=null]         Set your bot's user name. Must be used in conjunction with `as_user`
   *                                                   set to `false`, otherwise ignored.
   *  @returns {Promise}
   *
   *  @see https://api.slack.com/methods/chat.postMessage
   *  @see https://api.slack.com/methods/chat.postMessage#authorship
   *  @see https://api.slack.com/docs/message-formatting
   */
  async postMessage({
    text,
    channel,
    as_user = true,
    attachments = [],
    icon_emoji = null,
    icon_url = null,
    link_names = true,
    mrkdwn = true,
    parse = 'none',
    reply_broadcast = false,
    thread_ts = null,
    unfurl_links = false,
    unfurl_media = true,
    username = null,
  }) {
    this._log.debug(`#postMessage("${text}", "${channel}")`);
    return await this[_webClient].chat.postMessage({
      text,
      channel,
      as_user,
      attachments,
      icon_emoji,
      icon_url,
      link_names,
      mrkdwn,
      parse,
      reply_broadcast,
      thread_ts,
      unfurl_links,
      unfurl_media,
      username,
    });
  }

  /**
   *  This method posts an ephemeral message, which is visible only to the
   *  assigned user in a specific public channel, private channel, or private
   *  conversation.
   *
   *  Ephemeral message delivery is not guaranteed — the user must be currently
   *  active in Slack and a member of the specified `channel`. By nature,
   *  ephemeral messages do not persist across reloads, desktop and mobile apps,
   *  or sessions.
   *
   *  Use ephemeral messages to send users context-sensitive messages, relevant
   *  to the channel they're detectably participating in. Avoid sending
   *  unexpected or unsolicited ephemeral messages.
   *
   *  @param {object}  options
   *  @param {string}  options.text               Text of the message to send. This field is usually
   *                                              required, unless you're providing only `attachments` instead.
   *  @param {string}  options.user               The `id` of the user who will receive the ephemeral message.
   *                                              The user should be in the channel specified by the `channel` argument.
   *  @param {string}  options.channel            Channel, private group, or IM channel to send message to.
   *  @param {boolean} [options.as_user=true]     Pass true to post the message as the authed user, instead
   *                                              of as a bot.
   *  @param {array}   [options.attachments=[]]   A JSON-based array of structured attachments, presented
   *                                              as a URL-encoded string.
   *  @param {boolean} [options.link_names=false] Find and link channel names and usernames.
   *  @param {string}  [options.parse='none']     Change how messages are treated. Can be `'none'` or `'full'`.
   *  @returns {Promise}
   *
   *  @see https://api.slack.com/methods/chat.postEphemeral
   */
  async postEphemeral({ text, user, channel, as_user = true, attachments = [], link_names = false, parse = 'none' }) {
    this._log.debug(`#postEphemeral("${text}", "${user}", "${channel}", ${as_user})`);
    return await this[_webClient].chat.postEphemeral({ text, user, channel, as_user, attachments, link_names, parse });
  }

  /**
   *  Use this when little to no formatting is needed (emojis work though,
   *  and code blocks...). Actually, just links (e.g. `<url|title>`, etc.)
   *  don't work. AKA "simple messaging". You should probably just stick
   *  to `postMessage()`.
   *
   *  @param {object} options
   *  @param {string} options.text    The body of the message.
   *  @param {string} options.channel The channel to which the message should be sent.
   *
   *  @see https://api.slack.com/docs/message-formatting
   *  @see http://slackapi.github.io/node-slack-sdk/reference/RTMClient
   */
  sendMessage({ text, channel }) {
    this._log.debug(`#sendMessage("${text}", "${channel}")`);
    return this[_rtmClient].sendMessage(text, channel);
  }

  /**
   *  Start the bot, which includes starting the RTMClient and gathering some
   *  initial data.
   *
   *  @returns {Promise}
   */
  async start() {
    this[_rtmClient].start();
    return await this[_collectBroadcastChannels]();
  }

  /**
   *  This method updates a message in a channel. Though related to chat.postMessage,
   *  some parameters of chat.update are handled differently.
   *
   *  Ephemeral messages created by chat.postEphemeral or otherwise cannot
   *  be updated with this method.
   *
   *  @param {object}  options
   *  @param {string}  options.text                Text of the message to send. This field is usually
   *                                               required, unless you're providing only `attachments` instead.
   *  @param {string}  options.channel             Channel, private group, or IM channel to send message to.
   *  @param {number}  options.ts                  Timestamp of the message to be updated.
   *  @param {boolean} [options.as_user=true]      Pass `true` to post the message as the authed user, instead
   *                                               of as a bot.
   *  @param {array}   [options.attachments=[]]    A JSON-based array of structured attachments, presented
   *                                               as a URL-encoded string.
   *  @param {*}       [options.link_names='none'] Can apparently be `'none'`, `1`, or `true`.
   *  @param {string}  [options.parse='client']    Can be `'none'`, `'client'`, or `'full'`.
   *  @returns {Promise}
   */
  async updateMessage({ text, channel, ts, as_user = true, attachments = [], link_names = 'none', parse = 'client' }) {
    this._log.debug(`#updateMessage("${text}", "${channel}", "${ts}", ${as_user}, ${attachments}, '${link_names}', '${parse}')`);
    return await this[_webClient].chat.update({ text, channel, ts, as_user, attachments, link_names, parse });
  }

  /**
   *  Uploads a file to slack and shares it with the provided `channels`. Channels
   *  can be public or private (such as a DM).
   *
   *  @param {object} options
   *  @param {string} options.channels          The channels (comma-separated) in which to share the file.
   *  @param {string} options.content           The contents of the file.
   *  @param {string} options.filename          File name can be used to determine syntax.
   *  @param {string} [options.file]            If uploading as multipart/form-data use this and not `content`.
   *  @param {string} [options.filetype]        File type is useful for auto-highlighting syntax.
   *  @param {string} [options.initial_comment] Initial comment to add to file.
   *  @param {string} [options.title='JenkinsBot sends his regards...'] The title of the share.
   *  @returns {Promise}
   *
   *  @see https://api.slack.com/methods/files.upload
   */
  async uploadFile({ channels, content, file, filename, filetype, title = 'JenkinsBot sends his regards...' }) {
    this._log.debug(`#uploadFile("${channels}", "content...", "file...", "${filename}", "${filetype}", "${title}")`);
    return await this[_webClient].files.upload({ channels, content, file, filename, filetype, title });
  }


  /**
   *  Brings in the broadcast channels from the config and checks that they
   *  exist in the current workspace. The channels that exist will be used
   *  when the {Slack#broadcast} method is called.
   *  @private
   */
  async [_collectBroadcastChannels]() {
    const broadcastChannels = this._config.broadcastChannels;
    const shouldFetch = Array.isArray(broadcastChannels) && broadcastChannels.length;
    let broadcastChannelsRatio = '0/0';
    let totalChannelsRatio = '?';

    if (shouldFetch) {
      this._log.debug('broadcastChannels: %o', broadcastChannels);
      const privateChannels = await this.getPrivateChannels();
      const publicChannels = await this.getPublicChannels();
      const channels = privateChannels.concat(publicChannels);

      totalChannelsRatio = `${publicChannels.length} public and ${privateChannels.length} private`;

      channels.forEach((channel) => {
        this._log.debug('is broadcastChannel? %s', channel.name);
        if (broadcastChannels.includes(channel.id) || broadcastChannels.includes(channel.name)) {
          this[_broadcastChannels].push(channel);
        }
      });

      broadcastChannelsRatio = `${this[_broadcastChannels].length}/${broadcastChannels.length}`;
    }

    this._log.debug(`registered ${broadcastChannelsRatio} broadcast channels of ${totalChannelsRatio} total bot channels`);
  }
}


module.exports = Slack;
