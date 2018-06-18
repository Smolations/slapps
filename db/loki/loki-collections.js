
const LokiCollections = {
  SLACK_USERS: ['users', { unique: ['id'] }],
  QUEUE: ['queue', { unique: ['slackId'] }],
  USER_PREFERENCES: ['userPreferences', { unique: ['slackId'] }],

  // integrations
  GITHUB_PREFERENCES: ['githubPreferences', { unique: ['slackId'] }],
  JENKINS_PREFERENCES: ['jenkinsPreferences', { unique: ['slackId'] }],
  JENKINS_JOBS: ['jenkinsJobs', { unique: ['name'] }],
};


module.exports = LokiCollections;
