const OptionsListener = require('../../interfaces/options-listener');


describe('interfaces: OptionsListener', () => {
  describe('#constructor', () => {
    it('throws when instantiated directly', () => {
      expect(() => new OptionsListener()).toThrowError(SyntaxError);
    });
  });

  describe('creating subclasses', () => {
    beforeEach(() => {
      class NewOptionsListener extends OptionsListener {}

      this.NewOptionsListener = NewOptionsListener;
    });

    it('can be created', () => {
      const instance = new this.NewOptionsListener();
      expect(instance).toEqual(jasmine.any(Object));
    });

    describe('desired mixins are mixed', () => {
      it('is Envable', () => {
        const instance = new this.NewOptionsListener();
        expect(instance._env).toEqual(process.env.NODE_ENV || 'development');
      });

      it('is Identifyable', () => {
        const instance = new this.NewOptionsListener();
        expect(instance._className).toEqual('NewOptionsListener');
        expect(instance instanceof OptionsListener).toEqual(true);
      });

      it('is Logable', () => {
        const instance = new this.NewOptionsListener();
        expect(instance._log).not.toBeUndefined();
      });
    });

    describe('when acting as interface', () => {
      it('throws for unimplemented #name', () => {
        const instance = new this.NewOptionsListener();
        const shouldThrow = () => instance.name;
        expect(shouldThrow).toThrowError(SyntaxError);
      });

      it('throws for unimplemented #name on #match()', () => {
        const instance = new this.NewOptionsListener();
        const shouldThrow = () => instance.match({ message: {} });
        expect(shouldThrow).toThrowError(SyntaxError);
      });

      it('throws for unimplemented #process()', () => {
        const instance = new this.NewOptionsListener();
        expect(instance.process).toThrow();
      });

      it('will execute #process() on successful #match()', () => {
        const name = 'blork';
        const message = { name };
        class MatchedOptionsListener extends OptionsListener {
          get name() {
            return name;
          }
        }

        const instance = new MatchedOptionsListener();
        expect(instance.match({ message })).toEqual(true);
      });
    });
  });
});
