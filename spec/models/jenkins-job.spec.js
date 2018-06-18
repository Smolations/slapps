const JenkinsJob = require('../../models/jenkins-job');
const nock = require('nock');


describe('JenkinsJob', () => {
  it('can be created', () => {
    expect(new JenkinsJob()).toEqual(jasmine.any(Object));
  });

  describe('#constructor', () => {
    describe('name', () => {
      it('can be assigned a value', () => {
        const job = new JenkinsJob({ name: 'JobName' });
        expect(job.name).toEqual('JobName');
      });
    });

    describe('pollingTimeout', () => {
      it('can be assigned a number', () => {
        const job = new JenkinsJob({ pollingTimeout: 123 });
        expect(job.pollingTimeout).toEqual(123);
      });

      it('can be assigned zero', () => {
        const job = new JenkinsJob({ pollingTimeout: 0 });
        expect(job.pollingTimeout).toEqual(0);
      });

      it('is set to 3000 ms by default', () => {
        const job = new JenkinsJob({ configKey: 'jenkinsJob' });
        expect(job.pollingTimeout).toEqual(3000);
      });
    });

    describe('pollingRetries', () => {
      it('can be assigned a number', () => {
        const job = new JenkinsJob({ pollingRetries: 99 });
        expect(job.pollingRetries).toEqual(99);
      });

      it('can be assigned zero', () => {
        const job = new JenkinsJob({ pollingRetries: 0 });
        expect(job.pollingRetries).toEqual(0);
      });

      it('is assigned 10 by default', () => {
        const job = new JenkinsJob({ configKey: 'jenkinsJob' });
        expect(job.pollingRetries).toEqual(10);
      });
    });

    describe('csrfProtection', () => {
      it('can be assigned true', () => {
        const job = new JenkinsJob({ csrfProtection: true });
        expect(job.csrfProtection).toEqual(true);
      });

      it('can be assigned false', () => {
        const job = new JenkinsJob({ csrfProtection: false });
        expect(job.csrfProtection).toEqual(false);
      });

      it('is assigned false by default', () => {
        const job = new JenkinsJob({ configKey: 'jenkinsJob' });
        expect(job.csrfProtection).toEqual(false);
      });
    });
  });

  describe('#status', () => {
    beforeEach(() => {
      this.jobName = 'JOB_NAME';
      const jobPath = `/job/${this.jobName}/api/json`;

      this.jenkinsJob = new JenkinsJob({
        name: this.jobName,
        configKey: 'jenkinsJob',
      });

      this.nockStatus = ({ color, queued, error } = {}) => {
        const nockResponse = nock(this.jenkinsJob._url)
          .get(jobPath);

        if (color) {
          return nockResponse.reply(200, { color: `${color}` });
        } else if (queued) {
          return nockResponse.reply(200, { inQueue: true });
        } else if (error) {
          return nockResponse.replyWithError(error);
        } // success
        return nockResponse.reply(200, { color: 'blue' });
      };
    });

    describe('with a successful job', () => {
      beforeEach(() => {
        this.nockStatus();
      });

      it('returns SUCCESS with a callback', async (done) => {
        const status = await this.jenkinsJob.status();
        expect(status).toEqual('SUCCESS');
        done();
      });

      it('returns SUCCESS with a promise', async (done) => {
        const status = await this.jenkinsJob.status();
        expect(status).toEqual('SUCCESS');
        done();
      });
    });

    describe('with a failed job', () => {
      beforeEach(() => {
        this.nockStatus({ color: 'red' });
      });

      it('returns FAILURE with a promise', async (done) => {
        const status = await this.jenkinsJob.status();
        expect(status).toEqual('FAILURE');
        done();
      });
    });

    describe('with a queued job', () => {
      beforeEach(() => {
        this.nockStatus({ queued: true });
      });

      it('returns QUEUED with a promise', async (done) => {
        const status = await this.jenkinsJob.status();
        expect(status).toEqual('QUEUED');
        done();
      });
    });

    describe('with a running job', () => {
      beforeEach(() => {
        this.nockStatus({ color: 'anime-blue' });
      });

      it('returns RUNNING with a promise', async (done) => {
        const status = await this.jenkinsJob.status();
        expect(status).toEqual('RUNNING');
        done();
      });
    });

    describe('with a cancelled job', () => {
      beforeEach(() => {
        this.nockStatus({ color: 'aborted' });
      });

      it('returns CANCELLED with a promise', async (done) => {
        const status = await this.jenkinsJob.status();
        expect(status).toEqual('CANCELLED');
        done();
      });
    });

    describe('with an unknown job status', () => {
      beforeEach(() => {
        this.nockStatus({ color: 'indigo' });
      });

      it('returns UNKNOWN with a promise', async (done) => {
        const status = await this.jenkinsJob.status();
        expect(status).toEqual('UNKNOWN');
        done();
      });
    });

    describe('with an error', () => {
      beforeEach(() => {
        this.error = 'the error';
        this.nockStatus({ error: this.error });
      });

      it('returns the error with a promise', async (done) => {
        await this.jenkinsJob.status()
          .catch((error) => {
            expect(error).toMatch(this.error);
            done();
          });
      });
    });
  });

  describe('#build', () => {
    beforeEach(() => {
      this.jobName = 'JENKINS-JOB';
      this.version = '1.2.3';
      this.queueId = 1;
      this.buildId = 2;

      this.jenkinsJob = new JenkinsJob({
        configKey: 'jenkinsJob',
        name: this.jobName,
        pollingTimeout: 0,
        pollingRetries: 3,
      });

      // this.jenkinsJob._on("JenkinsJob:cancelled", () => {
      //   console.log('CANCELLED');
      // });
      // this.jenkinsJob.on("error", () => {
      //   console.log('ERROR');
      // });
      // this.jenkinsJob.on("success", () => {
      //   console.log('SUCCESS');
      // });
      // this.jenkinsJob.on("failure", () => {
      //   console.log('FAILURE');
      // });
      // this.jenkinsJob.on("pollForBuildId", () => {
      //   console.log('pollForBuildId');
      // });
      // this.jenkinsJob.on("pollForBuildStatus", () => {
      //   console.log('pollForBuildStatus');
      // });

      // crsfProtection is enabled by default, which forces the crumbIssuer request
      nock(this.jenkinsJob._url)
        .get('/crumbIssuer/api/json')
        .reply(200, { crumb: '12345678901234567890123456789012', crumbRequestField: 'Jenkins-Crumb' });

      // step 1: nock queue id
      this.nockQueueId = ({ error } = {}) => {
        const nockResponse = nock(this.jenkinsJob._url)
          .post(`/job/${this.jobName}/buildWithParameters`)
          .query({ ReleaseTAG: this.version });

        if (error) {
          return nockResponse.replyWithError(error);
        }

        return nockResponse.reply(201, '', ['Location', `${this.jenkinsJob._url}/queue/item/${this.queueId}/`]);
      };

      // step 2: nock build id
      this.nockBuildId = ({ cancelled, emptyResponse, error } = {}) => {
        const nockResponse = nock(this.jenkinsJob._url)
          .get(`/queue/item/${this.queueId}/api/json`);

        if (error) {
          return nockResponse.replyWithError(error);
        } else if (cancelled) {
          return nockResponse.reply(200, { cancelled: 'true' });
        } else if (emptyResponse) {
          return nockResponse.reply(200, {});
        }

        return nockResponse.reply(200, {
          executable: {
            number: this.buildId,
            url: `${this.jenkinsJob._url}/job/${this.jobName}/${this.buildId}/`,
          },
        });
      };

      // step 3: nock build status
      this.nockBuildStatus = ({ emptyResponse, status, error } = {}) => {
        const nockResponse = nock(this.jenkinsJob._url)
          .get(`/job/${this.jobName}/${this.buildId}/api/json`);

        if (error) {
          return nockResponse.replyWithError(error);
        } else if (status) {
          return nockResponse.reply(200, { result: status });
        } else if (emptyResponse) {
          return nockResponse.reply(200, { result: null });
        }

        return nockResponse.reply(200, { result: 'SUCCESS' });
      };
    });

    afterEach(() => {
      nock.cleanAll();
    });

    describe('requesting the queue id', () => {
      describe('with a successful request', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus();
        });

        it('emits poll for build id', (done) => {
          // there were nock race conditions happening when calling done()
          // on the pollForBuildId event, so there is a lil grossness
          // here to make sure the job processing completes
          let eventEmitted = false;
          this.jenkinsJob._on('JenkinsJob:pollForBuildId', () => {
            eventEmitted = true;
          });
          this.jenkinsJob._on('JenkinsJob:success', () => {
            expect(eventEmitted).toBe(true);
            done();
          });

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with one failed request', () => {
        beforeEach(() => {
          this.nockQueueId({ error: 'queue id error' });
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus();
        });

        it('emits success', (done) => {
          this.jenkinsJob._on('JenkinsJob:success', done);

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with two failed requests', () => {
        beforeEach(() => {
          this.nockQueueId({ error: 'queue id error' });
          this.nockQueueId({ error: 'queue id error' });
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus();
        });

        it('emits success', (done) => {
          this.jenkinsJob._on('JenkinsJob:success', done);

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with three failed requests', () => {
        beforeEach(() => {
          this.nockQueueId({ error: 'queue id error 1' });
          this.nockQueueId({ error: 'queue id error 2' });
          this.nockQueueId({ error: 'queue id error 3' });
          this.nockBuildId();
          this.nockBuildStatus();
        });

        it('emits the error', (done) => {
          this.jenkinsJob._on('JenkinsJob:error', (error) => {
            expect(error).toMatch('queue id error 3');
            done();
          });

          this.jenkinsJob.build(this.version);
        });
      });
    });

    describe('requesting the build id', () => {
      describe('with a successful request', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus();
        });

        it('emits poll for build status with the url', (done) => {
          let eventEmitted = false;
          this.jenkinsJob._on('JenkinsJob:pollForBuildStatus', (url) => {
            eventEmitted = true;
            expect(url).toEqual(`${this.jenkinsJob._url}/job/${this.jobName}/${this.buildId}/console`);
          });
          this.jenkinsJob._on('JenkinsJob:success', () => {
            expect(eventEmitted).toBe(true);
            done();
          });

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with a cancelled status', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId({ cancelled: true });
          this.nockBuildStatus();
        });

        it('emits cancelled', (done) => {
          this.jenkinsJob._on('JenkinsJob:cancelled', done);

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with one failed request', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId({ error: 'build id error 1' });
          this.nockBuildId();
          this.nockBuildStatus();
        });

        it('emits success', (done) => {
          this.jenkinsJob._on('JenkinsJob:success', done);

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with two failed requests', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId({ error: 'build id error 1' });
          this.nockBuildId({ error: 'build id error 2' });
          this.nockBuildId();
          this.nockBuildStatus();
        });

        it('emits success', (done) => {
          this.jenkinsJob._on('JenkinsJob:success', done);

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with three failed requests', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId({ error: 'build id error 1' });
          this.nockBuildId({ error: 'build id error 2' });
          this.nockBuildId({ error: 'build id error 3' });
          this.nockBuildStatus();
        });

        it('emits the error', (done) => {
          this.jenkinsJob._on('JenkinsJob:error', (error) => {
            expect(error).toMatch('build id error 3');
            done();
          });

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with three non-consecutive failed requests', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId({ error: 'build id error 1' });
          this.nockBuildId({ error: 'build id error 2' });
          this.nockBuildId({ emptyResponse: true });
          this.nockBuildId({ error: 'build id error 3' });
          this.nockBuildStatus();
        });

        it('emits success', (done) => {
          const lastRequest = this.nockBuildId();
          this.jenkinsJob._on('JenkinsJob:success', () => {
            expect(lastRequest.isDone()).toEqual(true);
            done();
          });

          this.jenkinsJob.build(this.version);
        });
      });

      describe('in all other situations', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId({ emptyResponse: true });
          this.nockBuildStatus();
        });

        it('makes another request', (done) => {
          const secondRequest = this.nockBuildId();

          this.jenkinsJob._on('JenkinsJob:success', () => {
            expect(secondRequest.isDone()).toEqual(true);
            done();
          });

          this.jenkinsJob.build(this.version);
        });
      });
    });

    describe('requesting the build status', () => {
      describe('with a SUCCESS status', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus({ status: 'SUCCESS' });
        });

        it('emits success', (done) => {
          this.jenkinsJob._on('JenkinsJob:success', done);

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with an ABORTED status', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus({ status: 'ABORTED' });
        });

        it('emits cancelled', (done) => {
          this.jenkinsJob._on('JenkinsJob:cancelled', done);

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with any other status', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus({ status: 'GIRAFFE' });
        });

        it('emits failure', (done) => {
          this.jenkinsJob._on('JenkinsJob:failure', done);

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with one failed request', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus({ error: 'build status error 1' });
          this.nockBuildStatus();
        });

        it('emits success', (done) => {
          this.jenkinsJob._on('JenkinsJob:success', done);

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with two failed requests', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus({ error: 'build status error 1' });
          this.nockBuildStatus({ error: 'build status error 2' });
          this.nockBuildStatus();
        });

        it('emits success', (done) => {
          this.jenkinsJob._on('JenkinsJob:success', done);

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with three failed requests', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus({ error: 'build status error 1' });
          this.nockBuildStatus({ error: 'build status error 2' });
          this.nockBuildStatus({ error: 'build status error 3' });
        });

        it('emits the error', (done) => {
          this.jenkinsJob._on('JenkinsJob:error', (error) => {
            expect(error).toMatch('build status error 3');
            done();
          });

          this.jenkinsJob.build(this.version);
        });
      });

      describe('with three non-consecutive failed requests', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus({ error: 'build status error 1' });
          this.nockBuildStatus({ error: 'build status error 2' });
          this.nockBuildStatus({ emptyResponse: true });
          this.nockBuildStatus({ error: 'build status error 3' });
        });

        it('emits success', (done) => {
          const lastRequest = this.nockBuildStatus();
          this.jenkinsJob._on('JenkinsJob:success', () => {
            expect(lastRequest.isDone()).toEqual(true);
            done();
          });

          this.jenkinsJob.build(this.version);
        });
      });

      describe('in all other situations', () => {
        beforeEach(() => {
          this.nockQueueId();
          this.nockBuildId();
          this.nockBuildStatus({ emptyResponse: true });
        });

        it('makes another request', (done) => {
          const secondRequest = this.nockBuildStatus();

          this.jenkinsJob._on('JenkinsJob:success', () => {
            expect(secondRequest.isDone()).toEqual(true);
            done();
          });

          this.jenkinsJob.build(this.version);
        });
      });
    });
  });

  describe('#lastBuildUrl(jobName)', () => {
    beforeEach(() => {
      this.jobName = 'JENKINS-JOB';

      this.jenkinsJob = new JenkinsJob({
        name: this.jobName,
        configKey: 'jenkinsJob',
      });
    });

    it('returns the correct url for the console output of the last build', () => {
      const newJobName = 'NEW-JOB';
      const actualUrl = this.jenkinsJob.lastBuildUrl(newJobName);
      const expectedUrl = `${this.jenkinsJob._url}/job/${newJobName}/lastBuild/console`;

      expect(actualUrl).toEqual(expectedUrl);
    });
  });
});
