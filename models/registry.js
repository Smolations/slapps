const _ = require('lodash');

const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');
const Proxyable = require('../mixins/proxyable');

const _contextName = Symbol('contextName');
const _globals = Symbol('globals');
const _registry = Symbol('registry');

const registry = new Map();


/**
 *  The Registry Pattern
 *  (a.k.a. {@link https://en.wikipedia.org/wiki/Service_locator_pattern| the Service Locator pattern})
 *  is crucial for the `slack-bot` infrastructure because processors need to
 *  share each other and have access to useful entities like a database layer
 *  for persistence and the `Slack` instance for communicating with the Slack
 *  API.
 *
 *  There is also a strong need for keeping "services" mutually exclusive. Each `SlackBot`
 *  needs access to a persistence layer, but it could be dangerous to allow one
 *  bot to access the database of another. Furthermore, since the storing of the
 *  database in the registry is done within `SlackBot` internals, it is convenient
 *  to access each by calling `.get('db')` no matter what suscribers/processors
 *  are accessing the registry.
 *
 *  **NOTE:** You should never need to instantiate a Registry. Static and instance
 *  methods provide everything you need to work with a registry tree.
 *
 *  @alias Registry
 *  @memberOf module:slackbot/models
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @mixes Proxyable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Logable
 *  @extends Proxyable
 *
 *  @param {*} context Any key that will be the key for this new registry.
 *
 *  @throws {TypeError} If the class is instantiated without a context name.
 *                      Only instantiated internally, so devs won't need to
 *                      worry about this.
 *
 *  @see {@tutorial the-registry}
 *
 *  @example
  const Registry = require('./models/registry');
  const rootContext = 'stringId';
  const registry = Registry.context(rootContext);
  const greeting = 'sup homie';
  const someObject = {};

  class SomeClass {
    hi() {
      return greeting;
    }
  }

  // now we have a clean registry, so let's put some stuff in it
  registry.set('someObject', someObject); // specify a name so it isn't called 'object'
  registry.set(new SomeClass()); // referenced by class name

  registry.size === 2; // true
  registry.get('someObject') === someObject; // true
  registry.get('SomeClass').hi() === greeting; // true

  // other, nested classes/objects can get access to all these newly added
  // items by simply referencing the root context
  Registry.context('stringId').get('someObject') === someObject; // true
 */
class Registry extends Proxyable(Logable(Identifyable(Envable()))) {
  constructor(contextName) {
    super({ proxy: new Map() });

    if (!contextName) {
      throw new TypeError(`new Registry() requires contextName parameter!`);
    }

    this[_contextName] = contextName;
  }


  /**
   *  Checks singleton registry for context and returns registry for it;
   *  otherwise, creates new Registry (identified by the context). This
   *  method must called at least once to get/set items from/in the registry.
   *
   *  @param {string} name How this root context will be identified for access.
   *  @returns {Registry}
   */
  static context(name) {
    let theRegistry;

    if (!name) {
      throw new TypeError(`Given name (${name}) is invalid!`);
    }

    if (registry.has(name)) {
      this._log.debug(`.context() found registry entry for %s...`, name);
      theRegistry = registry.get(name);
    } else {
      this._log.debug(`.context() did not find registry entry for %s. creating...`, name);
      theRegistry = new Registry(name);
      registry.set(name, theRegistry);
    }

    return theRegistry;
  }

  /**
   *  Retrieve the registry in which the current instance is contained. The
   *  reference was attached to the entity when it was added to the registry.
   *
   *  @param {*} any
   *  @returns {Registry}
   */
  static for(any) {
    if (!any) {
      throw new TypeError('Given value is invalid!');
    } else if (!any[_contextName]) {
      throw new TypeError('No context name exists for given value!');
    } else if (!registry.has(any[_contextName])) {
      throw new SyntaxError(`Associated context name (${any[_contextName]}) does not exist in registry!`);
    }

    return registry.get(any[_contextName]);
  }

  /**
   *  Specify a global that will always have exactly one reference and will
   *  be statically available on `Registry`.
   *
   *  @param {string} name    A name that should be used to get the `value` at
   *                          a later time. This can also be a class instance, in
   *                          which case the class name should be used to get
   *                          the value.
   *  @param {*}      [value] If this isn't an instance of a class/built-in, you should
   *                          specify a `name`.
   *  @returns {*} The given `value`.
   *
   *  @example
   const Registry = require('./models/registry');
   const globalObj = {};
   class GlobalClass {}
   const globalClassInstance = new GlobalClass();

   Registry.global(globalObj, 'Global');
   Registry.global(globalClassInstance);

   Registry.Global === globalObj; // true
   Registry.globalClass === globalClassInstance; // true
   */
  static global(name, value) {
    const reg = Registry.context('Globals');
    let globalName;

    if (!value) {
      if (_.isString(name)) { // then must be getting
        return reg.get(name);
      } else { // must be setting using inferred name
        globalName = Identifyable.getName(name);
        if (!globalName) {
          throw new TypeError('Unable to determine global name from given value!');
        }
        return Registry.global(globalName, name);
      }
    }

    reg.set(name, value);
    this._log.debug(`.global() Adding global: '%s'...`, name);
    return value;
  }

  /**
   *  Returns a hierarchy of the registry, ready to print to console.
   *
   *  @returns {string}
   */
  static toString() {
    let line = '';
    for (const [key, value] of registry) {
      line += `${key}:\n`;
      for (const [regKey, regValue] of value) {
        line += `  ${regKey}\n`;
      }
    }
    return line;
  }


  /**
   *  This gives instances access to getting/setting globals so that the
   *  `Registry` class doesn't have to be imported when an instance of it
   *  is already available. It shares the same signature.
   *
   *  @param {string} name    A name that should be used to get the `value` at
   *                          a later time. This can also be a class instance, in
   *                          which case the class name should be used to get
   *                          the value.
   *  @param {*}      [value] If this isn't an instance of a class/built-in, you should
   *                          specify a `name`.
   *  @returns {*} The given `value`.
   */
  global(name, value) {
    return Registry.global(name, value);
  }


  /**
   *  Get the associated value for the given `key`.
   *
   *  @method
   *  @name Registry#get
   *  @param {string} key
   *  @returns {*} Associated registry value.
   */

  /**
   *  Determine if the associated value for the given `key` exists.
   *
   *  @method
   *  @name Registry#has
   *  @param {string} key
   *  @returns {boolean}
   */

  /**
   *  Set a `value` in the registry for a given `key`. If not given, the name
   *  of the `key` will be determined via `Identifyable.getName()`.
   *
   *  @param {string|*} key     A custom name or any identifiable object.
   *  @param {*}        [value] If not given, this will be `key`.
   *  @returns {Registry} The current registry instance so chaining can occur.
   */
  set(key, value) {
    let name = key;
    let val = value;
    if (!_.isString(key)) {
      name = Identifyable.getName(key);
    }
    if (!val) {
      val = key;
    }
    val[_contextName] = this[_contextName];
    this._log.debug(`#set() creating registry entry:  %s[%s]`, this[_contextName], name);
    this._proxied.set(name, val);
    return this;
  }
}


module.exports = Registry;
