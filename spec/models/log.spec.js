const PurgeableModule = require('../helpers/purgeable-module');
const moment = require('moment'); // https://github.com/moment/moment
const fs = require('fs');
const os = require('os');


describe('mixins: Logable', () => {
  beforeAll(() => {
    this.purgeableLogable = new PurgeableModule('Logable', 'mixins/logable');
  });

  beforeEach(() => {
    const Logable = this.purgeableLogable.require();

    // default config comes from ./config/test.json unless overridden
    this.Loged = (class extends Logable() {});
  });

  afterEach(() => {
    this.purgeableLogable.purge();
  });

  it('can be created', () => {
    expect(new this.Loged()).toEqual(jasmine.any(Object));
  });

  describe('#constructor', () => {
    describe('logPath', () => {
      it('can be assigned', () => {
        const logPath = os.tmpdir();
        const loged = new this.Loged({ logPath });
        expect(loged._log._path).toEqual(logPath);
      });

      it('is set to ./log by default', () => {
        const loged = new this.Loged();
        expect(loged._log._path).toEqual('./log');
      });
    });
  });

  // for some reason this messes up the test reporter
  xdescribe('#info(message)', () => {
    beforeEach(() => {
      this.log = new this.Loged({ env: 'test' });
      this.message = 'Log Message';
      this.today = moment().utc().format('YYYY-MM-DD');
      this.path = `./log/${this.today}.test.log`;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    describe('with the default log path', () => {
      afterEach(() => {
        fs.unlinkSync(this.path); // delete test log file
      });

      it('logs the message to a file', (done) => {
        this.log.info(this.message, () => {
          const logFile = fs.readFileSync(this.path, { encoding: 'UTF-8' });
          expect(logFile).toMatch(this.message);
          done();
        });
      });
    });
  });
});
