const Listener = require('./listener');


/**
 *  A base class for listeners which will be used for options load URL
 *  requests.
 *
 *  @interface
 *  @alias OptionsListener
 *  @memberOf module:slackbot/interfaces
 *  @extends Listener
 *  @throws {SyntaxError} You cannot instantiate this class directly.
 */
class OptionsListener extends Listener {
  static get [Symbol.species]() {
    return OptionsListener;
  }


  constructor({ ...superOpts } = {}) {
    super(superOpts);
    if (new.target === OptionsListener) {
      throw new SyntaxError('You cannot instantiate an abstract class!');
    }
  }


  /**
   *  This name will be what is specified as the external data source's name
   *  for populating `select` elements.
   *  @type {string}
   *  @abstract
   *  @readonly
   *  @throws {SyntaxError} This getter __must__ be implemented by extending classes.
   */
  get name() {
    throw new SyntaxError(`${this._className} must implement a \`name\` getter!`);
  }

  /**
   *  Matches a message to a name.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message
   *  @returns {boolean}
   */
  match({ message }) {
    return this.name === message.name;
  }
}


module.exports = OptionsListener;
