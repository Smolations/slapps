const PurgeableModule = require('../helpers/purgeable-module');


describe('mixins: Envable', () => {
  beforeAll(() => {
    this.purgeableEnvable = new PurgeableModule('Envable', 'mixins/envable');
  });

  beforeEach(() => {
    const Envable =  this.purgeableEnvable.require();

    class Enved extends Envable() {}

    this.Envable = Envable;
    this.Enved = Enved;
  });

  afterEach(() => {
    this.purgeableEnvable.purge();
  });


  it('can be created without params', () => {
    expect(new this.Enved()).toEqual(jasmine.any(Object));
  });

  describe('using a base class', () => {
    describe('#constructor', () => {
      it('env is set to process.env.NODE_ENV by default', () => {
        const enved = new this.Enved();
        expect(enved._env).toEqual(process.env.NODE_ENV);
      });
    });

    describe('.env', () => {
      it('can be set and retrieved', () => {
        const env = 'baz';
        this.Envable.env(env);
        expect(this.Envable.env()).toEqual(env);
      });

      it('is recognized by mixed class', () => {
        const env = 'blarg';
        this.Envable.env(env);

        const enved = new this.Enved();
        expect(enved._env).toEqual(env);
      });
    });
  });

  describe('using a derived class', () => {
    beforeEach(() => {
      class AnotherEnved extends this.Enved {}

      this.AnotherEnved = AnotherEnved;
    });

    describe('#constructor', () => {
      describe('env', () => {
        it('is set to process.env.NODE_ENV by default', () => {
          const anotherEnved = new this.AnotherEnved();
          expect(anotherEnved._env).toEqual(process.env.NODE_ENV);
        });

        it('is recognized by derived class of mixed class', () => {
          const env = 'foo';
          this.Envable.env(env);

          const anotherEnved = new this.AnotherEnved();
          expect(anotherEnved._env).toEqual(env);
        });
      });
    });
  });
});
