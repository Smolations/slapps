
const phases = ['QUEUED', 'STARTED', 'COMPLETED', 'FINALIZED'];


/**
 *  Gives real-time, in-place updates on a job's build status via DM.
 *
 *  @memberOf subscribers.jenkins
 *  @param {subscriber.jenkins.JenkinsNotification} jenkinsNotification
 *  @returns {string}
 *  @private
 */
function jobFollowFormatter(jenkinsNotification) {
  console.log(`jobFollowFormatter formatting notification: ${jenkinsNotification.name}`);
  const unfinishedEmoji = 'black_square';
  const finishedEmoji = 'black_square_button';
  const { name, build } = jenkinsNotification;
  const { phase, status } = build;
  const phaseNumber = phases.indexOf(phase);
  const message = [`Following job: *${name}*`];

  phases.forEach((phaseLabel, ndx) => {
    const emoji = phaseNumber >= ndx ? finishedEmoji : unfinishedEmoji;
    message.push(`:${emoji}:  ${phaseLabel}${status && (phase === phaseLabel) ? `  (${status})` : ''}`);
  });

  return message.join('\n');
}


module.exports = jobFollowFormatter;
