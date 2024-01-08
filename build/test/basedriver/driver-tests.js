"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("source-map-support/register");
var _lodash = _interopRequireDefault(require("lodash"));
var _chai = _interopRequireDefault(require("chai"));
var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));
var _bluebird = _interopRequireDefault(require("bluebird"));
var _2 = require("../..");
var _sinon = _interopRequireDefault(require("sinon"));
const should = _chai.default.should();
_chai.default.use(_chaiAsPromised.default);
function baseDriverUnitTests(DriverClass, defaultCaps = {}) {
  const w3cCaps = {
    alwaysMatch: Object.assign({}, defaultCaps, {
      platformName: 'Fake',
      deviceName: 'Commodore 64'
    }),
    firstMatch: [{}]
  };
  describe('BaseDriver', function () {
    let d;
    beforeEach(function () {
      d = new DriverClass();
    });
    afterEach(async function () {
      await d.deleteSession();
    });
    it('should return an empty status object', async function () {
      let status = await d.getStatus();
      status.should.eql({});
    });
    it('should return a sessionId from createSession', async function () {
      let [sessId] = await d.createSession(defaultCaps);
      should.exist(sessId);
      sessId.should.be.a('string');
      sessId.length.should.be.above(5);
    });
    it('should not be able to start two sessions without closing the first', async function () {
      await d.createSession(defaultCaps);
      await d.createSession(defaultCaps).should.eventually.be.rejectedWith('session');
    });
    it('should be able to delete a session', async function () {
      let sessionId1 = await d.createSession(defaultCaps);
      await d.deleteSession();
      should.equal(d.sessionId, null);
      let sessionId2 = await d.createSession(defaultCaps);
      sessionId1.should.not.eql(sessionId2);
    });
    it('should get the current session', async function () {
      let [, caps] = await d.createSession(defaultCaps);
      caps.should.equal(await d.getSession());
    });
    it('should return sessions if no session exists', async function () {
      let sessions = await d.getSessions();
      sessions.length.should.equal(0);
    });
    it('should return sessions', async function () {
      let caps = _lodash.default.clone(defaultCaps);
      caps.a = 'cap';
      await d.createSession(caps);
      let sessions = await d.getSessions();
      sessions.length.should.equal(1);
      sessions[0].should.eql({
        id: d.sessionId,
        capabilities: caps
      });
    });
    it('should fulfill an unexpected driver quit promise', async function () {
      d.getStatus = async function () {
        await _bluebird.default.delay(1000);
        return 'good status';
      }.bind(d);
      let cmdPromise = d.executeCommand('getStatus');
      await _bluebird.default.delay(10);
      const p = new _bluebird.default((resolve, reject) => {
        setTimeout(() => reject(new Error('onUnexpectedShutdown event is expected to be fired within 5 seconds timeout')), 5000);
        d.onUnexpectedShutdown(resolve);
      });
      d.startUnexpectedShutdown(new Error('We crashed'));
      await cmdPromise.should.be.rejectedWith(/We crashed/);
      await p;
    });
    it('should not allow commands in middle of unexpected shutdown', async function () {
      d.oldDeleteSession = d.deleteSession;
      d.deleteSession = async function () {
        await _bluebird.default.delay(100);
        await this.oldDeleteSession();
      }.bind(d);
      let caps = _lodash.default.clone(defaultCaps);
      await d.createSession(caps);
      const p = new _bluebird.default((resolve, reject) => {
        setTimeout(() => reject(new Error('onUnexpectedShutdown event is expected to be fired within 5 seconds timeout')), 5000);
        d.onUnexpectedShutdown(resolve);
      });
      d.startUnexpectedShutdown(new Error('We crashed'));
      await p;
      await d.executeCommand('getSession').should.be.rejectedWith(/shut down/);
    });
    it('should allow new commands after done shutting down', async function () {
      d.oldDeleteSession = d.deleteSession;
      d.deleteSession = async function () {
        await _bluebird.default.delay(100);
        await this.oldDeleteSession();
      }.bind(d);
      let caps = _lodash.default.clone(defaultCaps);
      await d.createSession(caps);
      const p = new _bluebird.default((resolve, reject) => {
        setTimeout(() => reject(new Error('onUnexpectedShutdown event is expected to be fired within 5 seconds timeout')), 5000);
        d.onUnexpectedShutdown(resolve);
      });
      d.startUnexpectedShutdown(new Error('We crashed'));
      await p;
      await d.executeCommand('getSession').should.be.rejectedWith(/shut down/);
      await _bluebird.default.delay(500);
      await d.executeCommand('createSession', caps);
      await d.deleteSession();
    });
    it('should distinguish between W3C and JSONWP session', async function () {
      await d.executeCommand('createSession', Object.assign({}, defaultCaps, {
        platformName: 'Fake',
        deviceName: 'Commodore 64'
      }));
      d.protocol.should.equal('MJSONWP');
      await d.executeCommand('deleteSession');
      await d.executeCommand('createSession', null, null, {
        alwaysMatch: Object.assign({}, defaultCaps, {
          platformName: 'Fake',
          deviceName: 'Commodore 64'
        }),
        firstMatch: [{}]
      });
      d.protocol.should.equal('W3C');
    });
    describe('protocol detection', function () {
      it('should use MJSONWP if only JSONWP caps are provided', async function () {
        await d.createSession(defaultCaps);
        d.protocol.should.equal('MJSONWP');
      });
      it('should use W3C if only W3C caps are provided', async function () {
        await d.createSession(null, null, {
          alwaysMatch: defaultCaps,
          firstMatch: [{}]
        });
        d.protocol.should.equal('W3C');
      });
    });
    it('should have a method to get driver for a session', async function () {
      let [sessId] = await d.createSession(defaultCaps);
      d.driverForSession(sessId).should.eql(d);
    });
    describe('command queue', function () {
      let d = new DriverClass();
      let waitMs = 10;
      d.getStatus = async function () {
        await _bluebird.default.delay(waitMs);
        return Date.now();
      }.bind(d);
      d.getSessions = async function () {
        await _bluebird.default.delay(waitMs);
        throw new Error('multipass');
      }.bind(d);
      afterEach(function () {
        d.clearNewCommandTimeout();
      });
      it('should queue commands and.executeCommand/respond in the order received', async function () {
        let numCmds = 10;
        let cmds = [];
        for (let i = 0; i < numCmds; i++) {
          cmds.push(d.executeCommand('getStatus'));
        }
        let results = await _bluebird.default.all(cmds);
        for (let i = 1; i < numCmds; i++) {
          if (results[i] <= results[i - 1]) {
            throw new Error('Got result out of order');
          }
        }
      });
      it('should handle errors correctly when queuing', async function () {
        let numCmds = 10;
        let cmds = [];
        for (let i = 0; i < numCmds; i++) {
          if (i === 5) {
            cmds.push(d.executeCommand('getSessions'));
          } else {
            cmds.push(d.executeCommand('getStatus'));
          }
        }
        let results = await _bluebird.default.settle(cmds);
        for (let i = 1; i < 5; i++) {
          if (results[i].value() <= results[i - 1].value()) {
            throw new Error('Got result out of order');
          }
        }
        results[5].reason().message.should.contain('multipass');
        for (let i = 7; i < numCmds; i++) {
          if (results[i].value() <= results[i - 1].value()) {
            throw new Error('Got result out of order');
          }
        }
      });
      it('should not care if queue empties for a bit', async function () {
        let numCmds = 10;
        let cmds = [];
        for (let i = 0; i < numCmds; i++) {
          cmds.push(d.executeCommand('getStatus'));
        }
        let results = await _bluebird.default.all(cmds);
        cmds = [];
        for (let i = 0; i < numCmds; i++) {
          cmds.push(d.executeCommand('getStatus'));
        }
        results = await _bluebird.default.all(cmds);
        for (let i = 1; i < numCmds; i++) {
          if (results[i] <= results[i - 1]) {
            throw new Error('Got result out of order');
          }
        }
      });
    });
    describe('timeouts', function () {
      before(async function () {
        await d.createSession(defaultCaps);
      });
      describe('command', function () {
        it('should exist by default', function () {
          d.newCommandTimeoutMs.should.equal(60000);
        });
        it('should be settable through `timeouts`', async function () {
          await d.timeouts('command', 20);
          d.newCommandTimeoutMs.should.equal(20);
        });
      });
      describe('implicit', function () {
        it('should not exist by default', function () {
          d.implicitWaitMs.should.equal(0);
        });
        it('should be settable through `timeouts`', async function () {
          await d.timeouts('implicit', 20);
          d.implicitWaitMs.should.equal(20);
        });
      });
    });
    describe('timeouts (W3C)', function () {
      beforeEach(async function () {
        await d.createSession(null, null, w3cCaps);
      });
      afterEach(async function () {
        await d.deleteSession();
      });
      it('should get timeouts that we set', async function () {
        await d.timeouts(undefined, undefined, undefined, undefined, 1000);
        await d.getTimeouts().should.eventually.have.property('implicit', 1000);
        await d.timeouts('command', 2000);
        await d.getTimeouts().should.eventually.deep.equal({
          implicit: 1000,
          command: 2000
        });
        await d.timeouts(undefined, undefined, undefined, undefined, 3000);
        await d.getTimeouts().should.eventually.deep.equal({
          implicit: 3000,
          command: 2000
        });
      });
    });
    describe('reset compatibility', function () {
      it('should not allow both fullReset and noReset to be true', async function () {
        let newCaps = Object.assign({}, defaultCaps, {
          fullReset: true,
          noReset: true
        });
        await d.createSession(newCaps).should.eventually.be.rejectedWith(/noReset.+fullReset/);
      });
    });
    describe('proxying', function () {
      let sessId;
      beforeEach(async function () {
        [sessId] = await d.createSession(defaultCaps);
      });
      describe('#proxyActive', function () {
        it('should exist', function () {
          d.proxyActive.should.be.an.instanceof(Function);
        });
        it('should return false', function () {
          d.proxyActive(sessId).should.be.false;
        });
        it('should throw an error when sessionId is wrong', function () {
          (() => {
            d.proxyActive('aaa');
          }).should.throw;
        });
      });
      describe('#getProxyAvoidList', function () {
        it('should exist', function () {
          d.getProxyAvoidList.should.be.an.instanceof(Function);
        });
        it('should return an array', function () {
          d.getProxyAvoidList(sessId).should.be.an.instanceof(Array);
        });
        it('should throw an error when sessionId is wrong', function () {
          (() => {
            d.getProxyAvoidList('aaa');
          }).should.throw;
        });
      });
      describe('#canProxy', function () {
        it('should have a #canProxy method', function () {
          d.canProxy.should.be.an.instanceof(Function);
        });
        it('should return false from #canProxy', function () {
          d.canProxy(sessId).should.be.false;
        });
        it('should throw an error when sessionId is wrong', function () {
          (() => {
            d.canProxy();
          }).should.throw;
        });
      });
      describe('#proxyRouteIsAvoided', function () {
        it('should validate form of avoidance list', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');
          avoidStub.returns([['POST', /\/foo/], ['GET']]);
          (() => {
            d.proxyRouteIsAvoided();
          }).should.throw;
          avoidStub.returns([['POST', /\/foo/], ['GET', /^foo/, 'bar']]);
          (() => {
            d.proxyRouteIsAvoided();
          }).should.throw;
          avoidStub.restore();
        });
        it('should reject bad http methods', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');
          avoidStub.returns([['POST', /^foo/], ['BAZETE', /^bar/]]);
          (() => {
            d.proxyRouteIsAvoided();
          }).should.throw;
          avoidStub.restore();
        });
        it('should reject non-regex routes', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');
          avoidStub.returns([['POST', /^foo/], ['GET', '/bar']]);
          (() => {
            d.proxyRouteIsAvoided();
          }).should.throw;
          avoidStub.restore();
        });
        it('should return true for routes in the avoid list', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');
          avoidStub.returns([['POST', /^\/foo/]]);
          d.proxyRouteIsAvoided(null, 'POST', '/foo/bar').should.be.true;
          avoidStub.restore();
        });
        it('should strip away any wd/hub prefix', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');
          avoidStub.returns([['POST', /^\/foo/]]);
          d.proxyRouteIsAvoided(null, 'POST', '/wd/hub/foo/bar').should.be.true;
          avoidStub.restore();
        });
        it('should return false for routes not in the avoid list', function () {
          const avoidStub = _sinon.default.stub(d, 'getProxyAvoidList');
          avoidStub.returns([['POST', /^\/foo/]]);
          d.proxyRouteIsAvoided(null, 'GET', '/foo/bar').should.be.false;
          d.proxyRouteIsAvoided(null, 'POST', '/boo').should.be.false;
          avoidStub.restore();
        });
      });
    });
    describe('event timing framework', function () {
      let beforeStartTime;
      beforeEach(async function () {
        beforeStartTime = Date.now();
        d.shouldValidateCaps = false;
        await d.executeCommand('createSession', defaultCaps);
      });
      describe('#eventHistory', function () {
        it('should have an eventHistory property', function () {
          should.exist(d.eventHistory);
          should.exist(d.eventHistory.commands);
        });
        it('should have a session start timing after session start', function () {
          let {
            newSessionRequested,
            newSessionStarted
          } = d.eventHistory;
          newSessionRequested.should.have.length(1);
          newSessionStarted.should.have.length(1);
          newSessionRequested[0].should.be.a('number');
          newSessionStarted[0].should.be.a('number');
          (newSessionRequested[0] >= beforeStartTime).should.be.true;
          (newSessionStarted[0] >= newSessionRequested[0]).should.be.true;
        });
        it('should include a commands list', async function () {
          await d.executeCommand('getStatus', []);
          d.eventHistory.commands.length.should.equal(2);
          d.eventHistory.commands[1].cmd.should.equal('getStatus');
          d.eventHistory.commands[1].startTime.should.be.a('number');
          d.eventHistory.commands[1].endTime.should.be.a('number');
        });
      });
      describe('#logEvent', function () {
        it('should allow logging arbitrary events', function () {
          d.logEvent('foo');
          d.eventHistory.foo[0].should.be.a('number');
          (d.eventHistory.foo[0] >= beforeStartTime).should.be.true;
        });
        it('should not allow reserved or oddly formed event names', function () {
          (() => {
            d.logEvent('commands');
          }).should.throw();
          (() => {
            d.logEvent(1);
          }).should.throw();
          (() => {
            d.logEvent({});
          }).should.throw();
        });
      });
      it('should allow logging the same event multiple times', function () {
        d.logEvent('bar');
        d.logEvent('bar');
        d.eventHistory.bar.should.have.length(2);
        d.eventHistory.bar[1].should.be.a('number');
        (d.eventHistory.bar[1] >= d.eventHistory.bar[0]).should.be.true;
      });
      describe('getSession decoration', function () {
        it('should decorate getSession response if opt-in cap is provided', async function () {
          let res = await d.getSession();
          should.not.exist(res.events);
          d.caps.eventTimings = true;
          res = await d.getSession();
          should.exist(res.events);
          should.exist(res.events.newSessionRequested);
          res.events.newSessionRequested[0].should.be.a('number');
        });
      });
    });
    describe('.reset', function () {
      it('should reset as W3C if the original session was W3C', async function () {
        const caps = {
          alwaysMatch: Object.assign({}, {
            app: 'Fake',
            deviceName: 'Fake',
            automationName: 'Fake',
            platformName: 'Fake'
          }, defaultCaps),
          firstMatch: [{}]
        };
        await d.createSession(undefined, undefined, caps);
        d.protocol.should.equal('W3C');
        await d.reset();
        d.protocol.should.equal('W3C');
      });
      it('should reset as MJSONWP if the original session was MJSONWP', async function () {
        const caps = Object.assign({}, {
          app: 'Fake',
          deviceName: 'Fake',
          automationName: 'Fake',
          platformName: 'Fake'
        }, defaultCaps);
        await d.createSession(caps);
        d.protocol.should.equal('MJSONWP');
        await d.reset();
        d.protocol.should.equal('MJSONWP');
      });
    });
  });
  describe('DeviceSettings', function () {
    it('should not hold on to reference of defaults in constructor', function () {
      let obj = {
        foo: 'bar'
      };
      let d1 = new _2.DeviceSettings(obj);
      let d2 = new _2.DeviceSettings(obj);
      d1._settings.foo = 'baz';
      d1._settings.should.not.eql(d2._settings);
    });
  });
  describe('.isFeatureEnabled', function () {
    const d = new DriverClass();
    afterEach(function () {
      d.denyInsecure = null;
      d.allowInsecure = null;
      d.relaxedSecurityEnabled = null;
    });
    it('should say a feature is enabled when it is explicitly allowed', function () {
      d.allowInsecure = ['foo', 'bar'];
      d.isFeatureEnabled('foo').should.be.true;
      d.isFeatureEnabled('bar').should.be.true;
      d.isFeatureEnabled('baz').should.be.false;
    });
    it('should say a feature is not enabled if it is not enabled', function () {
      d.allowInsecure = [];
      d.isFeatureEnabled('foo').should.be.false;
    });
    it('should prefer denyInsecure to allowInsecure', function () {
      d.allowInsecure = ['foo', 'bar'];
      d.denyInsecure = ['foo'];
      d.isFeatureEnabled('foo').should.be.false;
      d.isFeatureEnabled('bar').should.be.true;
      d.isFeatureEnabled('baz').should.be.false;
    });
    it('should allow global setting for insecurity', function () {
      d.relaxedSecurityEnabled = true;
      d.isFeatureEnabled('foo').should.be.true;
      d.isFeatureEnabled('bar').should.be.true;
      d.isFeatureEnabled('baz').should.be.true;
    });
    it('global setting should be overrideable', function () {
      d.relaxedSecurityEnabled = true;
      d.denyInsecure = ['foo', 'bar'];
      d.isFeatureEnabled('foo').should.be.false;
      d.isFeatureEnabled('bar').should.be.false;
      d.isFeatureEnabled('baz').should.be.true;
    });
  });
}
var _default = exports.default = baseDriverUnitTests;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC9iYXNlZHJpdmVyL2RyaXZlci10ZXN0cy5qcyIsIm5hbWVzIjpbIl9sb2Rhc2giLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9jaGFpIiwiX2NoYWlBc1Byb21pc2VkIiwiX2JsdWViaXJkIiwiXzIiLCJfc2lub24iLCJzaG91bGQiLCJjaGFpIiwidXNlIiwiY2hhaUFzUHJvbWlzZWQiLCJiYXNlRHJpdmVyVW5pdFRlc3RzIiwiRHJpdmVyQ2xhc3MiLCJkZWZhdWx0Q2FwcyIsInczY0NhcHMiLCJhbHdheXNNYXRjaCIsIk9iamVjdCIsImFzc2lnbiIsInBsYXRmb3JtTmFtZSIsImRldmljZU5hbWUiLCJmaXJzdE1hdGNoIiwiZGVzY3JpYmUiLCJkIiwiYmVmb3JlRWFjaCIsImFmdGVyRWFjaCIsImRlbGV0ZVNlc3Npb24iLCJpdCIsInN0YXR1cyIsImdldFN0YXR1cyIsImVxbCIsInNlc3NJZCIsImNyZWF0ZVNlc3Npb24iLCJleGlzdCIsImJlIiwiYSIsImxlbmd0aCIsImFib3ZlIiwiZXZlbnR1YWxseSIsInJlamVjdGVkV2l0aCIsInNlc3Npb25JZDEiLCJlcXVhbCIsInNlc3Npb25JZCIsInNlc3Npb25JZDIiLCJub3QiLCJjYXBzIiwiZ2V0U2Vzc2lvbiIsInNlc3Npb25zIiwiZ2V0U2Vzc2lvbnMiLCJfIiwiY2xvbmUiLCJpZCIsImNhcGFiaWxpdGllcyIsIkIiLCJkZWxheSIsImJpbmQiLCJjbWRQcm9taXNlIiwiZXhlY3V0ZUNvbW1hbmQiLCJwIiwicmVzb2x2ZSIsInJlamVjdCIsInNldFRpbWVvdXQiLCJFcnJvciIsIm9uVW5leHBlY3RlZFNodXRkb3duIiwic3RhcnRVbmV4cGVjdGVkU2h1dGRvd24iLCJvbGREZWxldGVTZXNzaW9uIiwicHJvdG9jb2wiLCJkcml2ZXJGb3JTZXNzaW9uIiwid2FpdE1zIiwiRGF0ZSIsIm5vdyIsImNsZWFyTmV3Q29tbWFuZFRpbWVvdXQiLCJudW1DbWRzIiwiY21kcyIsImkiLCJwdXNoIiwicmVzdWx0cyIsImFsbCIsInNldHRsZSIsInZhbHVlIiwicmVhc29uIiwibWVzc2FnZSIsImNvbnRhaW4iLCJiZWZvcmUiLCJuZXdDb21tYW5kVGltZW91dE1zIiwidGltZW91dHMiLCJpbXBsaWNpdFdhaXRNcyIsInVuZGVmaW5lZCIsImdldFRpbWVvdXRzIiwiaGF2ZSIsInByb3BlcnR5IiwiZGVlcCIsImltcGxpY2l0IiwiY29tbWFuZCIsIm5ld0NhcHMiLCJmdWxsUmVzZXQiLCJub1Jlc2V0IiwicHJveHlBY3RpdmUiLCJhbiIsImluc3RhbmNlb2YiLCJGdW5jdGlvbiIsImZhbHNlIiwidGhyb3ciLCJnZXRQcm94eUF2b2lkTGlzdCIsIkFycmF5IiwiY2FuUHJveHkiLCJhdm9pZFN0dWIiLCJzaW5vbiIsInN0dWIiLCJyZXR1cm5zIiwicHJveHlSb3V0ZUlzQXZvaWRlZCIsInJlc3RvcmUiLCJ0cnVlIiwiYmVmb3JlU3RhcnRUaW1lIiwic2hvdWxkVmFsaWRhdGVDYXBzIiwiZXZlbnRIaXN0b3J5IiwiY29tbWFuZHMiLCJuZXdTZXNzaW9uUmVxdWVzdGVkIiwibmV3U2Vzc2lvblN0YXJ0ZWQiLCJjbWQiLCJzdGFydFRpbWUiLCJlbmRUaW1lIiwibG9nRXZlbnQiLCJmb28iLCJiYXIiLCJyZXMiLCJldmVudHMiLCJldmVudFRpbWluZ3MiLCJhcHAiLCJhdXRvbWF0aW9uTmFtZSIsInJlc2V0Iiwib2JqIiwiZDEiLCJEZXZpY2VTZXR0aW5ncyIsImQyIiwiX3NldHRpbmdzIiwiZGVueUluc2VjdXJlIiwiYWxsb3dJbnNlY3VyZSIsInJlbGF4ZWRTZWN1cml0eUVuYWJsZWQiLCJpc0ZlYXR1cmVFbmFibGVkIiwiX2RlZmF1bHQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VSb290IjoiLi4vLi4vLi4iLCJzb3VyY2VzIjpbInRlc3QvYmFzZWRyaXZlci9kcml2ZXItdGVzdHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IEIgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgRGV2aWNlU2V0dGluZ3MgfSBmcm9tICcuLi8uLic7XG5pbXBvcnQgc2lub24gZnJvbSAnc2lub24nO1xuXG5cbmNvbnN0IHNob3VsZCA9IGNoYWkuc2hvdWxkKCk7XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cbi8vIHdyYXAgdGhlc2UgdGVzdHMgaW4gYSBmdW5jdGlvbiBzbyB3ZSBjYW4gZXhwb3J0IHRoZSB0ZXN0cyBhbmQgcmUtdXNlIHRoZW1cbi8vIGZvciBhY3R1YWwgZHJpdmVyIGltcGxlbWVudGF0aW9uc1xuZnVuY3Rpb24gYmFzZURyaXZlclVuaXRUZXN0cyAoRHJpdmVyQ2xhc3MsIGRlZmF1bHRDYXBzID0ge30pIHtcbiAgY29uc3QgdzNjQ2FwcyA9IHtcbiAgICBhbHdheXNNYXRjaDogT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdENhcHMsIHtcbiAgICAgIHBsYXRmb3JtTmFtZTogJ0Zha2UnLFxuICAgICAgZGV2aWNlTmFtZTogJ0NvbW1vZG9yZSA2NCcsXG4gICAgfSksXG4gICAgZmlyc3RNYXRjaDogW3t9XSxcbiAgfTtcblxuICBkZXNjcmliZSgnQmFzZURyaXZlcicsIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgZDtcbiAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIGQgPSBuZXcgRHJpdmVyQ2xhc3MoKTtcbiAgICB9KTtcbiAgICBhZnRlckVhY2goYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgZC5kZWxldGVTZXNzaW9uKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBhbiBlbXB0eSBzdGF0dXMgb2JqZWN0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHN0YXR1cyA9IGF3YWl0IGQuZ2V0U3RhdHVzKCk7XG4gICAgICBzdGF0dXMuc2hvdWxkLmVxbCh7fSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBhIHNlc3Npb25JZCBmcm9tIGNyZWF0ZVNlc3Npb24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgW3Nlc3NJZF0gPSBhd2FpdCBkLmNyZWF0ZVNlc3Npb24oZGVmYXVsdENhcHMpO1xuICAgICAgc2hvdWxkLmV4aXN0KHNlc3NJZCk7XG4gICAgICBzZXNzSWQuc2hvdWxkLmJlLmEoJ3N0cmluZycpO1xuICAgICAgc2Vzc0lkLmxlbmd0aC5zaG91bGQuYmUuYWJvdmUoNSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG5vdCBiZSBhYmxlIHRvIHN0YXJ0IHR3byBzZXNzaW9ucyB3aXRob3V0IGNsb3NpbmcgdGhlIGZpcnN0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGRlZmF1bHRDYXBzKTtcbiAgICAgIGF3YWl0IGQuY3JlYXRlU2Vzc2lvbihkZWZhdWx0Q2Fwcykuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKCdzZXNzaW9uJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGJlIGFibGUgdG8gZGVsZXRlIGEgc2Vzc2lvbicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBzZXNzaW9uSWQxID0gYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGRlZmF1bHRDYXBzKTtcbiAgICAgIGF3YWl0IGQuZGVsZXRlU2Vzc2lvbigpO1xuICAgICAgc2hvdWxkLmVxdWFsKGQuc2Vzc2lvbklkLCBudWxsKTtcbiAgICAgIGxldCBzZXNzaW9uSWQyID0gYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGRlZmF1bHRDYXBzKTtcbiAgICAgIHNlc3Npb25JZDEuc2hvdWxkLm5vdC5lcWwoc2Vzc2lvbklkMik7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGdldCB0aGUgY3VycmVudCBzZXNzaW9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IFssIGNhcHNdID0gYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGRlZmF1bHRDYXBzKTtcbiAgICAgIGNhcHMuc2hvdWxkLmVxdWFsKGF3YWl0IGQuZ2V0U2Vzc2lvbigpKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHNlc3Npb25zIGlmIG5vIHNlc3Npb24gZXhpc3RzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHNlc3Npb25zID0gYXdhaXQgZC5nZXRTZXNzaW9ucygpO1xuICAgICAgc2Vzc2lvbnMubGVuZ3RoLnNob3VsZC5lcXVhbCgwKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHNlc3Npb25zJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGNhcHMgPSBfLmNsb25lKGRlZmF1bHRDYXBzKTtcbiAgICAgIGNhcHMuYSA9ICdjYXAnO1xuICAgICAgYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGNhcHMpO1xuICAgICAgbGV0IHNlc3Npb25zID0gYXdhaXQgZC5nZXRTZXNzaW9ucygpO1xuXG4gICAgICBzZXNzaW9ucy5sZW5ndGguc2hvdWxkLmVxdWFsKDEpO1xuICAgICAgc2Vzc2lvbnNbMF0uc2hvdWxkLmVxbCh7XG4gICAgICAgIGlkOiBkLnNlc3Npb25JZCxcbiAgICAgICAgY2FwYWJpbGl0aWVzOiBjYXBzXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZnVsZmlsbCBhbiB1bmV4cGVjdGVkIGRyaXZlciBxdWl0IHByb21pc2UnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBtYWtlIGEgY29tbWFuZCB0aGF0IHdpbGwgd2FpdCBhIGJpdCBzbyB3ZSBjYW4gY3Jhc2ggd2hpbGUgaXQncyBydW5uaW5nXG4gICAgICBkLmdldFN0YXR1cyA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgQi5kZWxheSgxMDAwKTtcbiAgICAgICAgcmV0dXJuICdnb29kIHN0YXR1cyc7XG4gICAgICB9LmJpbmQoZCk7XG4gICAgICBsZXQgY21kUHJvbWlzZSA9IGQuZXhlY3V0ZUNvbW1hbmQoJ2dldFN0YXR1cycpO1xuICAgICAgYXdhaXQgQi5kZWxheSgxMCk7XG4gICAgICBjb25zdCBwID0gbmV3IEIoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoJ29uVW5leHBlY3RlZFNodXRkb3duIGV2ZW50IGlzIGV4cGVjdGVkIHRvIGJlIGZpcmVkIHdpdGhpbiA1IHNlY29uZHMgdGltZW91dCcpKSwgNTAwMCk7XG4gICAgICAgIGQub25VbmV4cGVjdGVkU2h1dGRvd24ocmVzb2x2ZSk7XG4gICAgICB9KTtcbiAgICAgIGQuc3RhcnRVbmV4cGVjdGVkU2h1dGRvd24obmV3IEVycm9yKCdXZSBjcmFzaGVkJykpO1xuICAgICAgYXdhaXQgY21kUHJvbWlzZS5zaG91bGQuYmUucmVqZWN0ZWRXaXRoKC9XZSBjcmFzaGVkLyk7XG4gICAgICBhd2FpdCBwO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgY29tbWFuZHMgaW4gbWlkZGxlIG9mIHVuZXhwZWN0ZWQgc2h1dGRvd24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBtYWtlIGEgY29tbWFuZCB0aGF0IHdpbGwgd2FpdCBhIGJpdCBzbyB3ZSBjYW4gY3Jhc2ggd2hpbGUgaXQncyBydW5uaW5nXG4gICAgICBkLm9sZERlbGV0ZVNlc3Npb24gPSBkLmRlbGV0ZVNlc3Npb247XG4gICAgICBkLmRlbGV0ZVNlc3Npb24gPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IEIuZGVsYXkoMTAwKTtcbiAgICAgICAgYXdhaXQgdGhpcy5vbGREZWxldGVTZXNzaW9uKCk7XG4gICAgICB9LmJpbmQoZCk7XG4gICAgICBsZXQgY2FwcyA9IF8uY2xvbmUoZGVmYXVsdENhcHMpO1xuICAgICAgYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGNhcHMpO1xuICAgICAgY29uc3QgcCA9IG5ldyBCKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKCdvblVuZXhwZWN0ZWRTaHV0ZG93biBldmVudCBpcyBleHBlY3RlZCB0byBiZSBmaXJlZCB3aXRoaW4gNSBzZWNvbmRzIHRpbWVvdXQnKSksIDUwMDApO1xuICAgICAgICBkLm9uVW5leHBlY3RlZFNodXRkb3duKHJlc29sdmUpO1xuICAgICAgfSk7XG4gICAgICBkLnN0YXJ0VW5leHBlY3RlZFNodXRkb3duKG5ldyBFcnJvcignV2UgY3Jhc2hlZCcpKTtcbiAgICAgIGF3YWl0IHA7XG4gICAgICBhd2FpdCBkLmV4ZWN1dGVDb21tYW5kKCdnZXRTZXNzaW9uJykuc2hvdWxkLmJlLnJlamVjdGVkV2l0aCgvc2h1dCBkb3duLyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IG5ldyBjb21tYW5kcyBhZnRlciBkb25lIHNodXR0aW5nIGRvd24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBtYWtlIGEgY29tbWFuZCB0aGF0IHdpbGwgd2FpdCBhIGJpdCBzbyB3ZSBjYW4gY3Jhc2ggd2hpbGUgaXQncyBydW5uaW5nXG4gICAgICBkLm9sZERlbGV0ZVNlc3Npb24gPSBkLmRlbGV0ZVNlc3Npb247XG4gICAgICBkLmRlbGV0ZVNlc3Npb24gPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IEIuZGVsYXkoMTAwKTtcbiAgICAgICAgYXdhaXQgdGhpcy5vbGREZWxldGVTZXNzaW9uKCk7XG4gICAgICB9LmJpbmQoZCk7XG5cbiAgICAgIGxldCBjYXBzID0gXy5jbG9uZShkZWZhdWx0Q2Fwcyk7XG4gICAgICBhd2FpdCBkLmNyZWF0ZVNlc3Npb24oY2Fwcyk7XG4gICAgICBjb25zdCBwID0gbmV3IEIoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoJ29uVW5leHBlY3RlZFNodXRkb3duIGV2ZW50IGlzIGV4cGVjdGVkIHRvIGJlIGZpcmVkIHdpdGhpbiA1IHNlY29uZHMgdGltZW91dCcpKSwgNTAwMCk7XG4gICAgICAgIGQub25VbmV4cGVjdGVkU2h1dGRvd24ocmVzb2x2ZSk7XG4gICAgICB9KTtcbiAgICAgIGQuc3RhcnRVbmV4cGVjdGVkU2h1dGRvd24obmV3IEVycm9yKCdXZSBjcmFzaGVkJykpO1xuICAgICAgYXdhaXQgcDtcblxuICAgICAgYXdhaXQgZC5leGVjdXRlQ29tbWFuZCgnZ2V0U2Vzc2lvbicpLnNob3VsZC5iZS5yZWplY3RlZFdpdGgoL3NodXQgZG93bi8pO1xuICAgICAgYXdhaXQgQi5kZWxheSg1MDApO1xuXG4gICAgICBhd2FpdCBkLmV4ZWN1dGVDb21tYW5kKCdjcmVhdGVTZXNzaW9uJywgY2Fwcyk7XG4gICAgICBhd2FpdCBkLmRlbGV0ZVNlc3Npb24oKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZGlzdGluZ3Vpc2ggYmV0d2VlbiBXM0MgYW5kIEpTT05XUCBzZXNzaW9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgLy8gVGVzdCBKU09OV1BcbiAgICAgIGF3YWl0IGQuZXhlY3V0ZUNvbW1hbmQoJ2NyZWF0ZVNlc3Npb24nLCBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0Q2Fwcywge1xuICAgICAgICBwbGF0Zm9ybU5hbWU6ICdGYWtlJyxcbiAgICAgICAgZGV2aWNlTmFtZTogJ0NvbW1vZG9yZSA2NCcsXG4gICAgICB9KSk7XG5cbiAgICAgIGQucHJvdG9jb2wuc2hvdWxkLmVxdWFsKCdNSlNPTldQJyk7XG4gICAgICBhd2FpdCBkLmV4ZWN1dGVDb21tYW5kKCdkZWxldGVTZXNzaW9uJyk7XG5cbiAgICAgIC8vIFRlc3QgVzNDIChsZWF2ZSBmaXJzdCAyIGFyZ3MgbnVsbCBiZWNhdXNlIHRob3NlIGFyZSB0aGUgSlNPTldQIGFyZ3MpXG4gICAgICBhd2FpdCBkLmV4ZWN1dGVDb21tYW5kKCdjcmVhdGVTZXNzaW9uJywgbnVsbCwgbnVsbCwge1xuICAgICAgICBhbHdheXNNYXRjaDogT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdENhcHMsIHtcbiAgICAgICAgICBwbGF0Zm9ybU5hbWU6ICdGYWtlJyxcbiAgICAgICAgICBkZXZpY2VOYW1lOiAnQ29tbW9kb3JlIDY0JyxcbiAgICAgICAgfSksXG4gICAgICAgIGZpcnN0TWF0Y2g6IFt7fV0sXG4gICAgICB9KTtcblxuICAgICAgZC5wcm90b2NvbC5zaG91bGQuZXF1YWwoJ1czQycpO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3Byb3RvY29sIGRldGVjdGlvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgdXNlIE1KU09OV1AgaWYgb25seSBKU09OV1AgY2FwcyBhcmUgcHJvdmlkZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IGQuY3JlYXRlU2Vzc2lvbihkZWZhdWx0Q2Fwcyk7XG4gICAgICAgIGQucHJvdG9jb2wuc2hvdWxkLmVxdWFsKCdNSlNPTldQJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCB1c2UgVzNDIGlmIG9ubHkgVzNDIGNhcHMgYXJlIHByb3ZpZGVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBkLmNyZWF0ZVNlc3Npb24obnVsbCwgbnVsbCwge2Fsd2F5c01hdGNoOiBkZWZhdWx0Q2FwcywgZmlyc3RNYXRjaDogW3t9XX0pO1xuICAgICAgICBkLnByb3RvY29sLnNob3VsZC5lcXVhbCgnVzNDJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGF2ZSBhIG1ldGhvZCB0byBnZXQgZHJpdmVyIGZvciBhIHNlc3Npb24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgW3Nlc3NJZF0gPSBhd2FpdCBkLmNyZWF0ZVNlc3Npb24oZGVmYXVsdENhcHMpO1xuICAgICAgZC5kcml2ZXJGb3JTZXNzaW9uKHNlc3NJZCkuc2hvdWxkLmVxbChkKTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdjb21tYW5kIHF1ZXVlJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGQgPSBuZXcgRHJpdmVyQ2xhc3MoKTtcblxuICAgICAgbGV0IHdhaXRNcyA9IDEwO1xuICAgICAgZC5nZXRTdGF0dXMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IEIuZGVsYXkod2FpdE1zKTtcbiAgICAgICAgcmV0dXJuIERhdGUubm93KCk7XG4gICAgICB9LmJpbmQoZCk7XG5cbiAgICAgIGQuZ2V0U2Vzc2lvbnMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IEIuZGVsYXkod2FpdE1zKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtdWx0aXBhc3MnKTtcbiAgICAgIH0uYmluZChkKTtcblxuICAgICAgYWZ0ZXJFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZC5jbGVhck5ld0NvbW1hbmRUaW1lb3V0KCk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBxdWV1ZSBjb21tYW5kcyBhbmQuZXhlY3V0ZUNvbW1hbmQvcmVzcG9uZCBpbiB0aGUgb3JkZXIgcmVjZWl2ZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBudW1DbWRzID0gMTA7XG4gICAgICAgIGxldCBjbWRzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtQ21kczsgaSsrKSB7XG4gICAgICAgICAgY21kcy5wdXNoKGQuZXhlY3V0ZUNvbW1hbmQoJ2dldFN0YXR1cycpKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzdWx0cyA9IGF3YWl0IEIuYWxsKGNtZHMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IG51bUNtZHM7IGkrKykge1xuICAgICAgICAgIGlmIChyZXN1bHRzW2ldIDw9IHJlc3VsdHNbaSAtIDFdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dvdCByZXN1bHQgb3V0IG9mIG9yZGVyJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBoYW5kbGUgZXJyb3JzIGNvcnJlY3RseSB3aGVuIHF1ZXVpbmcnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBudW1DbWRzID0gMTA7XG4gICAgICAgIGxldCBjbWRzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtQ21kczsgaSsrKSB7XG4gICAgICAgICAgaWYgKGkgPT09IDUpIHtcbiAgICAgICAgICAgIGNtZHMucHVzaChkLmV4ZWN1dGVDb21tYW5kKCdnZXRTZXNzaW9ucycpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY21kcy5wdXNoKGQuZXhlY3V0ZUNvbW1hbmQoJ2dldFN0YXR1cycpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3VsdHMgPSBhd2FpdCBCLnNldHRsZShjbWRzKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCA1OyBpKyspIHtcbiAgICAgICAgICBpZiAocmVzdWx0c1tpXS52YWx1ZSgpIDw9IHJlc3VsdHNbaSAtIDFdLnZhbHVlKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR290IHJlc3VsdCBvdXQgb2Ygb3JkZXInKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0c1s1XS5yZWFzb24oKS5tZXNzYWdlLnNob3VsZC5jb250YWluKCdtdWx0aXBhc3MnKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDc7IGkgPCBudW1DbWRzOyBpKyspIHtcbiAgICAgICAgICBpZiAocmVzdWx0c1tpXS52YWx1ZSgpIDw9IHJlc3VsdHNbaSAtIDFdLnZhbHVlKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR290IHJlc3VsdCBvdXQgb2Ygb3JkZXInKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIG5vdCBjYXJlIGlmIHF1ZXVlIGVtcHRpZXMgZm9yIGEgYml0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgbnVtQ21kcyA9IDEwO1xuICAgICAgICBsZXQgY21kcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUNtZHM7IGkrKykge1xuICAgICAgICAgIGNtZHMucHVzaChkLmV4ZWN1dGVDb21tYW5kKCdnZXRTdGF0dXMnKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3VsdHMgPSBhd2FpdCBCLmFsbChjbWRzKTtcbiAgICAgICAgY21kcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUNtZHM7IGkrKykge1xuICAgICAgICAgIGNtZHMucHVzaChkLmV4ZWN1dGVDb21tYW5kKCdnZXRTdGF0dXMnKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0cyA9IGF3YWl0IEIuYWxsKGNtZHMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IG51bUNtZHM7IGkrKykge1xuICAgICAgICAgIGlmIChyZXN1bHRzW2ldIDw9IHJlc3VsdHNbaSAtIDFdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dvdCByZXN1bHQgb3V0IG9mIG9yZGVyJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCd0aW1lb3V0cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGJlZm9yZShhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IGQuY3JlYXRlU2Vzc2lvbihkZWZhdWx0Q2Fwcyk7XG4gICAgICB9KTtcbiAgICAgIGRlc2NyaWJlKCdjb21tYW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIGV4aXN0IGJ5IGRlZmF1bHQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZC5uZXdDb21tYW5kVGltZW91dE1zLnNob3VsZC5lcXVhbCg2MDAwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIGJlIHNldHRhYmxlIHRocm91Z2ggYHRpbWVvdXRzYCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBhd2FpdCBkLnRpbWVvdXRzKCdjb21tYW5kJywgMjApO1xuICAgICAgICAgIGQubmV3Q29tbWFuZFRpbWVvdXRNcy5zaG91bGQuZXF1YWwoMjApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgZGVzY3JpYmUoJ2ltcGxpY2l0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIG5vdCBleGlzdCBieSBkZWZhdWx0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGQuaW1wbGljaXRXYWl0TXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBiZSBzZXR0YWJsZSB0aHJvdWdoIGB0aW1lb3V0c2AnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXdhaXQgZC50aW1lb3V0cygnaW1wbGljaXQnLCAyMCk7XG4gICAgICAgICAgZC5pbXBsaWNpdFdhaXRNcy5zaG91bGQuZXF1YWwoMjApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3RpbWVvdXRzIChXM0MpJywgZnVuY3Rpb24gKCkge1xuICAgICAgYmVmb3JlRWFjaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IGQuY3JlYXRlU2Vzc2lvbihudWxsLCBudWxsLCB3M2NDYXBzKTtcbiAgICAgIH0pO1xuICAgICAgYWZ0ZXJFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgZC5kZWxldGVTZXNzaW9uKCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgZ2V0IHRpbWVvdXRzIHRoYXQgd2Ugc2V0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBkLnRpbWVvdXRzKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgMTAwMCk7XG4gICAgICAgIGF3YWl0IGQuZ2V0VGltZW91dHMoKS5zaG91bGQuZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCdpbXBsaWNpdCcsIDEwMDApO1xuICAgICAgICBhd2FpdCBkLnRpbWVvdXRzKCdjb21tYW5kJywgMjAwMCk7XG4gICAgICAgIGF3YWl0IGQuZ2V0VGltZW91dHMoKS5zaG91bGQuZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICBpbXBsaWNpdDogMTAwMCxcbiAgICAgICAgICBjb21tYW5kOiAyMDAwLFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgZC50aW1lb3V0cyh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIDMwMDApO1xuICAgICAgICBhd2FpdCBkLmdldFRpbWVvdXRzKCkuc2hvdWxkLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgaW1wbGljaXQ6IDMwMDAsXG4gICAgICAgICAgY29tbWFuZDogMjAwMCxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdyZXNldCBjb21wYXRpYmlsaXR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgYm90aCBmdWxsUmVzZXQgYW5kIG5vUmVzZXQgdG8gYmUgdHJ1ZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IG5ld0NhcHMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0Q2Fwcywge1xuICAgICAgICAgIGZ1bGxSZXNldDogdHJ1ZSxcbiAgICAgICAgICBub1Jlc2V0OiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBkLmNyZWF0ZVNlc3Npb24obmV3Q2Fwcykuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKFxuICAgICAgICAgICAgL25vUmVzZXQuK2Z1bGxSZXNldC8pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgncHJveHlpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgc2Vzc0lkO1xuICAgICAgYmVmb3JlRWFjaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFtzZXNzSWRdID0gYXdhaXQgZC5jcmVhdGVTZXNzaW9uKGRlZmF1bHRDYXBzKTtcbiAgICAgIH0pO1xuICAgICAgZGVzY3JpYmUoJyNwcm94eUFjdGl2ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBleGlzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkLnByb3h5QWN0aXZlLnNob3VsZC5iZS5hbi5pbnN0YW5jZW9mKEZ1bmN0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgcmV0dXJuIGZhbHNlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGQucHJveHlBY3RpdmUoc2Vzc0lkKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIHdoZW4gc2Vzc2lvbklkIGlzIHdyb25nJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7IGQucHJveHlBY3RpdmUoJ2FhYScpOyB9KS5zaG91bGQudGhyb3c7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGRlc2NyaWJlKCcjZ2V0UHJveHlBdm9pZExpc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgZXhpc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZC5nZXRQcm94eUF2b2lkTGlzdC5zaG91bGQuYmUuYW4uaW5zdGFuY2VvZihGdW5jdGlvbik7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHJldHVybiBhbiBhcnJheScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkLmdldFByb3h5QXZvaWRMaXN0KHNlc3NJZCkuc2hvdWxkLmJlLmFuLmluc3RhbmNlb2YoQXJyYXkpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciB3aGVuIHNlc3Npb25JZCBpcyB3cm9uZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4geyBkLmdldFByb3h5QXZvaWRMaXN0KCdhYWEnKTsgfSkuc2hvdWxkLnRocm93O1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgnI2NhblByb3h5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIGhhdmUgYSAjY2FuUHJveHkgbWV0aG9kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGQuY2FuUHJveHkuc2hvdWxkLmJlLmFuLmluc3RhbmNlb2YoRnVuY3Rpb24pO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gZmFsc2UgZnJvbSAjY2FuUHJveHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZC5jYW5Qcm94eShzZXNzSWQpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3Igd2hlbiBzZXNzaW9uSWQgaXMgd3JvbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgKCgpID0+IHsgZC5jYW5Qcm94eSgpOyB9KS5zaG91bGQudGhyb3c7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGRlc2NyaWJlKCcjcHJveHlSb3V0ZUlzQXZvaWRlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBmb3JtIG9mIGF2b2lkYW5jZSBsaXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnN0IGF2b2lkU3R1YiA9IHNpbm9uLnN0dWIoZCwgJ2dldFByb3h5QXZvaWRMaXN0Jyk7XG4gICAgICAgICAgYXZvaWRTdHViLnJldHVybnMoW1snUE9TVCcsIC9cXC9mb28vXSwgWydHRVQnXV0pO1xuICAgICAgICAgICgoKSA9PiB7IGQucHJveHlSb3V0ZUlzQXZvaWRlZCgpOyB9KS5zaG91bGQudGhyb3c7XG4gICAgICAgICAgYXZvaWRTdHViLnJldHVybnMoW1snUE9TVCcsIC9cXC9mb28vXSwgWydHRVQnLCAvXmZvby8sICdiYXInXV0pO1xuICAgICAgICAgICgoKSA9PiB7IGQucHJveHlSb3V0ZUlzQXZvaWRlZCgpOyB9KS5zaG91bGQudGhyb3c7XG4gICAgICAgICAgYXZvaWRTdHViLnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgcmVqZWN0IGJhZCBodHRwIG1ldGhvZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc3QgYXZvaWRTdHViID0gc2lub24uc3R1YihkLCAnZ2V0UHJveHlBdm9pZExpc3QnKTtcbiAgICAgICAgICBhdm9pZFN0dWIucmV0dXJucyhbWydQT1NUJywgL15mb28vXSwgWydCQVpFVEUnLCAvXmJhci9dXSk7XG4gICAgICAgICAgKCgpID0+IHsgZC5wcm94eVJvdXRlSXNBdm9pZGVkKCk7IH0pLnNob3VsZC50aHJvdztcbiAgICAgICAgICBhdm9pZFN0dWIucmVzdG9yZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCByZWplY3Qgbm9uLXJlZ2V4IHJvdXRlcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdCBhdm9pZFN0dWIgPSBzaW5vbi5zdHViKGQsICdnZXRQcm94eUF2b2lkTGlzdCcpO1xuICAgICAgICAgIGF2b2lkU3R1Yi5yZXR1cm5zKFtbJ1BPU1QnLCAvXmZvby9dLCBbJ0dFVCcsICcvYmFyJ11dKTtcbiAgICAgICAgICAoKCkgPT4geyBkLnByb3h5Um91dGVJc0F2b2lkZWQoKTsgfSkuc2hvdWxkLnRocm93O1xuICAgICAgICAgIGF2b2lkU3R1Yi5yZXN0b3JlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHJldHVybiB0cnVlIGZvciByb3V0ZXMgaW4gdGhlIGF2b2lkIGxpc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc3QgYXZvaWRTdHViID0gc2lub24uc3R1YihkLCAnZ2V0UHJveHlBdm9pZExpc3QnKTtcbiAgICAgICAgICBhdm9pZFN0dWIucmV0dXJucyhbWydQT1NUJywgL15cXC9mb28vXV0pO1xuICAgICAgICAgIGQucHJveHlSb3V0ZUlzQXZvaWRlZChudWxsLCAnUE9TVCcsICcvZm9vL2JhcicpLnNob3VsZC5iZS50cnVlO1xuICAgICAgICAgIGF2b2lkU3R1Yi5yZXN0b3JlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHN0cmlwIGF3YXkgYW55IHdkL2h1YiBwcmVmaXgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc3QgYXZvaWRTdHViID0gc2lub24uc3R1YihkLCAnZ2V0UHJveHlBdm9pZExpc3QnKTtcbiAgICAgICAgICBhdm9pZFN0dWIucmV0dXJucyhbWydQT1NUJywgL15cXC9mb28vXV0pO1xuICAgICAgICAgIGQucHJveHlSb3V0ZUlzQXZvaWRlZChudWxsLCAnUE9TVCcsICcvd2QvaHViL2Zvby9iYXInKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgICAgICBhdm9pZFN0dWIucmVzdG9yZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gZmFsc2UgZm9yIHJvdXRlcyBub3QgaW4gdGhlIGF2b2lkIGxpc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc3QgYXZvaWRTdHViID0gc2lub24uc3R1YihkLCAnZ2V0UHJveHlBdm9pZExpc3QnKTtcbiAgICAgICAgICBhdm9pZFN0dWIucmV0dXJucyhbWydQT1NUJywgL15cXC9mb28vXV0pO1xuICAgICAgICAgIGQucHJveHlSb3V0ZUlzQXZvaWRlZChudWxsLCAnR0VUJywgJy9mb28vYmFyJykuc2hvdWxkLmJlLmZhbHNlO1xuICAgICAgICAgIGQucHJveHlSb3V0ZUlzQXZvaWRlZChudWxsLCAnUE9TVCcsICcvYm9vJykuc2hvdWxkLmJlLmZhbHNlO1xuICAgICAgICAgIGF2b2lkU3R1Yi5yZXN0b3JlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnZXZlbnQgdGltaW5nIGZyYW1ld29yaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBiZWZvcmVTdGFydFRpbWU7XG4gICAgICBiZWZvcmVFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYmVmb3JlU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgZC5zaG91bGRWYWxpZGF0ZUNhcHMgPSBmYWxzZTtcbiAgICAgICAgYXdhaXQgZC5leGVjdXRlQ29tbWFuZCgnY3JlYXRlU2Vzc2lvbicsIGRlZmF1bHRDYXBzKTtcbiAgICAgIH0pO1xuICAgICAgZGVzY3JpYmUoJyNldmVudEhpc3RvcnknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgaGF2ZSBhbiBldmVudEhpc3RvcnkgcHJvcGVydHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc2hvdWxkLmV4aXN0KGQuZXZlbnRIaXN0b3J5KTtcbiAgICAgICAgICBzaG91bGQuZXhpc3QoZC5ldmVudEhpc3RvcnkuY29tbWFuZHMpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIGhhdmUgYSBzZXNzaW9uIHN0YXJ0IHRpbWluZyBhZnRlciBzZXNzaW9uIHN0YXJ0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGxldCB7bmV3U2Vzc2lvblJlcXVlc3RlZCwgbmV3U2Vzc2lvblN0YXJ0ZWR9ID0gZC5ldmVudEhpc3Rvcnk7XG4gICAgICAgICAgbmV3U2Vzc2lvblJlcXVlc3RlZC5zaG91bGQuaGF2ZS5sZW5ndGgoMSk7XG4gICAgICAgICAgbmV3U2Vzc2lvblN0YXJ0ZWQuc2hvdWxkLmhhdmUubGVuZ3RoKDEpO1xuICAgICAgICAgIG5ld1Nlc3Npb25SZXF1ZXN0ZWRbMF0uc2hvdWxkLmJlLmEoJ251bWJlcicpO1xuICAgICAgICAgIG5ld1Nlc3Npb25TdGFydGVkWzBdLnNob3VsZC5iZS5hKCdudW1iZXInKTtcbiAgICAgICAgICAobmV3U2Vzc2lvblJlcXVlc3RlZFswXSA+PSBiZWZvcmVTdGFydFRpbWUpLnNob3VsZC5iZS50cnVlO1xuICAgICAgICAgIChuZXdTZXNzaW9uU3RhcnRlZFswXSA+PSBuZXdTZXNzaW9uUmVxdWVzdGVkWzBdKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBpbmNsdWRlIGEgY29tbWFuZHMgbGlzdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBhd2FpdCBkLmV4ZWN1dGVDb21tYW5kKCdnZXRTdGF0dXMnLCBbXSk7XG4gICAgICAgICAgZC5ldmVudEhpc3RvcnkuY29tbWFuZHMubGVuZ3RoLnNob3VsZC5lcXVhbCgyKTtcbiAgICAgICAgICBkLmV2ZW50SGlzdG9yeS5jb21tYW5kc1sxXS5jbWQuc2hvdWxkLmVxdWFsKCdnZXRTdGF0dXMnKTtcbiAgICAgICAgICBkLmV2ZW50SGlzdG9yeS5jb21tYW5kc1sxXS5zdGFydFRpbWUuc2hvdWxkLmJlLmEoJ251bWJlcicpO1xuICAgICAgICAgIGQuZXZlbnRIaXN0b3J5LmNvbW1hbmRzWzFdLmVuZFRpbWUuc2hvdWxkLmJlLmEoJ251bWJlcicpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgZGVzY3JpYmUoJyNsb2dFdmVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBsb2dnaW5nIGFyYml0cmFyeSBldmVudHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZC5sb2dFdmVudCgnZm9vJyk7XG4gICAgICAgICAgZC5ldmVudEhpc3RvcnkuZm9vWzBdLnNob3VsZC5iZS5hKCdudW1iZXInKTtcbiAgICAgICAgICAoZC5ldmVudEhpc3RvcnkuZm9vWzBdID49IGJlZm9yZVN0YXJ0VGltZSkuc2hvdWxkLmJlLnRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIG5vdCBhbGxvdyByZXNlcnZlZCBvciBvZGRseSBmb3JtZWQgZXZlbnQgbmFtZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgIGQubG9nRXZlbnQoJ2NvbW1hbmRzJyk7XG4gICAgICAgICAgfSkuc2hvdWxkLnRocm93KCk7XG4gICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgIGQubG9nRXZlbnQoMSk7XG4gICAgICAgICAgfSkuc2hvdWxkLnRocm93KCk7XG4gICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgIGQubG9nRXZlbnQoe30pO1xuICAgICAgICAgIH0pLnNob3VsZC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBsb2dnaW5nIHRoZSBzYW1lIGV2ZW50IG11bHRpcGxlIHRpbWVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBkLmxvZ0V2ZW50KCdiYXInKTtcbiAgICAgICAgZC5sb2dFdmVudCgnYmFyJyk7XG4gICAgICAgIGQuZXZlbnRIaXN0b3J5LmJhci5zaG91bGQuaGF2ZS5sZW5ndGgoMik7XG4gICAgICAgIGQuZXZlbnRIaXN0b3J5LmJhclsxXS5zaG91bGQuYmUuYSgnbnVtYmVyJyk7XG4gICAgICAgIChkLmV2ZW50SGlzdG9yeS5iYXJbMV0gPj0gZC5ldmVudEhpc3RvcnkuYmFyWzBdKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIH0pO1xuICAgICAgZGVzY3JpYmUoJ2dldFNlc3Npb24gZGVjb3JhdGlvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBkZWNvcmF0ZSBnZXRTZXNzaW9uIHJlc3BvbnNlIGlmIG9wdC1pbiBjYXAgaXMgcHJvdmlkZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgbGV0IHJlcyA9IGF3YWl0IGQuZ2V0U2Vzc2lvbigpO1xuICAgICAgICAgIHNob3VsZC5ub3QuZXhpc3QocmVzLmV2ZW50cyk7XG5cbiAgICAgICAgICBkLmNhcHMuZXZlbnRUaW1pbmdzID0gdHJ1ZTtcbiAgICAgICAgICByZXMgPSBhd2FpdCBkLmdldFNlc3Npb24oKTtcbiAgICAgICAgICBzaG91bGQuZXhpc3QocmVzLmV2ZW50cyk7XG4gICAgICAgICAgc2hvdWxkLmV4aXN0KHJlcy5ldmVudHMubmV3U2Vzc2lvblJlcXVlc3RlZCk7XG4gICAgICAgICAgcmVzLmV2ZW50cy5uZXdTZXNzaW9uUmVxdWVzdGVkWzBdLnNob3VsZC5iZS5hKCdudW1iZXInKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnLnJlc2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCByZXNldCBhcyBXM0MgaWYgdGhlIG9yaWdpbmFsIHNlc3Npb24gd2FzIFczQycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgY2FwcyA9IHtcbiAgICAgICAgICBhbHdheXNNYXRjaDogT2JqZWN0LmFzc2lnbih7fSwge1xuICAgICAgICAgICAgYXBwOiAnRmFrZScsXG4gICAgICAgICAgICBkZXZpY2VOYW1lOiAnRmFrZScsXG4gICAgICAgICAgICBhdXRvbWF0aW9uTmFtZTogJ0Zha2UnLFxuICAgICAgICAgICAgcGxhdGZvcm1OYW1lOiAnRmFrZScsXG4gICAgICAgICAgfSwgZGVmYXVsdENhcHMpLFxuICAgICAgICAgIGZpcnN0TWF0Y2g6IFt7fV0sXG4gICAgICAgIH07XG4gICAgICAgIGF3YWl0IGQuY3JlYXRlU2Vzc2lvbih1bmRlZmluZWQsIHVuZGVmaW5lZCwgY2Fwcyk7XG4gICAgICAgIGQucHJvdG9jb2wuc2hvdWxkLmVxdWFsKCdXM0MnKTtcbiAgICAgICAgYXdhaXQgZC5yZXNldCgpO1xuICAgICAgICBkLnByb3RvY29sLnNob3VsZC5lcXVhbCgnVzNDJyk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgcmVzZXQgYXMgTUpTT05XUCBpZiB0aGUgb3JpZ2luYWwgc2Vzc2lvbiB3YXMgTUpTT05XUCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgY2FwcyA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgICAgICBhcHA6ICdGYWtlJyxcbiAgICAgICAgICBkZXZpY2VOYW1lOiAnRmFrZScsXG4gICAgICAgICAgYXV0b21hdGlvbk5hbWU6ICdGYWtlJyxcbiAgICAgICAgICBwbGF0Zm9ybU5hbWU6ICdGYWtlJyxcbiAgICAgICAgfSwgZGVmYXVsdENhcHMpO1xuICAgICAgICBhd2FpdCBkLmNyZWF0ZVNlc3Npb24oY2Fwcyk7XG4gICAgICAgIGQucHJvdG9jb2wuc2hvdWxkLmVxdWFsKCdNSlNPTldQJyk7XG4gICAgICAgIGF3YWl0IGQucmVzZXQoKTtcbiAgICAgICAgZC5wcm90b2NvbC5zaG91bGQuZXF1YWwoJ01KU09OV1AnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnRGV2aWNlU2V0dGluZ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBub3QgaG9sZCBvbiB0byByZWZlcmVuY2Ugb2YgZGVmYXVsdHMgaW4gY29uc3RydWN0b3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgb2JqID0ge2ZvbzogJ2Jhcid9O1xuICAgICAgbGV0IGQxID0gbmV3IERldmljZVNldHRpbmdzKG9iaik7XG4gICAgICBsZXQgZDIgPSBuZXcgRGV2aWNlU2V0dGluZ3Mob2JqKTtcbiAgICAgIGQxLl9zZXR0aW5ncy5mb28gPSAnYmF6JztcbiAgICAgIGQxLl9zZXR0aW5ncy5zaG91bGQubm90LmVxbChkMi5fc2V0dGluZ3MpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnLmlzRmVhdHVyZUVuYWJsZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZCA9IG5ldyBEcml2ZXJDbGFzcygpO1xuXG4gICAgYWZ0ZXJFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIGQuZGVueUluc2VjdXJlID0gbnVsbDtcbiAgICAgIGQuYWxsb3dJbnNlY3VyZSA9IG51bGw7XG4gICAgICBkLnJlbGF4ZWRTZWN1cml0eUVuYWJsZWQgPSBudWxsO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzYXkgYSBmZWF0dXJlIGlzIGVuYWJsZWQgd2hlbiBpdCBpcyBleHBsaWNpdGx5IGFsbG93ZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkLmFsbG93SW5zZWN1cmUgPSBbJ2ZvbycsICdiYXInXTtcbiAgICAgIGQuaXNGZWF0dXJlRW5hYmxlZCgnZm9vJykuc2hvdWxkLmJlLnRydWU7XG4gICAgICBkLmlzRmVhdHVyZUVuYWJsZWQoJ2JhcicpLnNob3VsZC5iZS50cnVlO1xuICAgICAgZC5pc0ZlYXR1cmVFbmFibGVkKCdiYXonKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHNheSBhIGZlYXR1cmUgaXMgbm90IGVuYWJsZWQgaWYgaXQgaXMgbm90IGVuYWJsZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkLmFsbG93SW5zZWN1cmUgPSBbXTtcbiAgICAgIGQuaXNGZWF0dXJlRW5hYmxlZCgnZm9vJykuc2hvdWxkLmJlLmZhbHNlO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwcmVmZXIgZGVueUluc2VjdXJlIHRvIGFsbG93SW5zZWN1cmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkLmFsbG93SW5zZWN1cmUgPSBbJ2ZvbycsICdiYXInXTtcbiAgICAgIGQuZGVueUluc2VjdXJlID0gWydmb28nXTtcbiAgICAgIGQuaXNGZWF0dXJlRW5hYmxlZCgnZm9vJykuc2hvdWxkLmJlLmZhbHNlO1xuICAgICAgZC5pc0ZlYXR1cmVFbmFibGVkKCdiYXInKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIGQuaXNGZWF0dXJlRW5hYmxlZCgnYmF6Jykuc2hvdWxkLmJlLmZhbHNlO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBnbG9iYWwgc2V0dGluZyBmb3IgaW5zZWN1cml0eScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGQucmVsYXhlZFNlY3VyaXR5RW5hYmxlZCA9IHRydWU7XG4gICAgICBkLmlzRmVhdHVyZUVuYWJsZWQoJ2ZvbycpLnNob3VsZC5iZS50cnVlO1xuICAgICAgZC5pc0ZlYXR1cmVFbmFibGVkKCdiYXInKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIGQuaXNGZWF0dXJlRW5hYmxlZCgnYmF6Jykuc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG5cbiAgICBpdCgnZ2xvYmFsIHNldHRpbmcgc2hvdWxkIGJlIG92ZXJyaWRlYWJsZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGQucmVsYXhlZFNlY3VyaXR5RW5hYmxlZCA9IHRydWU7XG4gICAgICBkLmRlbnlJbnNlY3VyZSA9IFsnZm9vJywgJ2JhciddO1xuICAgICAgZC5pc0ZlYXR1cmVFbmFibGVkKCdmb28nKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgICBkLmlzRmVhdHVyZUVuYWJsZWQoJ2JhcicpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgIGQuaXNGZWF0dXJlRW5hYmxlZCgnYmF6Jykuc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBiYXNlRHJpdmVyVW5pdFRlc3RzO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLEtBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGVBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFNBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLEVBQUEsR0FBQUosT0FBQTtBQUNBLElBQUFLLE1BQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUdBLE1BQU1NLE1BQU0sR0FBR0MsYUFBSSxDQUFDRCxNQUFNLENBQUMsQ0FBQztBQUM1QkMsYUFBSSxDQUFDQyxHQUFHLENBQUNDLHVCQUFjLENBQUM7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
