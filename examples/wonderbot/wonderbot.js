const SlackBot = require('../../models/slack-bot');
const WonderSubscriber = require('./wonder-subscriber');

// [_loadConfig](path, baseName, targetKey) {
//   const file = `${path}/${baseName}.json`;

const configPath = './tutorials/wonderbot/config';

SlackBot.serverOpts({ configKey: 'webServer', configPath });

const wonderBot = new SlackBot({ configKey: 'wonderBot', configPath });

wonderBot.start();
