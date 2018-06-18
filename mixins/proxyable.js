const _ = require('lodash');

const _proxied = Symbol('proxied');


/**
 *  Using this mixin allows for an instance to "mix in" an arbitrary object
 *  reference. When accessing properties on an instance, the proxied object will
 *  be checked for those properties once it is determined that they do not
 *  exist on the instance itself. You can manually override any proxied method
 *  to suit your needs.
 *
 *  @mixin
 *  @name module:slackbot/mixins~Proxyable
 *  @param {*} SuperClass=class{} The class to mix onto.
 *  @returns {Proxyable} The mixed class.
 *
 *  @see Proxyable
 *
 *  @example
 *  const obj = {
 *    bar: true,
 *    baz() { console.log('baz called'); },
 *  };
 *
 *  class Foo extends Proxyable() {
 *    constructor() {
 *      super({ proxy: obj });
 *    }
 *  }
 *
 *  const foo = new Foo();
 *
 *  // getting
 *  foo._proxied; // returns reference to `obj`
 *  foo.bar === true; // true
 *  foo.baz(); // logs 'baz called'
 *  foo.what; // undefined
 *
 *  // setting
 *  foo.bar = 7;
 *  Refect.has(foo, 'bar'); // false
 *  foo.bar === 7; // true
 *  foo._proxied.bar === 7; // true
 *
 *  foo.baz = null; // logs error because obj.baz is a function
 *
 *  foo.foo = 'foo prop';
 *  Refect.has(foo, 'foo'); // true
 *  foo.foo === 'foo prop'; // true
 *  foo._proxied.foo; // undefined
 */
const Proxyable = (SuperClass = class {}) =>

/**
 *  Using this mixin allows for an instance to "mix in" any number of object
 *  references. When accessing properties on an instance, proxied objects will
 *  be checked for those properties once it is determined that they do not
 *  exist on the instance itself. You can manually override any proxied method
 *  to suit your needs. For public access, the proxied object is accessible
 *  via the name that is provided, prefixed by an underscore.
 *
 *  @class
 *  @alias Proxyable
 *  @param {object} options
 *  @param {*}      options.proxy The object/instance to which to proxy.
 *
 *  @see module:slackbot/mixins~Proxyable
 */
class extends SuperClass {
  /**
   *  Direct access to proxied object.
   *  @type {*}
   *  @readonly
   */
  get _proxied() {
    return this[_proxied];
  }


  constructor({ proxy, ...superOpts } = {}) {
    // console.log(`proxy keys: ${Object.keys(proxy).join(', ')}`)
    super(superOpts);

    if (!proxy) {
      throw new TypeError('Proxyable must have something to proxy!');
    }

    this[_proxied] = proxy;

    const proxyHandler = {
      get(target, propName) {
        console.log(`Proxyable#get:  ${target.constructor.name}.${propName.toString()}`)
        const targetHasProp = Reflect.has(target, propName);
        if (!targetHasProp) {
          if (Reflect.has(proxy, propName)) {
            console.log('Proxyable#get:  getting value from proxied');
            if (_.isFunction(proxy[propName])) {
              return proxy[propName].bind(proxy);
            }
            return proxy[propName];
          }
        }
        console.log('Proxyable#get:  getting value from instance');
        return target[propName];
      },

      set(target, propName, value) {
        const targetHasProp = Reflect.has(target, propName);
        // console.log(`Proxyable#set:  propName(${propName})  value(${value})`)
        if (!targetHasProp) {
          const proxyObjectHasMethod = _.isFunction(proxy[propName]);
          if (proxyObjectHasMethod) {
            // console.error(`Proxyable#set:  Cannot assign value to '${propName}'. It is a method on the proxied object!`);
            throw new Error(`Cannot assign value to '${propName}'. It is a method on the proxied object!`);
          } else {
            // console.log(`Proxyable#set:  ${proxyKey}.${propName} = ${value}`);
            proxy[propName] = value;
          }
        } else {
          // console.log(`Proxyable#set:  target.${propName} = ${value}`);
          target[propName] = value;
        }
        return true;
      },

      ownKeys(target) {
        console.log('calling ownKeys');
        const targetKeys = Object.keys(target); console.log('targetKeys: ', targetKeys);
        const jsonKeys = Object.keys(target._json); console.log('jsonKeys: ', jsonKeys);
        console.log('ownKeys returning: ', targetKeys.concat(jsonKeys));
        return targetKeys.concat(jsonKeys);
      },

      has(target, propName) {
        console.log(`trap .has(${target}, ${propName})`);
        return !!target[propName];
      }

      // apply(target, thisArg, argumentsList) {
      //   console.log('proxying apply call...');
      // } // necessary?
      // construct() {} // useful?
    }

    return new Proxy(this, proxyHandler);
  }
};


module.exports = Proxyable;
