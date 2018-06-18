const Jsonable = require('../../mixins/jsonable');


describe('mixins: Jsonable', () => {
  beforeEach(() => {
    class Jsoned extends Jsonable() {}
    this.Jsoned = Jsoned;
  });

  describe('#constructor', () => {
    it('can be created without params', () => {
      expect(new this.Jsoned()).toEqual(jasmine.any(Object));
    });

    it('can be created with a json object', () => {
      const json = { foo: true };
      const jsoned = new this.Jsoned({ json });
      expect(jsoned._json).toEqual(json);
    });

    it('can be created with a json string', () => {
      const json = { foo: true };
      const jsonString = JSON.stringify(json);
      const jsoned = new this.Jsoned({ json: jsonString });

      expect(jsoned._json).toEqual(jasmine.any(Object));
      expect(JSON.stringify(jsoned._json)).toEqual(jsonString);
    });
  });

  describe('manipulating an object', () => {
    beforeEach(() => {
      const json = {
        foo: [0, 1, 2],
        bar: {
          baz: true,
        },
      };

      this.json = json;
      this.jsoned = new this.Jsoned({ json });
    });

    it('will store the jsoned object', () => {
      expect(this.jsoned._json).toEqual(this.json);
    });

    it('will get from the jsoned object', () => {
      const { jsoned } = this;
      expect(jsoned.foo).toEqual(this.json.foo);
      expect(jsoned.bar.baz).toEqual(this.json.bar.baz);
    });

    it('will set existing property on the jsoned object', () => {
      const { jsoned } = this;
      const newPropValue = {};

      jsoned.foo = newPropValue;

      expect(jsoned.foo).toEqual(newPropValue);
      expect(jsoned._json.foo).toEqual(newPropValue);
    });

    it('will set new property on the jsoned object', () => {
      const { jsoned } = this;
      const newPropName = 'newProp';
      const newPropValue = 'brand new';

      jsoned[newPropName] = newPropValue;

      expect(jsoned[newPropName]).toEqual(newPropValue);
      expect(jsoned._json[newPropName]).toEqual(newPropValue);
    });
  });

  describe('accessing different representations', () => {
    beforeEach(() => {
      const json = {
        foo: [0, 1, 2],
        bar: {
          baz: true,
        },
      };

      this.json = json;
      this.jsoned = new this.Jsoned({ json });
    });

    it('will store the jsoned object', () => {
      expect(this.jsoned._json).toEqual(this.json);
    });

    it('#toJSON()', () => {
      const { jsoned } = this;
      expect(jsoned.toJSON()).toEqual(this.json);
    });

    it('#toString()', () => {
      const { jsoned } = this;
      expect(jsoned.toString()).toEqual(JSON.stringify(this.json));
    });
  });
});
