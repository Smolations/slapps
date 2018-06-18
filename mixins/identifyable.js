/**
 *  Using this mixin applies identity information to the class so that other
 *  consumers can identify it more easily.
 *
 *  @mixin
 *  @name module:slackbot/mixins~Identifyable
 *  @param {*} SuperClass=class{} The class to mix onto.
 *  @returns {Identifyable} The mixed class.
 */
const Identifyable = (SuperClass = class {}) =>

/**
 *  Using this mixin applies identity information to the class so that other
 *  consumers can identify it more easily.
 *
 *  @class
 *  @alias Identifyable
 *
 *  @see module:slackbot/mixins~Identifyable
 */
class extends SuperClass {
  /**
   *  To support the _species getter and built-ins like `instanceof`.
   *  @private
   */
  static get [Symbol.species]() {
    return this.constructor;
  }

  /**
   *  Returns the current class name for the instance.
   *  @type {string}
   *  @readonly
   */
  get _className() {
    return this.constructor.name;
  }

  /**
   *  Returns the species for the instance. The species of of an instance
   *  generally returns it's own class/prototype. However, when dealing with
   *  inheritance chains, it is often beneficial to manually specify the
   *  species for subclass validation purposes.
   *
   *  @type {Constructor|object|undefined}
   *  @readonly
   *
   *  @see http://exploringjs.com/es6/ch_classes.html#sec_species-pattern
   */
  get _species() {
    return this.constructor[Symbol.species];
  }
};


/**
 *  Try to get the name of a thing. Try the `._className`, the constructor
 *  name, and a `.name` property.
 *
 *  @function
 *  @name module:slackbot/mixins~Identifyable.getName
 *  @param {*} any
 *  @returns {string|undefined}
 */
Identifyable.getName = (any) => {
  const className = any._className;
  const constructorName = (any.constructor && any.constructor.name);
  // const nameProperty = any.name; // preventing name properties on processors
                                    // from using registry...
  return className || constructorName/* || nameProperty*/;
}

/**
 *  Determine if a thing is a class definition. Does not currently recognize
 *  class expressions.
 *
 *  @function
 *  @name module:slackbot/mixins~Identifyable.isClass
 *  @param {*} any
 *  @returns {boolean}
 */
Identifyable.isClass = (any) => {
  const classPattern = /^class\s/;
  let isClass = false;
  if (typeof any === 'function') {
    isClass = classPattern.test(Function.prototype.toString.call(any));
  }
  return isClass;
}


module.exports = Identifyable;
