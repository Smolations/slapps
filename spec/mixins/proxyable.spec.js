const EventEmitter = require('events');
const Proxyable = require('../../mixins/proxyable');


describe('mixins: Proxyable', () => {
  beforeEach(() => {
    class Proxied extends Proxyable() {
      constructor(superOpts) {
        super(superOpts);

        // this.ownProp = this; triggers on the proxy object
        Object.defineProperty(this, 'ownProp', {
          writable: true,
          value: this,
        });
      }

      returnTrue() {
        return true;
      }
    }
    this.Proxied = Proxied;
  });

  describe('#constructor', () => {
    it('throws without proxy param', () => {
      expect(() => new this.Proxied()).toThrow();
    });

    it('can be created with default key', () => {
      const proxyObj = {};
      const proxied = new this.Proxied({ proxy: proxyObj });
      expect(proxied._proxied).toEqual(proxyObj);
    });
  });

  describe('using object literal properties', () => {
    beforeEach(() => {
      const proxyObj = {
        foo: [0, 1, 2],
        bar: {
          baz: true,
        },
      };

      this.proxyObj = proxyObj;
      this.proxied = new this.Proxied({ proxy: proxyObj });
    });

    it('will store the proxied object', () => {
      expect(this.proxied._proxied).toEqual(this.proxyObj);
    });

    it('will get from the proxied object', () => {
      const { proxied } = this;
      expect(proxied.foo).toEqual(this.proxyObj.foo);
      expect(proxied.bar.baz).toEqual(this.proxyObj.bar.baz);
    });

    it('will get from the instance', () => {
      const { proxied } = this;
      expect(proxied.ownProp).toEqual(proxied);
    });

    it('will set on the proxied object', () => {
      const { proxied } = this;
      const newPropName = 'newProp';
      const newPropValue = 'brand new';

      proxied[newPropName] = newPropValue;

      expect(proxied._proxied[newPropName]).toEqual(newPropValue);
    });

    it('will set on the instance when property exists', () => {
      const { proxied } = this;
      const newPropValue = 'brand new';

      proxied.ownProp = newPropValue;

      expect(proxied._proxied.ownProp).toBeUndefined();
      expect(proxied.ownProp).toEqual(newPropValue);
    });
  });

  describe('using object literal methods', () => {
    beforeEach(() => {
      const proxyObj = {
        returnTrue: true,
        bar() { return true; }
      };

      this.proxyObj = proxyObj;
      this.proxied = new this.Proxied({ proxy: proxyObj });
    });

    it('will store the proxied object', () => {
      expect(this.proxied._proxied).toEqual(this.proxyObj);
    });

    it('will get from the proxied object', () => {
      const { proxied } = this;
      expect(proxied.bar()).toEqual(true);
    });

    it('will get from the instance', () => {
      const { proxied } = this;
      expect(proxied.returnTrue).not.toEqual(this.proxyObj.returnTrue);
    });

    it('will throw when overriding a proxied object method', () => {
      const { proxied } = this;
      expect(() => (proxied.bar = false)).toThrow();
    });

    it('will set on the instance when overriding', () => {
      const { proxied } = this;

      proxied.returnTrue = false;

      expect(proxied.returnTrue).toEqual(false);
      expect(proxied._proxied.returnTrue).toEqual(true);
    });
  });

  describe('using something more complicated (EventEmitter)', () => {
    beforeEach(() => {
      const proxy = new EventEmitter();

      this.proxy = proxy;
      this.proxied = new this.Proxied({ proxy });
    });

    it('will store the proxied object', () => {
      expect(this.proxied._proxied).toEqual(this.proxy);
    });

    it('will listen for and emit events with data', (done) => {
      const data = {};
      const eventName = 'event';
      this.proxied.on(eventName, (incomingData) => {
        expect(incomingData).toEqual(data);
        done();
      });
      this.proxied.emit(eventName, data);
    });
  });
});
