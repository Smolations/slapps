const Listener = require('./listener');


/**
 *  A listener interface meant to be used when processing slash commands.
 *
 *  @interface
 *  @alias SlashCommandListener
 *  @memberOf module:slackbot/interfaces
 *  @extends Listener
 *  @throws {SyntaxError} You cannot instantiate this class directly.
 */
class SlashCommandListener extends Listener {
  static get [Symbol.species]() {
    return SlashCommandListener;
  }

  /**
   *  Convenient place to add some help text for the command. This property
   *  will allow implementors a straightforward way to help users with command
   *  syntax. Use it, don't use it, it's whatever.  =]
   *  @type {string}
   *  @abstract
   *  @readonly
   */
  get help() {}

  /**
   *  This pattern will be used to match incoming messages from slash commands.
   *  @type {RegExp}
   *  @abstract
   *  @readonly
   *  @throws {Error} This getter __must__ be implemented by extending classes.
   */
  get pattern() {
    throw new Error(`${this._className} must implement pattern() getter!`);
  }


  constructor({ ...superOpts } = {}) {
    super(superOpts);
    if (new.target === SlashCommandListener) {
      throw new SyntaxError('You cannot instantiate an abstract class!');
    }
  }


  /**
   *  Matches a message based.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message
   *  @returns {boolean}
   */
  match({ message }) {
    return this.pattern.test(message.text);
  }
}


module.exports = SlashCommandListener;
