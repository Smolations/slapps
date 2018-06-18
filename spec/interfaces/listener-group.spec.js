const ListenerGroup = require('../../interfaces/listener-group');
const Listener = require('../../interfaces/listener');
const PurgeableModule = require('../helpers/purgeable-module');


describe('interfaces: ListenerGroup', () => {
  beforeAll(() => {
    this.purgeableRegistry = new PurgeableModule('Registry', 'models/registry');
  });


  describe('#constructor', () => {
    it('throws when instantiated directly', () => {
      expect(() => new ListenerGroup()).toThrowError(SyntaxError);
    });
  });

  describe('creating subclasses', () => {
    beforeAll(() => {
      const spyable = {
        matched() {},
        unmatched() {},
      };
      class SomeListenerListenerGroup extends ListenerGroup {}
      class SomeListener extends Listener {
        match() { return true; }
        process() { spyable.matched(); }
      }
      class ThenSomeListener extends SomeListener {
        match() { return false; }
        process() { spyable.unmatched(); }
      }

      this.SomeListenerListenerGroup = SomeListenerListenerGroup;
      this.SomeListener = SomeListener;
      this.ThenSomeListener = ThenSomeListener;
      this.spyable = spyable;

      this.getListenerGroupInstance = () => new SomeListenerListenerGroup({ itemClass: SomeListener });
    });


    describe('#constructor', () => {
      it('throws when itemClass is not provided for validation', () => {
        expect(() => new this.SomeListenerListenerGroup()).toThrowError(TypeError);
      });

      it('throws when itemClass does not extend Listener', () => {
        class Foo {}
        expect(() => new this.SomeListenerListenerGroup({ itemClass: Foo })).toThrowError(TypeError);
      });

      it('can be created with valid itemClass', () => {
        const instance = this.getListenerGroupInstance();
        expect(instance).toEqual(jasmine.any(Object));
      });
    });

    describe('desired mixins are mixed', () => {
      it('is Envable', () => {
        const instance = this.getListenerGroupInstance();
        expect(instance._env).toEqual(process.env.NODE_ENV || 'development');
      });

      it('is Identifyable', () => {
        const instance = this.getListenerGroupInstance();
        expect(instance._className).toEqual('SomeListenerListenerGroup');
        expect(instance instanceof ListenerGroup).toEqual(true);
      });

      it('is Logable', () => {
        const instance = this.getListenerGroupInstance();
        expect(instance._log).not.toBeUndefined();
      });
    });

    describe('instance methods', () => {
      beforeAll(() => {
        const Registry = this.purgeableRegistry.require();
        this.Registry = Registry;
        this.registry = this.Registry.context('testContext');
      });

      afterAll(() => {
        this.purgeableRegistry.purge();
      });


      describe('#add()', () => {
        it('throws if validation against itemClass fails', () => {
          const instance = this.getListenerGroupInstance();
          class Foo {}

          const shouldThrow = () => instance.add(Foo);

          expect(shouldThrow).toThrowError(TypeError);
        });

        it('can take a single processor (matching itemClass)', () => {
          const instance = this.getListenerGroupInstance();
          this.registry.set(instance);
          const shouldSucceed = () => instance.add(this.SomeListener);
          expect(shouldSucceed).not.toThrow();
        });

        it('can take a single processor (subclass of itemClass)', () => {
          const instance = this.getListenerGroupInstance();
          this.registry.set(instance);
          const shouldSucceed = () => instance.add(this.ThenSomeListener);
          expect(shouldSucceed).not.toThrow();
        });

        it('can take an array of processors', () => {
          const instance = this.getListenerGroupInstance();
          this.registry.set(instance);
          const shouldSucceed = () => instance.add([
            this.SomeListener,
            this.ThenSomeListener,
          ]);
          expect(shouldSucceed).not.toThrow();
        });
      });

      describe('#length', () => {
        it('gives correct value', () => {
          const instance = this.getListenerGroupInstance();
          this.registry.set(instance);
          instance.add(this.SomeListener);
          expect(instance.length).toEqual(1);
        });
      });

      describe('#process()', () => {
        it('throws if data is not passed', () => {
          const instance = this.getListenerGroupInstance();
          const shouldThrow = () => instance.process();
          expect(shouldThrow).toThrowError(TypeError);
        });

        it('throws if data is not passed correctly', () => {
          const instance = this.getListenerGroupInstance();
          const data = {};
          const shouldThrow = () => instance.process(data);
          expect(shouldThrow).toThrowError(TypeError);
        });

        it('calls process() on matched processors', async (done) => {
          const instance = this.getListenerGroupInstance();
          this.registry.set(instance);
          instance.add([
            this.SomeListener,
            this.ThenSomeListener,
          ]);

          spyOn(this.spyable, 'matched');
          spyOn(this.spyable, 'unmatched');

          await instance.process({ data: {} });

          expect(this.spyable.matched).toHaveBeenCalled();
          expect(this.spyable.unmatched).not.toHaveBeenCalled();

          done();
        });
      });
    });
  });
});
