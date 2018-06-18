const Envable = require('../../mixins/envable');
const Jsonable = require('../../mixins/jsonable');
const Logable = require('../../mixins/logable');


/**
 *  Wraps the notification object sent by the Jenkins Notification plugin.
 *
 *  @alias JenkinsNotificaton
 *  @memberof module:slackbot/models
 *  @mixes Envable
 *  @mixes Jsonable
 *  @mixes Logable
 *  @extends Envable
 *  @extends Jsonable
 *  @extends Logable
 *
 *  @param {object} options
 *  @param {object} [options.notification={}] JSON payload from Jenkins Notification.
 *
 *  @see {@link https://plugins.jenkins.io/notification}
 */
class JenkinsNotification extends Jsonable(Logable(Envable())) {
  constructor({ notification = {}, ...superOpts } = {}) {
    super({ json: notification, ...superOpts });
  }
}


module.exports = JenkinsNotification;
