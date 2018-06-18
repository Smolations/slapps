const ListenerGroup = require('../interfaces/listener-group');
const InteractionListener = require('../interfaces/interaction-listener');

/**
 *  This is a collection base class meant to do mass processing of other
 *  classes which extend from `InteractionListener`.
 *
 *  @alias InteractionListenerGroup
 *  @memberOf module:slackbot/models
 *  @extends ListenerGroup
 */
class InteractionListenerGroup extends ListenerGroup {
  constructor({ ...superOpts } = {}) {
    super({ itemClass: InteractionListener, ...superOpts });
  }


  /**
   *  Process all of the added `InteractionListener`s.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message  Data to pass to `match()` and `process()`.
   *  @param {*}            *                Any other options to pass to processors.
   *  @returns {Promise}
   */
  process({ message, ...superOpts }) {
    return super.process({ data: message, ...superOpts });
  }
}


module.exports = InteractionListenerGroup;
