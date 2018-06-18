/* eslint-disable import/no-extraneous-dependencies */
const { SpecReporter } = require('jasmine-spec-reporter');

jasmine.getEnv().clearReporters(); // remove default reporter logs
jasmine.getEnv().addReporter(new SpecReporter({
  spec: {
    displayPending: true,
  },
  summary: {
    displayStacktrace: true,
  },
}));
