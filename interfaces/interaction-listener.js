const Listener = require('./listener');


/**
 *  This listener type is intended to be used when working with interactive
 *  messages. This includes buttons, message menus, and dialogs. All messages
 *  submitted for processing should have a `response_url` attached.
 *
 *  @interface
 *  @alias InteractionListener
 *  @memberOf module:slackbot/interfaces
 *  @extends Listener
 *  @throws {SyntaxError} You cannot instantiate this class directly.
 */
class InteractionListener extends Listener {
  static get [Symbol.species]() {
    return InteractionListener;
  }


  constructor({ ...superOpts } = {}) {
    super(superOpts);

    if (new.target === InteractionListener) {
      throw new SyntaxError('You cannot instantiate an abstract class!');
    }
  }


  /**
   *  Since interactions must start with an initial message that defines
   *  interaction callbacks, a common method is needed on these listeners
   *  so that other models can access them and start desired interactions.
   *
   *  @abstract
   *  @param {*} args Any number/kinds of args an individual listener needs
   *                  to start the interaction.
   *  @throws {Error} This method __must__ be implemented by extending classes.
   */
  initiate() {
    // this._log.error(`${this._className} must implement initiate() method!`);
    throw new Error(`${this._className} must implement initiate() method!`);
  }

  /**
   *  Interaction listeners contain methods which correspond to `callback_id`s
   *  that are set for each outgoing interaction. When this `match()` method
   *  is called, it checks to see if the `callback_id` in the provided
   *  message exists as a method on the class. If it does, the listener
   *  processes the message. Given this paradigm, you should be sure to make
   *  all interaction listener method names unique within a subscriber.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message
   *  @returns {boolean}
   */
  match({ message }) {
    const { callback_id } = message;
    return !this.hasOwnProperty(callback_id) && !!this[callback_id];
  }

  /**
   *  Processes a message by inspecting the `callback_id` and matching it
   *  to a method defined on an instance of this listener.
   *
   *  @param {object} options
   *  @param {SlackMessage} options.message
   *  @returns {Promise|undefined} Value returned from invoked listener method.
   */
  process({ message }) {
    const { callback_id } = message;
    this._log.json(`#process`, { callback_id });

    return this[callback_id]({ message });
  }
}


module.exports = InteractionListener;
