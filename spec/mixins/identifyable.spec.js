const Identifyable = require('../../mixins/identifyable');


describe('mixins: Identifyable', () => {
  beforeEach(() => {
    class Identifyed extends Identifyable() {
      static get [Symbol.species]() {
        return Identifyed;
      }
    }

    this.Identifyed = Identifyed;
  });


  it('can be created without params', () => {
    expect(new this.Identifyed()).toEqual(jasmine.any(Object));
  });

  describe('using a base class', () => {
    describe('_className', () => {
      it('is the name of the base class', () => {
        const identifyed = new this.Identifyed();
        expect(identifyed._className).toEqual('Identifyed');
      });
    });

    describe('_species', () => {
      it('is the type of the base class', () => {
        const identifyed = new this.Identifyed();
        expect(identifyed._species).toEqual(this.Identifyed);
      });
    });
  });

  describe('using a derived class', () => {
    beforeEach(() => {
      class AnotherIdentifyed extends this.Identifyed {}

      this.AnotherIdentifyed = AnotherIdentifyed;
    });

    describe('_className', () => {
      it('is the name of the exending class', () => {
        const anotherIdentifyed = new this.AnotherIdentifyed();
        expect(anotherIdentifyed._className).toEqual('AnotherIdentifyed');
      });
    });

    describe('_species', () => {
      it('is STILL the type of the base class', () => {
        const anotherIdentifyed = new this.AnotherIdentifyed();
        expect(anotherIdentifyed._species).toEqual(this.Identifyed);
      });
    });
  });
});
