const Envable = require('../../../mixins/envable');
const Jsonable = require('../../../mixins/jsonable');
const Logable = require('../../../mixins/logable');


/**
 *  Wraps the notification object sent by the Jenkins Notification plugin.
 *
 *  @alias JenkinsNotificaton
 *  @memberof subscribers.jenkins
 *  @mixes module:slackbot/mixins~Envable
 *  @mixes module:slackbot/mixins~Jsonable
 *  @mixes module:slackbot/mixins~Logable
 *  @extends module:slackbot/mixins~Envable
 *  @extends module:slackbot/mixins~Jsonable
 *  @extends module:slackbot/mixins~Logable
 *
 *  @param {object} options
 *  @param {object} [options.notification={}] JSON payload from Jenkins Notification.
 *
 *  @see {@link https://plugins.jenkins.io/notification}
 *  @private
 */
class JenkinsNotification extends Jsonable(Logable(Envable())) {
  constructor({ notification = {}, ...superOpts } = {}) {
    super({ json: notification, ...superOpts });
  }
}


module.exports = JenkinsNotification;
