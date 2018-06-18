const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');

/**
 *  A class to allow for arbitrary attachment of a database for use in the
 *  nectarbot ecosystem.
 *
 *  @interface
 *  @alias DbAdapter
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
class DbAdapter extends Logable(Identifyable(Envable())) {
  static get [Symbol.species]() {
    return DbAdapter;
  }


  constructor({ ...superOpts } = {}) {
    super(superOpts);
    if (new.target === DbAdapter) {
      throw new SyntaxError('You cannot instantiate an abstract class!');
    }
  }


  /**
   *  Implementing this method ensures that an instance will be provided from
   *  the adapter.
   *  @abstract
   *  @returns {*} A database instance.
   */
  getInstance() {
    throw new Error('Your DbAdapter must implement the \`getInstance\` method!');
  }

  /**
   *  Implement any shutdown logic for your database instance here (optional).
   *  @abstract
   */
  disconnect() {}
}


module.exports = DbAdapter;
