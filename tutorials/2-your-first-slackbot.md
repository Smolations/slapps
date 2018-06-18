Assume we have a project on github that is simply a static, front-end implementation of a website. It runs on a simple node server. For the purposes of this example, let's assume it has some arbitrary npm scripts that run tests, lints, and deploys. This project will be called **Wonderjuice**, and is the website for a small company that sells various, exotic juices.  =]

The first thing to do is to configure the slack app (you will need a Slack account). First, join or create a workspace you will use for testing. You may also want to create a channel specifically for bot testing if you choose an existing workspace that other people use. Next, head over to your {@link https://api.slack.com/apps|Slack app configuration} and click the "Create New App" button. Go through the motions, enable interactive components if you plan to use them, and configure the URLs for the app so that they will point to your development server (@see Development Process). Choose any and all permission scopes that will apply to your bot, and then install the app to your workspace and a channel within it. Slack does a decent job of walking you through each step so this part is not covered in detail here.

Now you are ready to create a configuration file for your bot. Open your terminal and navigate to this project and run:
```
$ npm run bootstrap-dev
```

This should create your `./config/development.json` config and a corresponding cert. Pop open that file and locate the slackbot config object. Insert the corresponding values that are available on the Slack app configuration page, including a bot token, the verification token, and any URIs that you configured for the app. If you just plan to use the RTM API, you can leave the URI fields empty. For our fictional *Wonderbot*, our config looks like this (notice that the key is `"wonderBot"`; you can change the default if you want as we reference this key manually later on):
```json
{
  "wonderBot": {
    "token": "xoxp-307414555393-307963195234-354489026327-c43826b116a3e79aca92b02d4ce713e9",
    "botToken": "xoxb-343013086901-d8Bsfm2fR6zr3lIww699ez5S",
    "verificationToken": "gYlkXkkTU5hnF6pwkLuVS37c",
    "slashCommandUri": "/slack/slash/wonder",
    "optionsLoadUri": "/slack/options/wonder",
    "interactiveUri": "/slack/interactive/wonder"
  },
  "webServer": {
    "port": 5000,
    "pfx": "./config/development.pkcs12",
    "passphrase": ""
  }
}
```

Sweet, defs ready to move on. We need a file that initializes and starts our bot. Let's create `./wonderbot.js` and add the following to it (for more on all the `configKey` stuff, see {@tutorial configuration}):
```
$ touch wonderbot.js
```
```javascript
// ./wonderbot.js
const Slackbot = require('./models/slack-bot');

// we could have multiple server configurations, but we'll use the default
Slackbot.serverOpts({ configKey: 'webServer' });

// create the bot instance (specifying configKey since it isn't the default)
const wonderBot = new SlackBot({ configKey: 'wonderBot' });

// start it up
wonderBot.start();
```

If we `$ node wonderbot.js` now, the server will start, but the bot won't do anything because there are no subscribers. Let's remedy that situation, shall we? Time to move on to {@tutorial 3-your-first-subscriber}.
