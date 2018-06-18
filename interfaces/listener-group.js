const _ = require('lodash');

const Identifyable = require('../mixins/identifyable');

const Listener = require('./listener');
const Registry = require('../models/registry');

const _getInstance = Symbol('getInstance');
const _getProcOpts = Symbol('getProcOpts');
const _itemClass = Symbol('itemClass');
const _listeners = Symbol('listeners');



/**
 *  This is a collection base class meant to do mass processing of other
 *  classes which extend from `Listener`.
 *
 *  @interface
 *  @alias ListenerGroup
 *  @memberOf module:slackbot/interfaces
 *  @extends Listener
 *
 *  @param {object}      options
 *  @param {Constructor} options.itemClass  A base class used for validation. Items
 *                                          added should extend from this class.
 *
 *  @throws {SyntaxError} You cannot instantiate this class directly.
 *  @throws {TypeError} The `options.itemClass` param must be a class definition.
 *  @throws {TypeError} The `options.itemClass` param must be a subclass of `Listener`.
 */
class ListenerGroup extends Listener {
  static get [Symbol.species]() {
    return ListenerGroup;
  }


  /**
   *  Determine how many listeners are in the collection.
   *  @type {number}
   *  @readonly
   */
  get length() {
    return this[_listeners].length;
  }


  constructor({ itemClass, ...superOpts } = {}) {
    super(superOpts);

    let extendsListener;

    if (new.target === ListenerGroup) {
      throw new SyntaxError('You cannot instantiate an abstract class!');
    }

    this[_itemClass] = itemClass;
    this[_listeners] = [];

    // this might be a bit redundant...
    if (!Identifyable.isClass(itemClass)) {
      // this._log.error(`${this._className} expects the itemClass from which items extend!`);
      throw new TypeError(`${this._className} expects the itemClass from which items extend!`);
    }

    extendsListener = itemClass[Symbol.species] === Listener;
    extendsListener = extendsListener || Listener.isPrototypeOf(itemClass[Symbol.species]);

    if (!extendsListener) {
      throw new TypeError(`The itemClass must extend from Listener or a class that extends from Listener!`);
    }
  }


  /**
   *  Add a listener to the collection.
   *
   *  @param {array<Listener>|Listener} listeners One or more listeners.
   *
   *  @throws {Error} Invalid listener provided.
   */
  add(listeners) {
    const procs = Array.isArray(listeners) ? listeners : [listeners];
    const registry = Registry.for(this);
    let instance;

    procs.forEach((proc) => {
      if (this[_itemClass] === proc || this[_itemClass].isPrototypeOf(proc)) {
        instance = this[_getInstance](proc);
        registry.set(instance);
        this[_listeners].push(instance);
      } else {
        // this._log.error(`${this._className}#add: Invalid listener provided. Must be of type '${this[_itemClass].name}'.`);
        throw new TypeError(`Invalid listener provided. Must be of type '${this[_itemClass].name}'.`);
      }
    });
  }

  /**
   *  Cycle through all of the listeners, looking for matches. Then reduce
   *  the matches into a single promise. This synchronous flow ensures that
   *  listeners don't conflict over a race condition and allows them to
   *  pass successive messages to each other. However, is probably not wise to
   *  have one listener depend on the output of another, specific listener.
   *  ListenerGroup should generally be able to execute no matter what order
   *  they are added to a `ListenerGroup` class.
   *
   *  This method is generalized to use an `options.data` property, but will
   *  pass `options.message` to the four core types of listener interfaces
   *  (i.e. Interaction, Options, Rtm, SlashCommand).
   *
   *  @param {object}  options
   *  @param {*}       options.data             Data to pass to `match()` and `process()`.
   *  @param {boolean} [options.matchAll=false] If `true`, all matched listeners
   *                                            will be processed instead of stopping
   *                                            after the first.
   *  @param {*} *                              Any other options to pass to listeners.
   *  @returns {Promise} Return value of last matched listener's `process()` call
   *                     or `undefined`.
   *
   *  @throws {Error} Must include `options.data`.
   */
  process({ data, matchAll = false, ...customProcessOpts } = {}) {
    if (!data) {
      // this._log.error(`#process requires at least \`options.data\`!`);
      throw new TypeError(`#process requires at least \`options.data\`!`);
    }

    const procsPromises = this[_listeners].map((proc) => {
      this._log.debug(`Attempting to match on ${proc._className}...`);
      const procOpts = this[_getProcOpts](proc, data);
      const matchResult = proc.match({ ...procOpts, ...customProcessOpts });
      if (typeof matchResult === 'boolean') {
        return Promise.resolve(matchResult);
      } else if (Promise.prototype.isPrototypeOf(matchResult)) {
        return matchResult.catch(() => Promise.resolve(false));
      }
    });

    return Promise.all(procsPromises)
      .then(resolves => {
        let matchFound = false;
        return resolves.reduce((promise, val, ndx) => {
          const proc = this[_listeners][ndx];
          let procOpts = { data };
          if (val === true && (!matchFound || matchAll)) {
            this._log.debug(`${proc._className} matched! Processing...`);
            matchFound = true;
            procOpts = this[_getProcOpts](proc, data);
            return promise.then(() => proc.process({ ...procOpts, ...customProcessOpts }));
          }
          return promise;
        }, Promise.resolve())
      })
      .catch(() => true);
  }


  /**
   *  A method to retrieve the arguments to be passed to listeners when
   *  the `process()` method is called. The delineation here is that the
   *  four main types of listeners (`InteractionListener`, `OptionsListener`,
   *  `RtmListener`, `SlashCommandListener`) receive incoming data as
   *  `options.message`, whereas all other listeners receive that data as
   *  `options.data`. These other listeners are assumed to be user-defined
   *  so the data might represent anything, hence the general name.
   *
   *  @param {Listener} proc
   *  @param {*}         data
   *  @returns {object}
   *  @private
   */
  [_getProcOpts](proc, data) {
    const procOpts = {};
    const procSpecies = proc._species;
    const messageListenerGroup = [
      'InteractionListener',
      'OptionsListener',
      'RtmListener',
      'SlashCommandListener',
    ];

    if (procSpecies && messageListenerGroup.includes(procSpecies.name)) {
      procOpts.message = data;
    } else {
      procOpts.data = data;
    }

    return procOpts;
  }


  /**
   *  Return an instance of a class or the return value of a function call.
   *
   *  @param {constructor|function} Thing
   *  @param {object}               [opts={}] Options to be passed as the sole
   *                                          parameter to the constructor/function.
   *  @returns {*} An instance of `new Thing(opts)` or the return value of `Thing(opts)`.
   *  @private
   */
  [_getInstance](Thing, opts = {}) {
    let instance = Thing;
    if (typeof Thing === 'function') {
      // given the test for validity, it may be easier to just always
      // require a class until a function invocation is necessary...
      // if an implementor *really* wanted that functionality, this code
      // can stay in place and `Function` can be passed as the itemClass.
      instance = Identifyable.isClass(Thing) ? new Thing(opts) : Thing(opts);
    }
    return instance;
  }
}


module.exports = ListenerGroup;
