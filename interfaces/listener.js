const yargs = require('yargs');

const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');

const SlackPostRequest = require('../models/slack-post-request');

const _post = Symbol('post');
const _yargs = Symbol('yargs');


/**
 *  The Listener class is the base class that defines an interface
 *  for message processing. At this low-level, every listener has access to
 *  the `Subscriber` that invokes it, as well as an outgoing POST request
 *  instance (e.g. `SlackPostRequest`).
 *
 *  @interface
 *  @alias Listener
 *  @memberOf module:slackbot/interfaces
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Logable
 *
 *  @throws {SyntaxError} You cannot instantiate this class directly.
 */
class Listener extends Logable(Identifyable(Envable())) {
  static get [Symbol.species]() {
    return Listener;
  }


  /**
   *  Provides access to the yargs command parser for options parsing.
   *  @type {external:yargs}
   *  @readonly
   *  @see external:yargs
   */
  get yargs() {
    return this[_yargs];
  }


  constructor({ ...superOpts } = {}) {
    super(superOpts);

    if (new.target === Listener) {
      throw new SyntaxError('You cannot instantiate an abstract class!');
    }

    this[_post] = new SlackPostRequest();
    this[_yargs] = yargs;

    yargs
      .exitProcess(false)
      .showHelpOnFail(false)
      .strict(true)
      .version(false)
  }

  /**
   *  This method is required so that all {@link ListenerGroup} subclasses can use
   *  it when processing incoming messages.
   *
   *  @abstract
   *  @param {object}       options
   *  @param {SlackMessage} options.message The message to process.
   *  @returns {boolean} Whether or not this listener should process the message.
   *
   *  @throws {Error} This method __must__ be implemented by extending classes.
   */
  match(/*{ message }*/) {
    throw new Error(`${this._className} must implement match({ message }) method!`);
  }

  /**
   *  This is the main workhorse method of a listener. It should be called
   *  only after the listener has been matched.
   *
   *  @abstract
   *  @param {object}       options
   *  @param {SlackMessage} options.message The message to process.
   *  @returns {*} To make this method async, return a Promise.
   *
   *  @throws {Error} This method __must__ be implemented by extending classes.
   */
  process(/*{ message }*/) {
    throw new Error(`${this._className} must implement process({ message }) method!`);
  }
}


module.exports = Listener;
