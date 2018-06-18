const JenkinsJobRunner = require('../../models/jenkins-job-runner');
const Eventable = require('../../mixins/eventable');


describe('JenkinsJobRunner', () => {
  beforeEach(() => {
    this.jobRunner = new JenkinsJobRunner();

    // create a mock JenkinsJob object (according to the docs)
    const jenkinsJobInstance = {};
    const jenkinsJobBuildOpts = [];
    const jenkinsJobOutcome = {};
    const jenkinsJobError = {};

    this.jenkinsJobOutcome = jenkinsJobOutcome;
    this.jenkinsJobError = jenkinsJobError;

    this.JenkinsJob = (class JenkinsJob extends Eventable() {
      constructor({ name, ...superOpts } = {}) {
        super(superOpts);
        jenkinsJobInstance[name] = this;
        this.name = name;
      }

      status() {
        // QUEUED, SUCCESS, FAILURE, CANCELLED, RUNNING, UNKNOWN
        const outcome = jenkinsJobOutcome[this.name] || 'SUCCESS';
        const error = jenkinsJobError[this.name] || null;
        return new Promise((resolve, reject) => {
          if (error) {
            return reject(error);
          }
          return resolve(outcome);
        });
      }

      build() {
        jenkinsJobBuildOpts.push(this.name);
      }
    });
  });

  it('can be created', () => {
    expect(this.jobRunner).toEqual(jasmine.any(Object));
  });

  describe('#add', () => {
    describe('without a job', () => {
      it('returns false', () => {
        expect(this.jobRunner.add()).toEqual(false);
      });
    });

    describe('with a job', () => {
      it('returns true', () => {
        expect(this.jobRunner.add({})).toEqual(true);
      });
    });
  });

  describe('#all', () => {
    it('returns an empty array', () => {
      expect(this.jobRunner.all()).toEqual([]);
    });

    describe('after adding jenkins jobs', () => {
      beforeEach(() => {
        this.jenkinsJob1 = { the: 'job1' };
        this.jenkinsJob2 = { the: 'job2' };
        this.jobRunner.add(this.jenkinsJob1);
        this.jobRunner.add(this.jenkinsJob2);
      });

      it('returns the jobs in an array', () => {
        expect(this.jobRunner.all()).toEqual([this.jenkinsJob1, this.jenkinsJob2]);
      });
    });
  });

  describe('#status', () => {
    describe('adding a jenkins job that returns: SUCCESS', () => {
      beforeEach(() => {
        this.jenkinsJob = new this.JenkinsJob({ name: 'jenkins-job' });
        this.jenkinsJobOutcome['jenkins-job'] = 'SUCCESS';
        this.jobRunner.add(this.jenkinsJob);
      });

      describe('results', () => {
        it('returns a results array with the job and status', async (done) => {
          const data = await this.jobRunner.status();
          expect(data.results).toContain({
            job: this.jenkinsJob,
            status: 'SUCCESS',
          });
          done();
        });
      });

      describe('success', () => {
        it('returns true', async (done) => {
          const data = await this.jobRunner.status();
          expect(data.success).toEqual(true);
          done();
        });
      });
    });

    describe('adding a jenkins job that returns: FAILURE', () => {
      beforeEach(() => {
        this.jenkinsJob = new this.JenkinsJob({ name: 'jenkins-job' });
        this.jenkinsJobOutcome['jenkins-job'] = 'FAILURE';
        this.jobRunner.add(this.jenkinsJob);
      });

      describe('error', () => {
        it('returns null', async (done) => {
          await this.jobRunner.status()
            .then(done);
        });
      });

      describe('results', () => {
        it('returns an array with the job and status', async (done) => {
          const { results } = await this.jobRunner.status();
          expect(results).toContain({
            job: this.jenkinsJob,
            status: 'FAILURE',
          });
          done();
        });
      });

      describe('success', () => {
        it('returns false', async (done) => {
          const { success } = await this.jobRunner.status();
          expect(success).toEqual(false);
          done();
        });
      });
    });

    describe('adding a jenkins job that returns an error', () => {
      beforeEach(() => {
        this.error = 'THE ERROR';
        this.jenkinsJob = new this.JenkinsJob({ name: 'jenkins-job' });
        this.jenkinsJobError['jenkins-job'] = this.error;
        this.jobRunner.add(this.jenkinsJob);
      });

      describe('error', () => {
        it('includes the error text', async (done) => {
          await this.jobRunner.status()
            .catch((error) => {
              expect(error).toEqual(this.error);
              done();
            });
        });
      });
    });

    describe('adding a SUCCESS jenkins job and FAILURE jenkins job', () => {
      beforeEach(() => {
        this.jenkinsJob1 = new this.JenkinsJob({ name: 'jenkins-job1' });
        this.jenkinsJob2 = new this.JenkinsJob({ name: 'jenkins-job2' });
        this.jenkinsJobOutcome['jenkins-job1'] = 'SUCCESS';
        this.jenkinsJobOutcome['jenkins-job2'] = 'FAILURE';
        this.jobRunner.add(this.jenkinsJob1);
        this.jobRunner.add(this.jenkinsJob2);
      });

      describe('results', () => {
        it('returns an array with the jobs and status', async (done) => {
          const { results } = await this.jobRunner.status();
          expect(results).toContain({
            job: this.jenkinsJob1,
            status: 'SUCCESS',
          });
          expect(results).toContain({
            job: this.jenkinsJob2,
            status: 'FAILURE',
          });
          done();
        });
      });

      describe('success', () => {
        it('returns false', async (done) => {
          const { success } = await this.jobRunner.status();
          expect(success).toEqual(false);
          done();
        });
      });
    });
  });
});
