const Listener = require('../../interfaces/listener');


describe('interfaces: Listener', () => {
  describe('#constructor', () => {
    it('throws when instantiated directly', () => {
      expect(() => new Listener()).toThrowError(SyntaxError);
    });
  });

  describe('creating subclasses', () => {
    beforeEach(() => {
      class NewListener extends Listener {}

      this.NewListener = NewListener;
    });

    it('can be created', () => {
      const instance = new this.NewListener();
      expect(instance).toEqual(jasmine.any(Object));
    });

    describe('desired mixins are mixed', () => {
      it('is Envable', () => {
        const instance = new this.NewListener();
        expect(instance._env).toEqual(process.env.NODE_ENV || 'development');
      });

      it('is Identifyable', () => {
        const instance = new this.NewListener();
        expect(instance._className).toEqual('NewListener');
        expect(instance instanceof Listener).toEqual(true);
      });

      it('is Logable', () => {
        const instance = new this.NewListener();
        expect(instance._log).not.toBeUndefined();
      });
    });

    describe('when acting as interface', () => {
      it('throws for unimplemented #match()', () => {
        const instance = new this.NewListener();
        expect(instance.match).toThrow();
      });

      it('throws for unimplemented #process()', () => {
        const instance = new this.NewListener();
        expect(instance.process).toThrow();
      });
    });
  });
});
