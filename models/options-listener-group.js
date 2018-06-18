const ListenerGroup = require('../interfaces/listener-group');
const OptionsListener = require('../interfaces/options-listener');

/**
 *  This is a collection base class meant to do mass processing of other
 *  classes which extend from `OptionsListener`.
 *
 *  @alias OptionsListenerGroup
 *  @memberOf module:slackbot/models
 *  @extends ListenerGroup
 */
class OptionsListenerGroup extends ListenerGroup {
  constructor({ ...superOpts } = {}) {
    super({ itemClass: OptionsListener, ...superOpts });
  }


  /**
   *  Processing is slightly different here as every options request from
   *  slack expects an explicit response containing the requested options.
   *  As each listener returns a set of options, this method will write
   *  them into a response.
   *
   *  @param {object}              options
   *  @param {SlackMessage}        options.message  Data to pass to `match()` and `process()`.
   *  @param {http.ClientResponse} options.response
   *  @param {*}                   *                Any other options to pass to listeners.
   *  @returns {Promise}
   */
  process({ message, response, ...superOpts }) {
    return super.process({ data: message, ...superOpts })
      .then((options) => {
        const bodyJson = { options };
        this._log.debug(`sending response with ${options.length} options`);

        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(bodyJson));
      });
  }
}


module.exports = OptionsListenerGroup;
