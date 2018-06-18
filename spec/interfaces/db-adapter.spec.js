const DbAdapter = require('../../interfaces/db-adapter');


describe('interfaces: DbAdapter', () => {
  beforeEach(() => {
    const db = {};
    class BadAdapter extends DbAdapter {}
    class GoodAdapter extends DbAdapter {
      getInstance() { return db; }
    }

    this.db = db;
    this.BadAdapter = BadAdapter;
    this.GoodAdapter = GoodAdapter;
  });

  describe('#constructor', () => {
    it('throws when instantiated directly', () => {
      expect(() => new DbAdapter()).toThrow();
    });
  });

  describe('creating subclasses', () => {
    it('can be created', () => {
      const instance = new this.GoodAdapter();
      expect(instance).toEqual(jasmine.any(Object));
    });

    describe('desired mixins are mixed', () => {
      it('is Envable', () => {
        const instance = new this.GoodAdapter();
        expect(instance._env).toEqual(process.env.NODE_ENV || 'development');
      });

      it('is Identifyable', () => {
        const instance = new this.GoodAdapter();
        expect(instance._className).toEqual('GoodAdapter');
        expect(instance instanceof DbAdapter).toEqual(true);
      });

      it('is Logable', () => {
        const instance = new this.GoodAdapter();
        expect(instance._log).not.toBeUndefined();
      });
    });

    describe('when acting as interface', () => {
      it('throws for unimplemented #getInstance()', () => {
        const instance = new this.BadAdapter();
        expect(instance.getInstance).toThrow();
      });

      it('provides instance for implemented #getInstance()', () => {
        const instance = new this.GoodAdapter();
        expect(instance.getInstance()).toEqual(this.db);
      });
    });
  });
});
