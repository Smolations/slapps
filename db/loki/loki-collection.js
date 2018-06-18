const Identifyable = require('../../mixins/identifyable');
const Logable = require('../../mixins/logable');
const Proxyable = require('../../mixins/proxyable');

const Registry = require('../../models/registry');

const LokiCollections = require('./loki-collections');


/**
 *  Proxies a single Loki Collection object. This effectively models a single
 *  table in the db.
 *
 *  @param {object} options
 *  @param {string} collectionKey A key found in LokiCollections, which is a
 *                                full list of tables with indexes.
 *
 *  @see https://rawgit.com/techfort/LokiJS/master/jsdoc/Collection.html
 */
class LokiCollection extends Proxyable(Logable(Identifyable())) {
  constructor({ collectionKey, ...superOpts }) {
    if (!collectionKey) {
      throw new TypeError('Must provide collectionKey!');
    } else if (!LokiCollections[collectionKey]) {
      throw new SyntaxError(`Loki collection '${collectionKey}' does not exist!`);
    }

    const registry = Registry.context('nectarBot'); // maybe more clever?

    const db = registry.get('db');
    const [collectionName, opts] = LokiCollections[collectionKey];

    const collection = db.getCollection(collectionName) || db.addCollection(collectionName, opts);

    super({ proxy: collection, ...superOpts });
  }
}


module.exports = LokiCollection;
