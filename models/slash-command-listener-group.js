const ListenerGroup = require('../interfaces/listener-group');
const SlashCommandListener = require('../interfaces/slash-command-listener');


/**
 *  This is a collection base class meant to do mass processing of other
 *  classes which extend from `SlashCommandListener`.
 *
 *  @alias SlashCommandListenerGroup
 *  @memberOf module:slackbot/models
 *  @extends ListenerGroup
 */
class SlashCommandListenerGroup extends ListenerGroup {
  constructor({ ...superOpts } = {}) {
    super({ itemClass: SlashCommandListener, ...superOpts });
  }


  /**
   *  Process all of the added `SlashCommandListener`s.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message  Data to pass to `match()` and `process()`.
   *  @param {*}            *                Any other options to pass to listeners.
   *  @returns {Promise}
   */
  process({ message, ...superOpts }) {
    return super.process({ data: message, ...superOpts });
  }
}


module.exports = SlashCommandListenerGroup;
