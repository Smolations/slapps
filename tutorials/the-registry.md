The api docs can be intimidating at first glance, so let's see if we can't make it a bit simpler and lay out the basic concepts here.

Configuration
-------------


Now we need a class that uses the mixin:
```javascript
// ./foo.js
const Configable = require('./mixins/configable');

class Foo extends Configable() {
  // ...stuff...
}

// give the key to the keymaster
const foo = new Foo({ configKey: 'foo' });

// now you can access the values from the instance
foo._config.leet === true; // true
console.log(foo._config.victory); // > 'always guaranteed'
```

