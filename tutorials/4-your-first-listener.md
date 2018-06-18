Slackbot instance? Check. Subscriber? Check. Bot does something useful? Naaaah. It's high time we create a processor so we can listen and respond to messages. Our first interaction will be a "Sup bro!" greeting. We'll use the simplest of processors, which is the RTM processor. Let's keep being organized about it:
```
$ mkdir -p subscribers/wonder-subscriber/rtm-processors
$ touch !$/sup-bro-rtm-processor.js
```

Here's how we'll define the new processor:
```javascript
// ./subscribers/wonder-subscriber/rtm-processors/sup-bro-rtm-processor.js
const Listener = require('../../../interfaces/listener');
const Registry = require('../../../models/registry');

class SupBroRtmListener extends Listener {
  // gotta override this to match the message
  get pattern() {
    return /^hey wonderbot, sup bro\?$/;
  }

  process({ message }) {
    const registry = Registry.for(this);
    const slack = registry.get('Slack');

    const { user, channel } = message;
    const responseText = `Oh hey <@${user.id}>, sup bro!`; // @mention

    return slack.postMessage({ channel: channel.id, text: responseText });
  }
}

module.exports = SupBroRtmListener;
```

Given our (overly-specific) pattern, any time a user sends a message that only includes "hey wonderbot, sup bro?" the bot will respond with a greeting in kind.

Now that we have defined our processor, we just need to add it to the provided collection processor in our subscriber:
```javascript
// ./subscribers/wonder-subscriber/index.js
const Subscriber = require('../../interfaces/subscriber');
const SupBroRtmListener = require('./rtm-processors/sup-bro-rtm-listener');

class WonderSubscriber extends Subscriber {
  subscribe(registry) {
    this.rtmListenerGroup.add(SupBroRtmListener);
  }
}

module.exports = WonderSubscriber;
```

We only had to add two lines of code in order to enable the processor! If you are creating any of the four common processors (`RtmListener`, `SlashCommandListener`, `InteractionListener`, `OptionsListener`) you will only need two lines of code in your subscriber when adding them: the file import and adding the processor to the corresponding collection processor. We'll create an example for each of the remaining three main processors to demonstrate.
