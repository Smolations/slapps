const PurgeableModule = require('../helpers/purgeable-module');


describe('slackbot/models:  Registry', () => {
  beforeAll(() => {
    this.purgeableRegistry = new PurgeableModule('Registry', 'models/registry');
  });

  beforeEach(() => {
    const Registry = this.purgeableRegistry.require();
    this.Registry = Registry;
  });

  afterEach(() => {
    this.purgeableRegistry.purge();
  });


  describe('static methods', () => {
    // beforeEach(() => {});

    describe('set static property via .global()', () => {
      beforeEach(() => {
        const _className = 'JustSomeClass';
        this.SomeClass = (class SomeClass {
          get _className() { return _className; }
        });
        this._className = _className;
      });

      it('should use provided name for property name', () => {
        const instance = new this.SomeClass();
        this.Registry.global('MyClass', instance);

        expect(this.Registry.global('MyClass')).toBe(instance);
      });

      it('should use _className on given instance for property name', () => {
        const instance = new this.SomeClass();
        this.Registry.global(instance);

        expect(this.Registry.global('JustSomeClass')).toBe(instance);
      });

      it('should use constructor name on given instance for property name', () => {
        class Whatever {};
        const instance = new Whatever();

        this.Registry.global(instance);

        expect(this.Registry.global('Whatever')).toBe(instance);
      });

      it('should error if not given name or _className/constructor.name missing', () => {
        expect(() => this.Registry.global(undefined)).toThrow();
        expect(() => this.Registry.global(null)).toThrow();
        expect(() => this.Registry.global()).toThrow();
      });

      xit('should prevent overwriting globals (or shouldnt it?)', () => {
        const instance = new this.SomeClass();
        const override = {};

        this.Registry.global(instance);

        expect(this.Registry.justSomeClass).toBe(instance);
        expect(() => this.Registry.global(override, 'justSomeClass')).toThrow();
      });
    });
  });

  describe('getting and setting', () => {
    it('should set a simple context with value', () => {
      class Foo {}
      class Bar {}

      const context = {};
      const key = 'foo';
      const val = new Foo();

      const registry = this.Registry.context(context);

      registry.set(key, val);

      expect(this.Registry.for(val).get(key)).toBe(val);
    });
  });
});
