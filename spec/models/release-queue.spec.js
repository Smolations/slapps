const ReleaseQueue = require('../../models/release-queue');

const $ = {};

describe('ReleaseQueue', () => {
  it('can be created', () => {
    expect(new ReleaseQueue()).toEqual(jasmine.any(Object));
  });

  describe('#add(release)', () => {
    describe('with a release that includes a user', () => {
      it('adds the release to the queue', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        queue.add(release);
        expect(queue.all()).toContain(release);
      });

      it('returns true', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        expect(queue.add(release)).toEqual(true);
      });
    });

    describe('with a release that is missing a user', () => {
      it('does not add the release to the queue', () => {
        const queue = new ReleaseQueue();
        const release = { the: 'release' };

        queue.add(release);
        expect(queue.all()).toEqual([]);
      });

      it('returns false', () => {
        const queue = new ReleaseQueue();
        const release = { the: 'release' };

        expect(queue.add(release)).toEqual(false);
      });
    });

    describe('when a user tries to create a second release', () => {
      it('does not add the release to the queue', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        queue.add(release);
        queue.add(release);
        expect(queue.all()).toEqual([release]);
      });
    });
  });

  describe('#all', () => {
    it('returns nothing', () => {
      const queue = new ReleaseQueue();
      expect(queue.all()).toEqual([]);
    });

    describe('with multiple releases', () => {
      it('returns the releases in order', () => {
        const queue = new ReleaseQueue();
        const release1 = { user: 'user1' };
        const release2 = { user: 'user2' };
        const release3 = { user: 'user3' };

        queue.add(release1);
        queue.add(release2);
        queue.add(release3);

        expect(queue.all()[0]).toEqual(release1);
        expect(queue.all()[1]).toEqual(release2);
        expect(queue.all()[2]).toEqual(release3);
      });
    });
  });

  describe('#remove', () => {
    it('removes the release from the queue', () => {
      const queue = new ReleaseQueue();
      const release = { user: 'user' };

      queue.add(release);
      queue.remove(release);

      expect(queue.all()).toEqual([]);
    });

    it('does not remove other releases from the queue', () => {
      const queue = new ReleaseQueue();
      const release1 = { user: 'user1' };
      const release2 = { user: 'user2' };

      queue.add(release1);
      queue.add(release2);
      queue.remove(release1);

      expect(queue.all()).toContain(release2);
    });
  });

  describe('#isQueued(release)', () => {
    describe('with a queued release', () => {
      it('returns true', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        queue.add(release);

        expect(queue.isQueued(release)).toEqual(true);
      });
    });

    describe('without a queued release', () => {
      it('returns false', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        expect(queue.isQueued(release)).toEqual(false);
      });
    });
  });

  describe('#findByUser(user)', () => {
    describe('with an existing release', () => {
      it('returns the release', () => {
        const queue = new ReleaseQueue();
        const user = 'unique-user';
        const release = { user };

        queue.add(release);

        expect(queue.findByUser(user)).toEqual(release);
      });
    });

    describe('without an existing release', () => {
      it('returns null', () => {
        const queue = new ReleaseQueue();
        const user = 'unique-user';

        expect(queue.findByUser(user)).toEqual(null);
      });
    });

    describe('with a random user', () => {
      it('returns null', () => {
        const queue = new ReleaseQueue();
        const user1 = 'unique-user1';
        const user2 = 'unique-user2';
        const release = { user: user1 };

        queue.add(release);

        expect(queue.findByUser(user2)).toEqual(null);
      });
    });
  });

  describe('#isCurrent(release)', () => {
    describe('with a current release', () => {
      it('returns true', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        queue.add(release);

        expect(queue.isCurrent(release)).toEqual(true);
      });
    });

    describe('with a non-current release', () => {
      it('returns false', () => {
        const queue = new ReleaseQueue();
        const release1 = { user: 'user1' };
        const release2 = { user: 'user2' };

        queue.add(release1);
        queue.add(release2);

        expect(queue.isCurrent(release2)).toEqual(false);
      });
    });

    describe('with a missing release', () => {
      it('returns false', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        expect(queue.isCurrent(release)).toEqual(false);
      });
    });
  });

  describe('#getPosition(release)', () => {
    describe('without a release position', () => {
      it('returns null', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        expect(queue.getPosition(release)).toEqual(null);
      });
    });

    describe('with the first release', () => {
      it('returns 1', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        queue.add(release);

        expect(queue.getPosition(release)).toEqual(1);
      });
    });

    describe('with the second release', () => {
      it('returns 2', () => {
        const queue = new ReleaseQueue();
        const release1 = { user: 'user1' };
        const release2 = { user: 'user2' };

        queue.add(release1);
        queue.add(release2);

        expect(queue.getPosition(release2)).toEqual(2);
      });
    });
  });

  describe('#currentRelease', () => {
    describe('without a release', () => {
      it('returns undefined', () => {
        const queue = new ReleaseQueue();
        expect(queue.currentRelease()).toEqual(undefined);
      });
    });

    describe('with a release', () => {
      it('returns the release', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        queue.add(release);

        expect(queue.currentRelease()).toEqual(release);
      });
    });

    describe('with multiple releases', () => {
      it('returns the first release', () => {
        const queue = new ReleaseQueue();
        const release1 = { user: 'user1' };
        const release2 = { user: 'user2' };

        queue.add(release1);
        queue.add(release2);

        expect(queue.currentRelease()).toEqual(release1);
      });
    });
  });

  describe('#length', () => {
    describe('with no releases', () => {
      it('returns 0', () => {
        const queue = new ReleaseQueue();

        expect(queue.length()).toEqual(0);
      });
    });

    describe('with one release', () => {
      it('returns 1', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        queue.add(release);

        expect(queue.length()).toEqual(1);
      });
    });

    describe('with many releases', () => {
      it('returns 3', () => {
        const queue = new ReleaseQueue();
        const release1 = { user: 'user1' };
        const release2 = { user: 'user2' };
        const release3 = { user: 'user3' };

        queue.add(release1);
        queue.add(release2);
        queue.add(release3);

        expect(queue.length()).toEqual(3);
      });
    });
  });

  describe('#setPosition(release)', () => {
    describe('without a release in the queue', () => {
      it('returns false', () => {
        const queue = new ReleaseQueue();
        const release = { user: 'user' };

        expect(queue.setPosition(release)).toEqual(false);
      });
    });

    describe('with three releases in the queue', () => {
      beforeEach(() => {
        $.queue = new ReleaseQueue();
        $.release1 = { user: 'user1' };
        $.release2 = { user: 'user2' };
        $.release3 = { user: 'user3' };

        $.queue.add($.release1);
        $.queue.add($.release2);
        $.queue.add($.release3);
      });

      describe('moving the last release to the first position of the queue', () => {
        it('returns true', () => {
          expect($.queue.setPosition($.release3, 1)).toEqual(true);
        });

        it('moves the release', () => {
          $.queue.setPosition($.release3, 1);
          expect($.queue.getPosition($.release3)).toEqual(1);
        });
      });

      describe('moving the last release to the second position of the queue', () => {
        it('returns true', () => {
          expect($.queue.setPosition($.release3, 2)).toEqual(true);
        });

        it('moves the release', () => {
          $.queue.setPosition($.release3, 2);
          expect($.queue.getPosition($.release3)).toEqual(2);
        });
      });

      describe('moving the last release to the last position of the queue', () => {
        it('returns false', () => {
          expect($.queue.setPosition($.release3, 3)).toEqual(false);
        });

        it('keeps the release in the same position', () => {
          $.queue.setPosition($.release3, 3);
          expect($.queue.getPosition($.release3)).toEqual(3);
        });
      });

      describe('moving the first release to the second position of the queue', () => {
        it('returns true', () => {
          expect($.queue.setPosition($.release1, 2)).toEqual(true);
        });

        it('moves the release', () => {
          $.queue.setPosition($.release1, 2);
          expect($.queue.getPosition($.release1)).toEqual(2);
        });
      });
    });
  });
});
