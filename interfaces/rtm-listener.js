const Listener = require('./listener');



/**
 *  A listener interface meant to be used with RTM messages.
 *
 *  @interface
 *  @alias RtmListener
 *  @memberOf module:slackbot/interfaces
 *  @extends Listener
 *
 *  @throws {SyntaxError} This class cannot be instantiated directly.
 */
class RtmListener extends Listener {
  static get [Symbol.species]() {
    return RtmListener;
  }


  constructor({ ...superOpts } = {}) {
    super(superOpts);
    if (new.target === RtmListener) {
      throw new SyntaxError('You cannot instantiate an abstract class!');
    }
  }


  /**
   *  This property **MUST** be overridden. Each message text is matched against
   *  this pattern to determine if this is the right listener for the message.
   *  Using this property means that you never need to write a `match()`
   *  method for your `RtmListener` subclasses.
   *  @type {RegExp}
   *  @abstract
   *  @readonly
   *  @throws {Error} Subclass should implement this getter.
   */
  get pattern() {
    throw new Error(`${this._className} must implement a \`pattern\` getter!`);
  }

  /**
   *  Matches a message from a trusty RegExp object provided by {@link RtmListener#pattern}.
   *  You should never need to override this method unless you want some
   *  super-custom matching. If you do end up needing to override this method,
   *  use caution. Remember that the RTM API sends EVERY message to the
   *  bot(s), so there could be some slowdown if the matching logic is heavy.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message
   *  @returns {boolean}
   */
  match({ message }) {
    return this.pattern.test(message.text);
  }
}


module.exports = RtmListener;
