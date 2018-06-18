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

This method of pairing config values makes the use configuration quite flexible. Any Configable instance can consume any key in the config. There is no limit to re-using keys, however, it is common practice to define and consume keys wisely by thinking of them as categories that apply to a specific class. For instance, the nectarbot `SlackBot` consumes the `"slackNectar"` configuration key, which holds the slack tokens and uris specific to the nectarbot app in order to interact with the api.
