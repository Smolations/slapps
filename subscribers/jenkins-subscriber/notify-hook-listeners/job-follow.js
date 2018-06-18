const Listener = require('../../../interfaces/listener');

const InteractionBuilder = require('../../../models/interaction-builder');
const Registry = require('../../../models/registry');

const jobFollowFormatter = require('../formatters/job-follow');

const _followers = Symbol('followers');


/**
 *  A processor to handle independent webhook notification calls from the
 *  Jenkins Notification plugin.
 *
 *  @alias JobFollowNotifyHookListener
 *  @memberOf subscribers.jenkins
 *  @extends Listener
 *  @private
 */
class JobFollowNotifyHookListener extends Listener {
  constructor({ ...superOpts } = {}) {
    super(superOpts);

    this[_followers] = [];
  }


  /**
   *  Adds a follower to job status. All followers of a job will receive
   *  status updates until they are removed from the list.
   *
   *  @todo Decided on one-time vs. indefinitely (or both)
   *  @todo Make sure not to add the same follower for the same job twice
   *
   *  @param {object} options
   *  @param {object} options.user    User ID of the follower.
   *  @param {object} options.jobName Jenkins job name.
   *  @returns {Promise}
   */
  addFollower({ user, jobName }) {
    const registry = Registry.for(this);
    const slack = registry.get('Slack');
    return slack.openDirectMessage({ user })
      .then((resp) => {
        // this._log.json('openDirectMessage returns:', resp);
        const channel = resp.channel.id;
        this._log.json('adding follower:', { user, channel, jobName });
        this[_followers].push({ user, channel, jobName });
        return { user, channel, jobName };
      })
      .catch(err => this._log.error(`Failed to open DM with ${user}:  ${err}`));
  }

  /**
   *  The notification is formatted and a DM is sent with job statuses. When
   *  updating the status, the original message is updated so that updates
   *  happen in-place.
   *
   *  @param {object} options
   *  @param {JenkinsNotification} options.notification
   */
  process({ notification }) {
    this._log.json(`now processing notification for ${notification.name}`);
    const interactionBuilder = new InteractionBuilder();
    const registry = Registry.for(this);
    const slack = registry.get('Slack');
    let attachments = [];
    let message;

    // sample postMessage response
    // {
    //   "ok": true,
    //   "channel": "DA30D2K1B",
    //   "ts": "1523997905.000351",
    //   "message": {
    //     "type": "message",
    //     "user": "UA30D2JSH",
    //     "text": "Following job: *QA-Control*\n:black_square:  QUEUED\n:black_square:  STARTED\n:black_square:  COMPLETED\n:ballot_box_with_check:  FINALIZED",
    //     "bot_id": "BA30D2JS1",
    //     "ts": "1523997905.000351"
    //   },
    //   "acceptedScopes": [
    //     "chat:write:user",
    //     "client"
    //   ]
    // }

    // probably will need auto-remove logic here...

    this[_followers].forEach((follower) => {
      this._log.debug(`checking follower: ${follower.jobName}`);

      if (follower.jobName === notification.name) {
        this._log.debug(`match found! formatting and sending message...`);
        message = jobFollowFormatter(notification);

        if (!follower.messageTimestamp) {
          this._log.debug(`no follower timestamp, sending initial message`);
          slack.postMessage({ text: message, channel: follower.channel })
            .then(resp => {
              const { ts } = resp;
              follower.messageTimestamp = ts;
            });
        } else {
          this._log.debug(`follower timestamp present, updating message`);
          if (notification.build.phase === 'FINALIZED') {
            attachments = interactionBuilder
              .dismissButton({ ts: follower.messageTimestamp })
              .build();
          }
          slack.updateMessage({
            text: message,
            channel: follower.channel,
            ts: follower.messageTimestamp,
            attachments,
          });
        }
      }
    });
  }
}


module.exports = JobFollowNotifyHookListener;
