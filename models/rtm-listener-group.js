const ListenerGroup = require('../interfaces/listener-group');
const RtmListener = require('../interfaces/rtm-listener');


/**
 *  This is a collection base class meant to do mass processing of other
 *  classes which extend from `RtmListener`.
 *
 *  @alias RtmListenerGroup
 *  @memberOf module:slackbot/models
 *  @extends ListenerGroup
 */
class RtmListenerGroup extends ListenerGroup {
  constructor({ ...superOpts } = {}) {
    super({ itemClass: RtmListener, ...superOpts });
  }


  /**
   *  Process all of the added `RtmListener`s.
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


module.exports = RtmListenerGroup;
