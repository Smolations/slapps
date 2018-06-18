const _ = require('lodash');

const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');

const _conformsTo = Symbol('conformsTo');
const _template = Symbol('template');


/**
 *  A validator class that utilizes lodash's `_.conformTo` method. As such,
 *  given `template`s should conform to those signatures. Logging is conveniently
 *  added to allow for easy identification of valid/invalid properties.
 *
 *  @memberOf module:slackbot/models
 *  @alias ObjectValidator
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Logable
 *
 *  @param {object} options
 *  @param {object} options.template All property keys should have corresponding
 *                                   values that are functions which return booleans.
 *
 *  @example
 *  const goodObj = { foo: 'hi there' };
 *  const anotherGoodObj = { foo: 'hello', bar: false };
 *
 *  const badObj = { foo: ['hi there'] };
 *  const anotherBadObj = { bar: 'hi there' };
 *
 *  const template = {
 *    foo: s => _.isString(s) && !_.isEmpty(s),
 *  };
 *  const validator = new ObjectValidator({ template });
 *
 *  validator.exec(goodObj); // true
 *  validator.exec(anotherGoodObj); // true
 *  validator.exec(badObj); // false
 *  validator.exec(anotherBadObj); // false
 */
class ObjectValidator extends Identifyable(Logable(Envable())) {
  constructor({ template, ...superOpts }) {
    super(superOpts);

    this[_template] = template;
  }


  /**
   *  Runs the validation against a given `obj`.
   *
   *  @param {object} obj
   *  @returns {boolean}
   */
  exec(obj = {}) {
    return this[_conformsTo](obj, this[_template]);
  }


  /**
   *  Using lodash's conforms methods has some caveats. If the conforms object
   *  includes a key that is not on the incoming test object, then the incoming
   *  object does not conform. If we dynamically remove missing keys from the
   *  conforms object so it only contains those found on the incoming test
   *  object, then we cannot validate when a property is required. So this
   *  approach assumes that the conforms object contains all possible properties,
   *  specifying conditions that allow for empty/missing property values where
   *  applicable. It will then add any missing properties to the incoming
   *  test object with a value of `undefined`. It will do this with a clone
   *  so as to keep the original test object intact.
   *
   *  @param {object} obj      The object to be validated.
   *  @param {object} template The object to be validated against.
   *  @returns {boolean}
   *
   *  @private
   */
  [_conformsTo](obj, template) {
    const objClone = _.clone(obj);
    const objKeys = Object.keys(obj);
    const templateKeys = Object.keys(template);
    const missingObjKeys = _.difference(templateKeys, objKeys);
    const loggedTemplate = {};

    // this._log.json('keys:', { objKeys, templateKeys, missingObjKeys });
    missingObjKeys.forEach(key => objClone[key] = null);
    // this._log.json('objClone:', objClone);

    templateKeys.forEach((templateKey) => {
      // this._log.debug(`adding logging to templateKey: ${templateKey}`);
      loggedTemplate[templateKey] = _.wrap(template[templateKey], (originalValidator, v) => {
        const isValid = originalValidator(v);
        const validatorSignature = originalValidator.toString();
        let valueString = v;
        if (_.isString(v)) {
          valueString = `"${v}"`;
        } else if (Array.isArray(v) || _.isObject(v)) {
          valueString = `\n${JSON.stringify(v, null, 2)}`;
        }
        this._log.debug(`${templateKey}:  ${valueString}`);
        if (!isValid) {
          this._log.error(`  Value is invalid!`);
          this._log.error(`  Signature: ${validatorSignature}`);
        }
        return isValid;
      });
    });

    // this._log.debug(`loggedTemplate keys: ${Object.keys(loggedTemplate).join(', ')}`)

    return _.conformsTo(objClone, loggedTemplate);
  }
}


module.exports = ObjectValidator;
