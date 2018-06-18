const PurgeableModule = require('../helpers/purgeable-module');
const moment = require('moment'); // https://github.com/moment/moment
const fs = require('fs');
const os = require('os');


describe('mixins: Logable', () => {
  beforeAll(() => {
    this.purgeableLogable = new PurgeableModule('Logable', 'mixins/logable');
  });

  beforeEach(() => {
    const Logable = this.purgeableLogable.require();

    // default config comes from ./config/test.json unless overridden
    this.Loged = (class extends Logable() {});
  });

  afterEach(() => {
    this.purgeableLogable.purge();
  });

  it('can be created', () => {
    expect(new this.Loged()).toEqual(jasmine.any(Object));
  });

  describe('#constructor', () => {
    it('has a ._log', () => {
      const loged = new this.Loged();
      expect(loged._log).not.toBeUndefined();
      expect(loged._log._className).toEqual('Log');
    });
  });
});
