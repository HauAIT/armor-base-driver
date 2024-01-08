"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("source-map-support/register");
var _lodash = _interopRequireDefault(require("lodash"));
var _2 = require("../..");
var _constants = require("../../lib/constants");
var _axios = _interopRequireDefault(require("axios"));
var _chai = _interopRequireDefault(require("chai"));
var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));
var _bluebird = _interopRequireDefault(require("bluebird"));
const should = _chai.default.should();
const DEFAULT_ARGS = {
  address: 'localhost',
  port: 8181
};
_chai.default.use(_chaiAsPromised.default);
function baseDriverE2ETests(DriverClass, defaultCaps = {}) {
  describe('BaseDriver (e2e)', function () {
    let baseServer,
      d = new DriverClass(DEFAULT_ARGS);
    before(async function () {
      baseServer = await (0, _2.server)({
        routeConfiguringFunction: (0, _2.routeConfiguringFunction)(d),
        port: DEFAULT_ARGS.port
      });
    });
    after(async function () {
      await baseServer.close();
    });
    async function startSession(caps) {
      return (await (0, _axios.default)({
        url: 'http://localhost:8181/wd/hub/session',
        method: 'POST',
        data: {
          desiredCapabilities: caps,
          requiredCapabilities: {}
        }
      })).data;
    }
    async function endSession(id) {
      return (await (0, _axios.default)({
        url: `http://localhost:8181/wd/hub/session/${id}`,
        method: 'DELETE',
        validateStatus: null
      })).data;
    }
    async function getSession(id) {
      return (await (0, _axios.default)({
        url: `http://localhost:8181/wd/hub/session/${id}`
      })).data;
    }
    describe('session handling', function () {
      it('should handle idempotency while creating sessions', async function () {
        const sessionIds = [];
        let times = 0;
        do {
          const {
            sessionId
          } = (await (0, _axios.default)({
            url: 'http://localhost:8181/wd/hub/session',
            headers: {
              'X-Idempotency-Key': '123456'
            },
            method: 'POST',
            data: {
              desiredCapabilities: defaultCaps,
              requiredCapabilities: {}
            },
            simple: false,
            resolveWithFullResponse: true
          })).data;
          sessionIds.push(sessionId);
          times++;
        } while (times < 2);
        _lodash.default.uniq(sessionIds).length.should.equal(1);
        const {
          status,
          data
        } = await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionIds[0]}`,
          method: 'DELETE'
        });
        status.should.equal(200);
        data.status.should.equal(0);
      });
      it('should handle idempotency while creating parallel sessions', async function () {
        const reqs = [];
        let times = 0;
        do {
          reqs.push((0, _axios.default)({
            url: 'http://localhost:8181/wd/hub/session',
            headers: {
              'X-Idempotency-Key': '12345'
            },
            method: 'POST',
            data: {
              desiredCapabilities: defaultCaps,
              requiredCapabilities: {}
            }
          }));
          times++;
        } while (times < 2);
        const sessionIds = (await _bluebird.default.all(reqs)).map(x => x.data.sessionId);
        _lodash.default.uniq(sessionIds).length.should.equal(1);
        const {
          status,
          data
        } = await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionIds[0]}`,
          method: 'DELETE'
        });
        status.should.equal(200);
        data.status.should.equal(0);
      });
      it('should create session and retrieve a session id, then delete it', async function () {
        let {
          status,
          data
        } = await (0, _axios.default)({
          url: 'http://localhost:8181/wd/hub/session',
          method: 'POST',
          data: {
            desiredCapabilities: defaultCaps,
            requiredCapabilities: {}
          }
        });
        status.should.equal(200);
        data.status.should.equal(0);
        should.exist(data.sessionId);
        data.value.should.eql(defaultCaps);
        ({
          status,
          data
        } = await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${d.sessionId}`,
          method: 'DELETE'
        }));
        status.should.equal(200);
        data.status.should.equal(0);
        should.equal(d.sessionId, null);
      });
    });
    it.skip('should throw NYI for commands not implemented', async function () {});
    describe('command timeouts', function () {
      let originalFindElement, originalFindElements;
      async function startTimeoutSession(timeout) {
        let caps = _lodash.default.clone(defaultCaps);
        caps.newCommandTimeout = timeout;
        return await startSession(caps);
      }
      before(function () {
        originalFindElement = d.findElement;
        d.findElement = function () {
          return 'foo';
        }.bind(d);
        originalFindElements = d.findElements;
        d.findElements = async function () {
          await _bluebird.default.delay(200);
          return ['foo'];
        }.bind(d);
      });
      after(function () {
        d.findElement = originalFindElement;
        d.findElements = originalFindElements;
      });
      it('should set a default commandTimeout', async function () {
        let newSession = await startTimeoutSession();
        d.newCommandTimeoutMs.should.be.above(0);
        await endSession(newSession.sessionId);
      });
      it('should timeout on commands using commandTimeout cap', async function () {
        let newSession = await startTimeoutSession(0.25);
        await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${d.sessionId}/element`,
          method: 'POST',
          data: {
            using: 'name',
            value: 'foo'
          }
        });
        await _bluebird.default.delay(400);
        const {
          data
        } = await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${d.sessionId}`,
          validateStatus: null
        });
        data.status.should.equal(6);
        should.equal(d.sessionId, null);
        const {
          status
        } = await endSession(newSession.sessionId);
        status.should.equal(6);
      });
      it('should not timeout with commandTimeout of false', async function () {
        let newSession = await startTimeoutSession(0.1);
        let start = Date.now();
        const {
          value
        } = (await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${d.sessionId}/elements`,
          method: 'POST',
          data: {
            using: 'name',
            value: 'foo'
          }
        })).data;
        (Date.now() - start).should.be.above(150);
        value.should.eql(['foo']);
        await endSession(newSession.sessionId);
      });
      it('should not timeout with commandTimeout of 0', async function () {
        d.newCommandTimeoutMs = 2;
        let newSession = await startTimeoutSession(0);
        await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${d.sessionId}/element`,
          method: 'POST',
          data: {
            using: 'name',
            value: 'foo'
          }
        });
        await _bluebird.default.delay(400);
        let {
          status
        } = (await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${d.sessionId}`
        })).data;
        status.should.equal(0);
        ({
          status
        } = await endSession(newSession.sessionId));
        status.should.equal(0);
        d.newCommandTimeoutMs = 60 * 1000;
      });
      it('should not timeout if its just the command taking awhile', async function () {
        let newSession = await startTimeoutSession(0.25);
        await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${d.sessionId}/element`,
          method: 'POST',
          data: {
            using: 'name',
            value: 'foo'
          }
        });
        await _bluebird.default.delay(400);
        let {
          status
        } = (await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${d.sessionId}`,
          validateStatus: null
        })).data;
        status.should.equal(6);
        should.equal(d.sessionId, null);
        ({
          status
        } = await endSession(newSession.sessionId));
        status.should.equal(6);
      });
      it('should not have a timer running before or after a session', async function () {
        should.not.exist(d.noCommandTimer);
        let newSession = await startTimeoutSession(0.25);
        newSession.sessionId.should.equal(d.sessionId);
        should.exist(d.noCommandTimer);
        await endSession(newSession.sessionId);
        should.not.exist(d.noCommandTimer);
      });
    });
    describe('settings api', function () {
      before(function () {
        d.settings = new _2.DeviceSettings({
          ignoreUnimportantViews: false
        });
      });
      it('should be able to get settings object', function () {
        d.settings.getSettings().ignoreUnimportantViews.should.be.false;
      });
      it('should throw error when updateSettings method is not defined', async function () {
        await d.settings.update({
          ignoreUnimportantViews: true
        }).should.eventually.be.rejectedWith('onSettingsUpdate');
      });
      it('should throw error for invalid update object', async function () {
        await d.settings.update('invalid json').should.eventually.be.rejectedWith('JSON');
      });
    });
    describe('unexpected exits', function () {
      it('should reject a current command when the driver crashes', async function () {
        d._oldGetStatus = d.getStatus;
        try {
          d.getStatus = async function () {
            await _bluebird.default.delay(5000);
          }.bind(d);
          const reqPromise = (0, _axios.default)({
            url: 'http://localhost:8181/wd/hub/status',
            validateStatus: null
          });
          await _bluebird.default.delay(100);
          const shutdownEventPromise = new _bluebird.default((resolve, reject) => {
            setTimeout(() => reject(new Error('onUnexpectedShutdown event is expected to be fired within 5 seconds timeout')), 5000);
            d.onUnexpectedShutdown(resolve);
          });
          d.startUnexpectedShutdown(new Error('Crashytimes'));
          const {
            status,
            value
          } = (await reqPromise).data;
          status.should.equal(13);
          value.message.should.contain('Crashytimes');
          await shutdownEventPromise;
        } finally {
          d.getStatus = d._oldGetStatus;
        }
      });
    });
    describe('event timings', function () {
      it('should not add timings if not using opt-in cap', async function () {
        let session = await startSession(defaultCaps);
        let res = await getSession(session.sessionId);
        should.not.exist(res.events);
        await endSession(session.sessionId);
      });
      it('should add start session timings', async function () {
        let caps = Object.assign({}, defaultCaps, {
          eventTimings: true
        });
        let session = await startSession(caps);
        let res = (await getSession(session.sessionId)).value;
        should.exist(res.events);
        should.exist(res.events.newSessionRequested);
        should.exist(res.events.newSessionStarted);
        res.events.newSessionRequested[0].should.be.a('number');
        res.events.newSessionStarted[0].should.be.a('number');
        await endSession(session.sessionId);
      });
    });
    describe('execute driver script', function () {
      let originalFindElement, sessionId;
      before(function () {
        d.allowInsecure = ['execute_driver_script'];
        originalFindElement = d.findElement;
        d.findElement = function (strategy, selector) {
          if (strategy === 'accessibility id' && selector === 'amazing') {
            return {
              [_constants.W3C_ELEMENT_KEY]: 'element-id-1'
            };
          }
          throw new _2.errors.NoSuchElementError('not found');
        }.bind(d);
      });
      beforeEach(async function () {
        ({
          sessionId
        } = await startSession(defaultCaps));
      });
      after(function () {
        d.findElement = originalFindElement;
      });
      afterEach(async function () {
        await endSession(sessionId);
      });
      it('should not work unless the allowInsecure feature flag is set', async function () {
        d._allowInsecure = d.allowInsecure;
        try {
          d.allowInsecure = [];
          const script = `return 'foo'`;
          await (0, _axios.default)({
            url: `http://localhost:8181/wd/hub/session/${sessionId}/armor/execute_driver`,
            method: 'POST',
            data: {
              script,
              type: 'wd'
            }
          }).should.eventually.be.rejected;
          await endSession(sessionId);
        } finally {
          d.allowInsecure = d._allowInsecure;
        }
      });
      it('should execute a webdriverio script in the context of session', async function () {
        const script = `
          const timeouts = await driver.getTimeouts();
          const status = await driver.status();
          return [timeouts, status];
        `;
        const {
          value
        } = (await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionId}/armor/execute_driver`,
          method: 'POST',
          data: {
            script,
            type: 'webdriverio'
          }
        })).data;
        const expectedTimeouts = {
          command: 250,
          implicit: 0
        };
        const expectedStatus = {};
        value.result.should.eql([expectedTimeouts, expectedStatus]);
      });
      it('should fail with any script type other than webdriverio currently', async function () {
        const script = `return 'foo'`;
        await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionId}/armor/execute_driver`,
          method: 'POST',
          data: {
            script,
            type: 'wd'
          }
        }).should.eventually.be.rejected;
      });
      it('should execute a webdriverio script that returns elements correctly', async function () {
        const script = `
          return await driver.$("~amazing");
        `;
        const {
          value
        } = (await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionId}/armor/execute_driver`,
          method: 'POST',
          data: {
            script
          }
        })).data;
        value.result.should.eql({
          [_constants.W3C_ELEMENT_KEY]: 'element-id-1',
          [_constants.MJSONWP_ELEMENT_KEY]: 'element-id-1'
        });
      });
      it('should execute a webdriverio script that returns elements in deep structure', async function () {
        const script = `
          const el = await driver.$("~amazing");
          return {element: el, elements: [el, el]};
        `;
        const {
          value
        } = (await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionId}/armor/execute_driver`,
          method: 'POST',
          data: {
            script
          }
        })).data;
        const elObj = {
          [_constants.W3C_ELEMENT_KEY]: 'element-id-1',
          [_constants.MJSONWP_ELEMENT_KEY]: 'element-id-1'
        };
        value.result.should.eql({
          element: elObj,
          elements: [elObj, elObj]
        });
      });
      it('should store and return logs to the user', async function () {
        const script = `
          console.log("foo");
          console.log("foo2");
          console.warn("bar");
          console.error("baz");
          return null;
        `;
        const {
          value
        } = (await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionId}/armor/execute_driver`,
          method: 'POST',
          data: {
            script
          }
        })).data;
        value.logs.should.eql({
          log: ['foo', 'foo2'],
          warn: ['bar'],
          error: ['baz']
        });
      });
      it('should have armor specific commands available', async function () {
        const script = `
          return typeof driver.lock;
        `;
        const {
          value
        } = (await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionId}/armor/execute_driver`,
          method: 'POST',
          data: {
            script
          }
        })).data;
        value.result.should.eql('function');
      });
      it('should correctly handle errors that happen in a webdriverio script', async function () {
        const script = `
          return await driver.$("~notfound");
        `;
        const {
          data
        } = await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionId}/armor/execute_driver`,
          method: 'POST',
          validateStatus: null,
          data: {
            script
          }
        });
        data.should.eql({
          sessionId,
          status: 13,
          value: {
            message: 'An unknown server-side error occurred while processing the command. Original error: Could not execute driver script. Original error was: Error: not found'
          }
        });
      });
      it('should correctly handle errors that happen when a script cannot be compiled', async function () {
        const script = `
          return {;
        `;
        const {
          data
        } = await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionId}/armor/execute_driver`,
          method: 'POST',
          validateStatus: null,
          data: {
            script
          }
        });
        sessionId.should.eql(data.sessionId);
        data.status.should.eql(13);
        data.value.should.have.property('message');
        data.value.message.should.match(/An unknown server-side error occurred while processing the command. Original error: Could not execute driver script. Original error was: Error: Unexpected token '?;'?/);
      });
      it('should be able to set a timeout on a driver script', async function () {
        const script = `
          await Promise.delay(1000);
          return true;
        `;
        const {
          value
        } = (await (0, _axios.default)({
          url: `http://localhost:8181/wd/hub/session/${sessionId}/armor/execute_driver`,
          method: 'POST',
          validateStatus: null,
          data: {
            script,
            timeout: 50
          }
        })).data;
        value.message.should.match(/.+50.+timeout.+/);
      });
    });
  });
}
var _default = exports.default = baseDriverE2ETests;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC9iYXNlZHJpdmVyL2RyaXZlci1lMmUtdGVzdHMuanMiLCJuYW1lcyI6WyJfbG9kYXNoIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfMiIsIl9jb25zdGFudHMiLCJfYXhpb3MiLCJfY2hhaSIsIl9jaGFpQXNQcm9taXNlZCIsIl9ibHVlYmlyZCIsInNob3VsZCIsImNoYWkiLCJERUZBVUxUX0FSR1MiLCJhZGRyZXNzIiwicG9ydCIsInVzZSIsImNoYWlBc1Byb21pc2VkIiwiYmFzZURyaXZlckUyRVRlc3RzIiwiRHJpdmVyQ2xhc3MiLCJkZWZhdWx0Q2FwcyIsImRlc2NyaWJlIiwiYmFzZVNlcnZlciIsImQiLCJiZWZvcmUiLCJzZXJ2ZXIiLCJyb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb24iLCJhZnRlciIsImNsb3NlIiwic3RhcnRTZXNzaW9uIiwiY2FwcyIsImF4aW9zIiwidXJsIiwibWV0aG9kIiwiZGF0YSIsImRlc2lyZWRDYXBhYmlsaXRpZXMiLCJyZXF1aXJlZENhcGFiaWxpdGllcyIsImVuZFNlc3Npb24iLCJpZCIsInZhbGlkYXRlU3RhdHVzIiwiZ2V0U2Vzc2lvbiIsIml0Iiwic2Vzc2lvbklkcyIsInRpbWVzIiwic2Vzc2lvbklkIiwiaGVhZGVycyIsInNpbXBsZSIsInJlc29sdmVXaXRoRnVsbFJlc3BvbnNlIiwicHVzaCIsIl8iLCJ1bmlxIiwibGVuZ3RoIiwiZXF1YWwiLCJzdGF0dXMiLCJyZXFzIiwiQiIsImFsbCIsIm1hcCIsIngiLCJleGlzdCIsInZhbHVlIiwiZXFsIiwic2tpcCIsIm9yaWdpbmFsRmluZEVsZW1lbnQiLCJvcmlnaW5hbEZpbmRFbGVtZW50cyIsInN0YXJ0VGltZW91dFNlc3Npb24iLCJ0aW1lb3V0IiwiY2xvbmUiLCJuZXdDb21tYW5kVGltZW91dCIsImZpbmRFbGVtZW50IiwiYmluZCIsImZpbmRFbGVtZW50cyIsImRlbGF5IiwibmV3U2Vzc2lvbiIsIm5ld0NvbW1hbmRUaW1lb3V0TXMiLCJiZSIsImFib3ZlIiwidXNpbmciLCJzdGFydCIsIkRhdGUiLCJub3ciLCJub3QiLCJub0NvbW1hbmRUaW1lciIsInNldHRpbmdzIiwiRGV2aWNlU2V0dGluZ3MiLCJpZ25vcmVVbmltcG9ydGFudFZpZXdzIiwiZ2V0U2V0dGluZ3MiLCJmYWxzZSIsInVwZGF0ZSIsImV2ZW50dWFsbHkiLCJyZWplY3RlZFdpdGgiLCJfb2xkR2V0U3RhdHVzIiwiZ2V0U3RhdHVzIiwicmVxUHJvbWlzZSIsInNodXRkb3duRXZlbnRQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInNldFRpbWVvdXQiLCJFcnJvciIsIm9uVW5leHBlY3RlZFNodXRkb3duIiwic3RhcnRVbmV4cGVjdGVkU2h1dGRvd24iLCJtZXNzYWdlIiwiY29udGFpbiIsInNlc3Npb24iLCJyZXMiLCJldmVudHMiLCJPYmplY3QiLCJhc3NpZ24iLCJldmVudFRpbWluZ3MiLCJuZXdTZXNzaW9uUmVxdWVzdGVkIiwibmV3U2Vzc2lvblN0YXJ0ZWQiLCJhIiwiYWxsb3dJbnNlY3VyZSIsInN0cmF0ZWd5Iiwic2VsZWN0b3IiLCJXM0NfRUxFTUVOVF9LRVkiLCJlcnJvcnMiLCJOb1N1Y2hFbGVtZW50RXJyb3IiLCJiZWZvcmVFYWNoIiwiYWZ0ZXJFYWNoIiwiX2FsbG93SW5zZWN1cmUiLCJzY3JpcHQiLCJ0eXBlIiwicmVqZWN0ZWQiLCJleHBlY3RlZFRpbWVvdXRzIiwiY29tbWFuZCIsImltcGxpY2l0IiwiZXhwZWN0ZWRTdGF0dXMiLCJyZXN1bHQiLCJNSlNPTldQX0VMRU1FTlRfS0VZIiwiZWxPYmoiLCJlbGVtZW50IiwiZWxlbWVudHMiLCJsb2dzIiwibG9nIiwid2FybiIsImVycm9yIiwiaGF2ZSIsInByb3BlcnR5IiwibWF0Y2giLCJfZGVmYXVsdCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZVJvb3QiOiIuLi8uLi8uLiIsInNvdXJjZXMiOlsidGVzdC9iYXNlZHJpdmVyL2RyaXZlci1lMmUtdGVzdHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IHNlcnZlciwgcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uLCBEZXZpY2VTZXR0aW5ncywgZXJyb3JzIH0gZnJvbSAnLi4vLi4nO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG5pbXBvcnQgeyBNSlNPTldQX0VMRU1FTlRfS0VZLCBXM0NfRUxFTUVOVF9LRVkgfSBmcm9tICcuLi8uLi9saWIvY29uc3RhbnRzJztcbmltcG9ydCBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCBCIGZyb20gJ2JsdWViaXJkJztcblxuY29uc3Qgc2hvdWxkID0gY2hhaS5zaG91bGQoKTtcbmNvbnN0IERFRkFVTFRfQVJHUyA9IHtcbiAgYWRkcmVzczogJ2xvY2FsaG9zdCcsXG4gIHBvcnQ6IDgxODFcbn07XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cbmZ1bmN0aW9uIGJhc2VEcml2ZXJFMkVUZXN0cyAoRHJpdmVyQ2xhc3MsIGRlZmF1bHRDYXBzID0ge30pIHtcbiAgZGVzY3JpYmUoJ0Jhc2VEcml2ZXIgKGUyZSknLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGJhc2VTZXJ2ZXIsIGQgPSBuZXcgRHJpdmVyQ2xhc3MoREVGQVVMVF9BUkdTKTtcbiAgICBiZWZvcmUoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYmFzZVNlcnZlciA9IGF3YWl0IHNlcnZlcih7XG4gICAgICAgIHJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbjogcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uKGQpLFxuICAgICAgICBwb3J0OiBERUZBVUxUX0FSR1MucG9ydCxcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGFmdGVyKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGF3YWl0IGJhc2VTZXJ2ZXIuY2xvc2UoKTtcbiAgICB9KTtcblxuICAgIGFzeW5jIGZ1bmN0aW9uIHN0YXJ0U2Vzc2lvbiAoY2Fwcykge1xuICAgICAgcmV0dXJuIChhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODE4MS93ZC9odWIvc2Vzc2lvbicsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7ZGVzaXJlZENhcGFiaWxpdGllczogY2FwcywgcmVxdWlyZWRDYXBhYmlsaXRpZXM6IHt9fSxcbiAgICAgIH0pKS5kYXRhO1xuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIGVuZFNlc3Npb24gKGlkKSB7XG4gICAgICByZXR1cm4gKGF3YWl0IGF4aW9zKHtcbiAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9zZXNzaW9uLyR7aWR9YCxcbiAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICB9KSkuZGF0YTtcbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiBnZXRTZXNzaW9uIChpZCkge1xuICAgICAgcmV0dXJuIChhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogYGh0dHA6Ly9sb2NhbGhvc3Q6ODE4MS93ZC9odWIvc2Vzc2lvbi8ke2lkfWAsXG4gICAgICB9KSkuZGF0YTtcbiAgICB9XG5cbiAgICBkZXNjcmliZSgnc2Vzc2lvbiBoYW5kbGluZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgaGFuZGxlIGlkZW1wb3RlbmN5IHdoaWxlIGNyZWF0aW5nIHNlc3Npb25zJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBzZXNzaW9uSWRzID0gW107XG4gICAgICAgIGxldCB0aW1lcyA9IDA7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBjb25zdCB7c2Vzc2lvbklkfSA9IChhd2FpdCBheGlvcyh7XG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vbG9jYWxob3N0OjgxODEvd2QvaHViL3Nlc3Npb24nLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnWC1JZGVtcG90ZW5jeS1LZXknOiAnMTIzNDU2JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IHtkZXNpcmVkQ2FwYWJpbGl0aWVzOiBkZWZhdWx0Q2FwcywgcmVxdWlyZWRDYXBhYmlsaXRpZXM6IHt9fSxcbiAgICAgICAgICAgIHNpbXBsZTogZmFsc2UsXG4gICAgICAgICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogdHJ1ZVxuICAgICAgICAgIH0pKS5kYXRhO1xuXG4gICAgICAgICAgc2Vzc2lvbklkcy5wdXNoKHNlc3Npb25JZCk7XG4gICAgICAgICAgdGltZXMrKztcbiAgICAgICAgfSB3aGlsZSAodGltZXMgPCAyKTtcbiAgICAgICAgXy51bmlxKHNlc3Npb25JZHMpLmxlbmd0aC5zaG91bGQuZXF1YWwoMSk7XG5cbiAgICAgICAgY29uc3Qge3N0YXR1cywgZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9zZXNzaW9uLyR7c2Vzc2lvbklkc1swXX1gLFxuICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgIH0pO1xuICAgICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDIwMCk7XG4gICAgICAgIGRhdGEuc3RhdHVzLnNob3VsZC5lcXVhbCgwKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGhhbmRsZSBpZGVtcG90ZW5jeSB3aGlsZSBjcmVhdGluZyBwYXJhbGxlbCBzZXNzaW9ucycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgcmVxcyA9IFtdO1xuICAgICAgICBsZXQgdGltZXMgPSAwO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgcmVxcy5wdXNoKGF4aW9zKHtcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODE4MS93ZC9odWIvc2Vzc2lvbicsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdYLUlkZW1wb3RlbmN5LUtleSc6ICcxMjM0NScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiB7ZGVzaXJlZENhcGFiaWxpdGllczogZGVmYXVsdENhcHMsIHJlcXVpcmVkQ2FwYWJpbGl0aWVzOiB7fX0sXG4gICAgICAgICAgfSkpO1xuICAgICAgICAgIHRpbWVzKys7XG4gICAgICAgIH0gd2hpbGUgKHRpbWVzIDwgMik7XG4gICAgICAgIGNvbnN0IHNlc3Npb25JZHMgPSAoYXdhaXQgQi5hbGwocmVxcykpLm1hcCgoeCkgPT4geC5kYXRhLnNlc3Npb25JZCk7XG4gICAgICAgIF8udW5pcShzZXNzaW9uSWRzKS5sZW5ndGguc2hvdWxkLmVxdWFsKDEpO1xuXG4gICAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgIHVybDogYGh0dHA6Ly9sb2NhbGhvc3Q6ODE4MS93ZC9odWIvc2Vzc2lvbi8ke3Nlc3Npb25JZHNbMF19YCxcbiAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICB9KTtcbiAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCgyMDApO1xuICAgICAgICBkYXRhLnN0YXR1cy5zaG91bGQuZXF1YWwoMCk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBjcmVhdGUgc2Vzc2lvbiBhbmQgcmV0cmlldmUgYSBzZXNzaW9uIGlkLCB0aGVuIGRlbGV0ZSBpdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgIHVybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODE4MS93ZC9odWIvc2Vzc2lvbicsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgZGF0YToge2Rlc2lyZWRDYXBhYmlsaXRpZXM6IGRlZmF1bHRDYXBzLCByZXF1aXJlZENhcGFiaWxpdGllczoge319LFxuICAgICAgICB9KTtcblxuICAgICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDIwMCk7XG4gICAgICAgIGRhdGEuc3RhdHVzLnNob3VsZC5lcXVhbCgwKTtcbiAgICAgICAgc2hvdWxkLmV4aXN0KGRhdGEuc2Vzc2lvbklkKTtcbiAgICAgICAgZGF0YS52YWx1ZS5zaG91bGQuZXFsKGRlZmF1bHRDYXBzKTtcblxuICAgICAgICAoe3N0YXR1cywgZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9zZXNzaW9uLyR7ZC5zZXNzaW9uSWR9YCxcbiAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICB9KSk7XG5cbiAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCgyMDApO1xuICAgICAgICBkYXRhLnN0YXR1cy5zaG91bGQuZXF1YWwoMCk7XG4gICAgICAgIHNob3VsZC5lcXVhbChkLnNlc3Npb25JZCwgbnVsbCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0LnNraXAoJ3Nob3VsZCB0aHJvdyBOWUkgZm9yIGNvbW1hbmRzIG5vdCBpbXBsZW1lbnRlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdjb21tYW5kIHRpbWVvdXRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IG9yaWdpbmFsRmluZEVsZW1lbnQsIG9yaWdpbmFsRmluZEVsZW1lbnRzO1xuICAgICAgYXN5bmMgZnVuY3Rpb24gc3RhcnRUaW1lb3V0U2Vzc2lvbiAodGltZW91dCkge1xuICAgICAgICBsZXQgY2FwcyA9IF8uY2xvbmUoZGVmYXVsdENhcHMpO1xuICAgICAgICBjYXBzLm5ld0NvbW1hbmRUaW1lb3V0ID0gdGltZW91dDtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHN0YXJ0U2Vzc2lvbihjYXBzKTtcbiAgICAgIH1cblxuICAgICAgYmVmb3JlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb3JpZ2luYWxGaW5kRWxlbWVudCA9IGQuZmluZEVsZW1lbnQ7XG4gICAgICAgIGQuZmluZEVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuICdmb28nO1xuICAgICAgICB9LmJpbmQoZCk7XG5cbiAgICAgICAgb3JpZ2luYWxGaW5kRWxlbWVudHMgPSBkLmZpbmRFbGVtZW50cztcbiAgICAgICAgZC5maW5kRWxlbWVudHMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXdhaXQgQi5kZWxheSgyMDApO1xuICAgICAgICAgIHJldHVybiBbJ2ZvbyddO1xuICAgICAgICB9LmJpbmQoZCk7XG4gICAgICB9KTtcblxuICAgICAgYWZ0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICBkLmZpbmRFbGVtZW50ID0gb3JpZ2luYWxGaW5kRWxlbWVudDtcbiAgICAgICAgZC5maW5kRWxlbWVudHMgPSBvcmlnaW5hbEZpbmRFbGVtZW50cztcbiAgICAgIH0pO1xuXG5cbiAgICAgIGl0KCdzaG91bGQgc2V0IGEgZGVmYXVsdCBjb21tYW5kVGltZW91dCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IG5ld1Nlc3Npb24gPSBhd2FpdCBzdGFydFRpbWVvdXRTZXNzaW9uKCk7XG4gICAgICAgIGQubmV3Q29tbWFuZFRpbWVvdXRNcy5zaG91bGQuYmUuYWJvdmUoMCk7XG4gICAgICAgIGF3YWl0IGVuZFNlc3Npb24obmV3U2Vzc2lvbi5zZXNzaW9uSWQpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdGltZW91dCBvbiBjb21tYW5kcyB1c2luZyBjb21tYW5kVGltZW91dCBjYXAnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBuZXdTZXNzaW9uID0gYXdhaXQgc3RhcnRUaW1lb3V0U2Vzc2lvbigwLjI1KTtcblxuICAgICAgICBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9zZXNzaW9uLyR7ZC5zZXNzaW9uSWR9L2VsZW1lbnRgLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHt1c2luZzogJ25hbWUnLCB2YWx1ZTogJ2Zvbyd9LFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgQi5kZWxheSg0MDApO1xuICAgICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9zZXNzaW9uLyR7ZC5zZXNzaW9uSWR9YCxcbiAgICAgICAgICB2YWxpZGF0ZVN0YXR1czogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICAgIGRhdGEuc3RhdHVzLnNob3VsZC5lcXVhbCg2KTtcbiAgICAgICAgc2hvdWxkLmVxdWFsKGQuc2Vzc2lvbklkLCBudWxsKTtcbiAgICAgICAgY29uc3Qge3N0YXR1c30gPSBhd2FpdCBlbmRTZXNzaW9uKG5ld1Nlc3Npb24uc2Vzc2lvbklkKTtcbiAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCg2KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIG5vdCB0aW1lb3V0IHdpdGggY29tbWFuZFRpbWVvdXQgb2YgZmFsc2UnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBuZXdTZXNzaW9uID0gYXdhaXQgc3RhcnRUaW1lb3V0U2Vzc2lvbigwLjEpO1xuICAgICAgICBsZXQgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICBjb25zdCB7dmFsdWV9ID0gKGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICB1cmw6IGBodHRwOi8vbG9jYWxob3N0OjgxODEvd2QvaHViL3Nlc3Npb24vJHtkLnNlc3Npb25JZH0vZWxlbWVudHNgLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHt1c2luZzogJ25hbWUnLCB2YWx1ZTogJ2Zvbyd9LFxuICAgICAgICB9KSkuZGF0YTtcbiAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkuc2hvdWxkLmJlLmFib3ZlKDE1MCk7XG4gICAgICAgIHZhbHVlLnNob3VsZC5lcWwoWydmb28nXSk7XG4gICAgICAgIGF3YWl0IGVuZFNlc3Npb24obmV3U2Vzc2lvbi5zZXNzaW9uSWQpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgbm90IHRpbWVvdXQgd2l0aCBjb21tYW5kVGltZW91dCBvZiAwJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBkLm5ld0NvbW1hbmRUaW1lb3V0TXMgPSAyO1xuICAgICAgICBsZXQgbmV3U2Vzc2lvbiA9IGF3YWl0IHN0YXJ0VGltZW91dFNlc3Npb24oMCk7XG5cbiAgICAgICAgYXdhaXQgYXhpb3Moe1xuICAgICAgICAgIHVybDogYGh0dHA6Ly9sb2NhbGhvc3Q6ODE4MS93ZC9odWIvc2Vzc2lvbi8ke2Quc2Vzc2lvbklkfS9lbGVtZW50YCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7dXNpbmc6ICduYW1lJywgdmFsdWU6ICdmb28nfSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IEIuZGVsYXkoNDAwKTtcbiAgICAgICAgbGV0IHtzdGF0dXN9ID0gKGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICB1cmw6IGBodHRwOi8vbG9jYWxob3N0OjgxODEvd2QvaHViL3Nlc3Npb24vJHtkLnNlc3Npb25JZH1gLFxuICAgICAgICB9KSkuZGF0YTtcbiAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCgwKTtcbiAgICAgICAgKHtzdGF0dXN9ID0gYXdhaXQgZW5kU2Vzc2lvbihuZXdTZXNzaW9uLnNlc3Npb25JZCkpO1xuICAgICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuXG4gICAgICAgIGQubmV3Q29tbWFuZFRpbWVvdXRNcyA9IDYwICogMTAwMDtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIG5vdCB0aW1lb3V0IGlmIGl0cyBqdXN0IHRoZSBjb21tYW5kIHRha2luZyBhd2hpbGUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBuZXdTZXNzaW9uID0gYXdhaXQgc3RhcnRUaW1lb3V0U2Vzc2lvbigwLjI1KTtcbiAgICAgICAgYXdhaXQgYXhpb3Moe1xuICAgICAgICAgIHVybDogYGh0dHA6Ly9sb2NhbGhvc3Q6ODE4MS93ZC9odWIvc2Vzc2lvbi8ke2Quc2Vzc2lvbklkfS9lbGVtZW50YCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7dXNpbmc6ICduYW1lJywgdmFsdWU6ICdmb28nfSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IEIuZGVsYXkoNDAwKTtcbiAgICAgICAgbGV0IHtzdGF0dXN9ID0gKGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICB1cmw6IGBodHRwOi8vbG9jYWxob3N0OjgxODEvd2QvaHViL3Nlc3Npb24vJHtkLnNlc3Npb25JZH1gLFxuICAgICAgICAgIHZhbGlkYXRlU3RhdHVzOiBudWxsLFxuICAgICAgICB9KSkuZGF0YTtcbiAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCg2KTtcbiAgICAgICAgc2hvdWxkLmVxdWFsKGQuc2Vzc2lvbklkLCBudWxsKTtcbiAgICAgICAgKHtzdGF0dXN9ID0gYXdhaXQgZW5kU2Vzc2lvbihuZXdTZXNzaW9uLnNlc3Npb25JZCkpO1xuICAgICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDYpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgbm90IGhhdmUgYSB0aW1lciBydW5uaW5nIGJlZm9yZSBvciBhZnRlciBhIHNlc3Npb24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNob3VsZC5ub3QuZXhpc3QoZC5ub0NvbW1hbmRUaW1lcik7XG4gICAgICAgIGxldCBuZXdTZXNzaW9uID0gYXdhaXQgc3RhcnRUaW1lb3V0U2Vzc2lvbigwLjI1KTtcbiAgICAgICAgbmV3U2Vzc2lvbi5zZXNzaW9uSWQuc2hvdWxkLmVxdWFsKGQuc2Vzc2lvbklkKTtcbiAgICAgICAgc2hvdWxkLmV4aXN0KGQubm9Db21tYW5kVGltZXIpO1xuICAgICAgICBhd2FpdCBlbmRTZXNzaW9uKG5ld1Nlc3Npb24uc2Vzc2lvbklkKTtcbiAgICAgICAgc2hvdWxkLm5vdC5leGlzdChkLm5vQ29tbWFuZFRpbWVyKTtcbiAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnc2V0dGluZ3MgYXBpJywgZnVuY3Rpb24gKCkge1xuICAgICAgYmVmb3JlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZC5zZXR0aW5ncyA9IG5ldyBEZXZpY2VTZXR0aW5ncyh7aWdub3JlVW5pbXBvcnRhbnRWaWV3czogZmFsc2V9KTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIGdldCBzZXR0aW5ncyBvYmplY3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGQuc2V0dGluZ3MuZ2V0U2V0dGluZ3MoKS5pZ25vcmVVbmltcG9ydGFudFZpZXdzLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciB3aGVuIHVwZGF0ZVNldHRpbmdzIG1ldGhvZCBpcyBub3QgZGVmaW5lZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgZC5zZXR0aW5ncy51cGRhdGUoe2lnbm9yZVVuaW1wb3J0YW50Vmlld3M6IHRydWV9KS5zaG91bGQuZXZlbnR1YWxseVxuICAgICAgICAgICAgICAgIC5iZS5yZWplY3RlZFdpdGgoJ29uU2V0dGluZ3NVcGRhdGUnKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgaW52YWxpZCB1cGRhdGUgb2JqZWN0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBkLnNldHRpbmdzLnVwZGF0ZSgnaW52YWxpZCBqc29uJykuc2hvdWxkLmV2ZW50dWFsbHlcbiAgICAgICAgICAgICAgICAuYmUucmVqZWN0ZWRXaXRoKCdKU09OJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCd1bmV4cGVjdGVkIGV4aXRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCByZWplY3QgYSBjdXJyZW50IGNvbW1hbmQgd2hlbiB0aGUgZHJpdmVyIGNyYXNoZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGQuX29sZEdldFN0YXR1cyA9IGQuZ2V0U3RhdHVzO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGQuZ2V0U3RhdHVzID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYXdhaXQgQi5kZWxheSg1MDAwKTtcbiAgICAgICAgICB9LmJpbmQoZCk7XG4gICAgICAgICAgY29uc3QgcmVxUHJvbWlzZSA9IGF4aW9zKHtcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODE4MS93ZC9odWIvc3RhdHVzJyxcbiAgICAgICAgICAgIHZhbGlkYXRlU3RhdHVzOiBudWxsLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSByZXF1ZXN0IGdldHMgdG8gdGhlIHNlcnZlciBiZWZvcmUgb3VyIHNodXRkb3duXG4gICAgICAgICAgYXdhaXQgQi5kZWxheSgxMDApO1xuICAgICAgICAgIGNvbnN0IHNodXRkb3duRXZlbnRQcm9taXNlID0gbmV3IEIoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKCdvblVuZXhwZWN0ZWRTaHV0ZG93biBldmVudCBpcyBleHBlY3RlZCB0byBiZSBmaXJlZCB3aXRoaW4gNSBzZWNvbmRzIHRpbWVvdXQnKSksIDUwMDApO1xuICAgICAgICAgICAgZC5vblVuZXhwZWN0ZWRTaHV0ZG93bihyZXNvbHZlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBkLnN0YXJ0VW5leHBlY3RlZFNodXRkb3duKG5ldyBFcnJvcignQ3Jhc2h5dGltZXMnKSk7XG4gICAgICAgICAgY29uc3Qge3N0YXR1cywgdmFsdWV9ID0gKGF3YWl0IHJlcVByb21pc2UpLmRhdGE7XG4gICAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCgxMyk7XG4gICAgICAgICAgdmFsdWUubWVzc2FnZS5zaG91bGQuY29udGFpbignQ3Jhc2h5dGltZXMnKTtcbiAgICAgICAgICBhd2FpdCBzaHV0ZG93bkV2ZW50UHJvbWlzZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkLmdldFN0YXR1cyA9IGQuX29sZEdldFN0YXR1cztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnZXZlbnQgdGltaW5ncycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgbm90IGFkZCB0aW1pbmdzIGlmIG5vdCB1c2luZyBvcHQtaW4gY2FwJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgc2Vzc2lvbiA9IGF3YWl0IHN0YXJ0U2Vzc2lvbihkZWZhdWx0Q2Fwcyk7XG4gICAgICAgIGxldCByZXMgPSBhd2FpdCBnZXRTZXNzaW9uKHNlc3Npb24uc2Vzc2lvbklkKTtcbiAgICAgICAgc2hvdWxkLm5vdC5leGlzdChyZXMuZXZlbnRzKTtcbiAgICAgICAgYXdhaXQgZW5kU2Vzc2lvbihzZXNzaW9uLnNlc3Npb25JZCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgYWRkIHN0YXJ0IHNlc3Npb24gdGltaW5ncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGNhcHMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0Q2Fwcywge2V2ZW50VGltaW5nczogdHJ1ZX0pO1xuICAgICAgICBsZXQgc2Vzc2lvbiA9IGF3YWl0IHN0YXJ0U2Vzc2lvbihjYXBzKTtcbiAgICAgICAgbGV0IHJlcyA9IChhd2FpdCBnZXRTZXNzaW9uKHNlc3Npb24uc2Vzc2lvbklkKSkudmFsdWU7XG4gICAgICAgIHNob3VsZC5leGlzdChyZXMuZXZlbnRzKTtcbiAgICAgICAgc2hvdWxkLmV4aXN0KHJlcy5ldmVudHMubmV3U2Vzc2lvblJlcXVlc3RlZCk7XG4gICAgICAgIHNob3VsZC5leGlzdChyZXMuZXZlbnRzLm5ld1Nlc3Npb25TdGFydGVkKTtcbiAgICAgICAgcmVzLmV2ZW50cy5uZXdTZXNzaW9uUmVxdWVzdGVkWzBdLnNob3VsZC5iZS5hKCdudW1iZXInKTtcbiAgICAgICAgcmVzLmV2ZW50cy5uZXdTZXNzaW9uU3RhcnRlZFswXS5zaG91bGQuYmUuYSgnbnVtYmVyJyk7XG4gICAgICAgIGF3YWl0IGVuZFNlc3Npb24oc2Vzc2lvbi5zZXNzaW9uSWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnZXhlY3V0ZSBkcml2ZXIgc2NyaXB0JywgZnVuY3Rpb24gKCkge1xuICAgICAgLy8gbW9jayBzb21lIG1ldGhvZHMgb24gQmFzZURyaXZlciB0aGF0IGFyZW4ndCBub3JtYWxseSB0aGVyZSBleGNlcHQgaW5cbiAgICAgIC8vIGEgZnVsbHkgYmxvd24gZHJpdmVyXG4gICAgICBsZXQgb3JpZ2luYWxGaW5kRWxlbWVudCwgc2Vzc2lvbklkO1xuICAgICAgYmVmb3JlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZC5hbGxvd0luc2VjdXJlID0gWydleGVjdXRlX2RyaXZlcl9zY3JpcHQnXTtcbiAgICAgICAgb3JpZ2luYWxGaW5kRWxlbWVudCA9IGQuZmluZEVsZW1lbnQ7XG4gICAgICAgIGQuZmluZEVsZW1lbnQgPSAoZnVuY3Rpb24gKHN0cmF0ZWd5LCBzZWxlY3Rvcikge1xuICAgICAgICAgIGlmIChzdHJhdGVneSA9PT0gJ2FjY2Vzc2liaWxpdHkgaWQnICYmIHNlbGVjdG9yID09PSAnYW1hemluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB7W1czQ19FTEVNRU5UX0tFWV06ICdlbGVtZW50LWlkLTEnfTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aHJvdyBuZXcgZXJyb3JzLk5vU3VjaEVsZW1lbnRFcnJvcignbm90IGZvdW5kJyk7XG4gICAgICAgIH0pLmJpbmQoZCk7XG4gICAgICB9KTtcblxuICAgICAgYmVmb3JlRWFjaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICh7c2Vzc2lvbklkfSA9IGF3YWl0IHN0YXJ0U2Vzc2lvbihkZWZhdWx0Q2FwcykpO1xuICAgICAgfSk7XG5cbiAgICAgIGFmdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZC5maW5kRWxlbWVudCA9IG9yaWdpbmFsRmluZEVsZW1lbnQ7XG4gICAgICB9KTtcblxuICAgICAgYWZ0ZXJFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXdhaXQgZW5kU2Vzc2lvbihzZXNzaW9uSWQpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgbm90IHdvcmsgdW5sZXNzIHRoZSBhbGxvd0luc2VjdXJlIGZlYXR1cmUgZmxhZyBpcyBzZXQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGQuX2FsbG93SW5zZWN1cmUgPSBkLmFsbG93SW5zZWN1cmU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZC5hbGxvd0luc2VjdXJlID0gW107XG4gICAgICAgICAgY29uc3Qgc2NyaXB0ID0gYHJldHVybiAnZm9vJ2A7XG4gICAgICAgICAgYXdhaXQgYXhpb3Moe1xuICAgICAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9zZXNzaW9uLyR7c2Vzc2lvbklkfS9hcm1vci9leGVjdXRlX2RyaXZlcmAsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IHtzY3JpcHQsIHR5cGU6ICd3ZCd9LFxuICAgICAgICAgIH0pLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkO1xuICAgICAgICAgIGF3YWl0IGVuZFNlc3Npb24oc2Vzc2lvbklkKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkLmFsbG93SW5zZWN1cmUgPSBkLl9hbGxvd0luc2VjdXJlO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBleGVjdXRlIGEgd2ViZHJpdmVyaW8gc2NyaXB0IGluIHRoZSBjb250ZXh0IG9mIHNlc3Npb24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHNjcmlwdCA9IGBcbiAgICAgICAgICBjb25zdCB0aW1lb3V0cyA9IGF3YWl0IGRyaXZlci5nZXRUaW1lb3V0cygpO1xuICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGRyaXZlci5zdGF0dXMoKTtcbiAgICAgICAgICByZXR1cm4gW3RpbWVvdXRzLCBzdGF0dXNdO1xuICAgICAgICBgO1xuICAgICAgICBjb25zdCB7dmFsdWV9ID0gKGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICB1cmw6IGBodHRwOi8vbG9jYWxob3N0OjgxODEvd2QvaHViL3Nlc3Npb24vJHtzZXNzaW9uSWR9L2FybW9yL2V4ZWN1dGVfZHJpdmVyYCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7c2NyaXB0LCB0eXBlOiAnd2ViZHJpdmVyaW8nfSxcbiAgICAgICAgfSkpLmRhdGE7XG4gICAgICAgIGNvbnN0IGV4cGVjdGVkVGltZW91dHMgPSB7Y29tbWFuZDogMjUwLCBpbXBsaWNpdDogMH07XG4gICAgICAgIGNvbnN0IGV4cGVjdGVkU3RhdHVzID0ge307XG4gICAgICAgIHZhbHVlLnJlc3VsdC5zaG91bGQuZXFsKFtleHBlY3RlZFRpbWVvdXRzLCBleHBlY3RlZFN0YXR1c10pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgZmFpbCB3aXRoIGFueSBzY3JpcHQgdHlwZSBvdGhlciB0aGFuIHdlYmRyaXZlcmlvIGN1cnJlbnRseScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3Qgc2NyaXB0ID0gYHJldHVybiAnZm9vJ2A7XG4gICAgICAgIGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICB1cmw6IGBodHRwOi8vbG9jYWxob3N0OjgxODEvd2QvaHViL3Nlc3Npb24vJHtzZXNzaW9uSWR9L2FybW9yL2V4ZWN1dGVfZHJpdmVyYCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7c2NyaXB0LCB0eXBlOiAnd2QnfSxcbiAgICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWQ7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBleGVjdXRlIGEgd2ViZHJpdmVyaW8gc2NyaXB0IHRoYXQgcmV0dXJucyBlbGVtZW50cyBjb3JyZWN0bHknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHNjcmlwdCA9IGBcbiAgICAgICAgICByZXR1cm4gYXdhaXQgZHJpdmVyLiQoXCJ+YW1hemluZ1wiKTtcbiAgICAgICAgYDtcbiAgICAgICAgY29uc3Qge3ZhbHVlfSA9IChhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9zZXNzaW9uLyR7c2Vzc2lvbklkfS9hcm1vci9leGVjdXRlX2RyaXZlcmAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgZGF0YToge3NjcmlwdH0sXG4gICAgICAgIH0pKS5kYXRhO1xuICAgICAgICB2YWx1ZS5yZXN1bHQuc2hvdWxkLmVxbCh7XG4gICAgICAgICAgW1czQ19FTEVNRU5UX0tFWV06ICdlbGVtZW50LWlkLTEnLFxuICAgICAgICAgIFtNSlNPTldQX0VMRU1FTlRfS0VZXTogJ2VsZW1lbnQtaWQtMSdcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBleGVjdXRlIGEgd2ViZHJpdmVyaW8gc2NyaXB0IHRoYXQgcmV0dXJucyBlbGVtZW50cyBpbiBkZWVwIHN0cnVjdHVyZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3Qgc2NyaXB0ID0gYFxuICAgICAgICAgIGNvbnN0IGVsID0gYXdhaXQgZHJpdmVyLiQoXCJ+YW1hemluZ1wiKTtcbiAgICAgICAgICByZXR1cm4ge2VsZW1lbnQ6IGVsLCBlbGVtZW50czogW2VsLCBlbF19O1xuICAgICAgICBgO1xuICAgICAgICBjb25zdCB7dmFsdWV9ID0gKGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICB1cmw6IGBodHRwOi8vbG9jYWxob3N0OjgxODEvd2QvaHViL3Nlc3Npb24vJHtzZXNzaW9uSWR9L2FybW9yL2V4ZWN1dGVfZHJpdmVyYCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7c2NyaXB0fSxcbiAgICAgICAgfSkpLmRhdGE7XG4gICAgICAgIGNvbnN0IGVsT2JqID0ge1xuICAgICAgICAgIFtXM0NfRUxFTUVOVF9LRVldOiAnZWxlbWVudC1pZC0xJyxcbiAgICAgICAgICBbTUpTT05XUF9FTEVNRU5UX0tFWV06ICdlbGVtZW50LWlkLTEnXG4gICAgICAgIH07XG4gICAgICAgIHZhbHVlLnJlc3VsdC5zaG91bGQuZXFsKHtlbGVtZW50OiBlbE9iaiwgZWxlbWVudHM6IFtlbE9iaiwgZWxPYmpdfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBzdG9yZSBhbmQgcmV0dXJuIGxvZ3MgdG8gdGhlIHVzZXInLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHNjcmlwdCA9IGBcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImZvb1wiKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImZvbzJcIik7XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiYmFyXCIpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJiYXpcIik7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGA7XG4gICAgICAgIGNvbnN0IHt2YWx1ZX0gPSAoYXdhaXQgYXhpb3Moe1xuICAgICAgICAgIHVybDogYGh0dHA6Ly9sb2NhbGhvc3Q6ODE4MS93ZC9odWIvc2Vzc2lvbi8ke3Nlc3Npb25JZH0vYXJtb3IvZXhlY3V0ZV9kcml2ZXJgLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHtzY3JpcHR9LFxuICAgICAgICB9KSkuZGF0YTtcbiAgICAgICAgdmFsdWUubG9ncy5zaG91bGQuZXFsKHtsb2c6IFsnZm9vJywgJ2ZvbzInXSwgd2FybjogWydiYXInXSwgZXJyb3I6IFsnYmF6J119KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGhhdmUgYXJtb3Igc3BlY2lmaWMgY29tbWFuZHMgYXZhaWxhYmxlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBzY3JpcHQgPSBgXG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBkcml2ZXIubG9jaztcbiAgICAgICAgYDtcbiAgICAgICAgY29uc3Qge3ZhbHVlfSA9IChhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9zZXNzaW9uLyR7c2Vzc2lvbklkfS9hcm1vci9leGVjdXRlX2RyaXZlcmAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgZGF0YToge3NjcmlwdH0sXG4gICAgICAgIH0pKS5kYXRhO1xuICAgICAgICB2YWx1ZS5yZXN1bHQuc2hvdWxkLmVxbCgnZnVuY3Rpb24nKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGNvcnJlY3RseSBoYW5kbGUgZXJyb3JzIHRoYXQgaGFwcGVuIGluIGEgd2ViZHJpdmVyaW8gc2NyaXB0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBzY3JpcHQgPSBgXG4gICAgICAgICAgcmV0dXJuIGF3YWl0IGRyaXZlci4kKFwifm5vdGZvdW5kXCIpO1xuICAgICAgICBgO1xuICAgICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9zZXNzaW9uLyR7c2Vzc2lvbklkfS9hcm1vci9leGVjdXRlX2RyaXZlcmAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICAgICAgZGF0YToge3NjcmlwdH0sXG4gICAgICAgIH0pO1xuICAgICAgICBkYXRhLnNob3VsZC5lcWwoe1xuICAgICAgICAgIHNlc3Npb25JZCxcbiAgICAgICAgICBzdGF0dXM6IDEzLFxuICAgICAgICAgIHZhbHVlOiB7bWVzc2FnZTogJ0FuIHVua25vd24gc2VydmVyLXNpZGUgZXJyb3Igb2NjdXJyZWQgd2hpbGUgcHJvY2Vzc2luZyB0aGUgY29tbWFuZC4gT3JpZ2luYWwgZXJyb3I6IENvdWxkIG5vdCBleGVjdXRlIGRyaXZlciBzY3JpcHQuIE9yaWdpbmFsIGVycm9yIHdhczogRXJyb3I6IG5vdCBmb3VuZCd9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgY29ycmVjdGx5IGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBhIHNjcmlwdCBjYW5ub3QgYmUgY29tcGlsZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHNjcmlwdCA9IGBcbiAgICAgICAgICByZXR1cm4geztcbiAgICAgICAgYDtcbiAgICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgIHVybDogYGh0dHA6Ly9sb2NhbGhvc3Q6ODE4MS93ZC9odWIvc2Vzc2lvbi8ke3Nlc3Npb25JZH0vYXJtb3IvZXhlY3V0ZV9kcml2ZXJgLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIHZhbGlkYXRlU3RhdHVzOiBudWxsLFxuICAgICAgICAgIGRhdGE6IHtzY3JpcHR9LFxuICAgICAgICB9KTtcbiAgICAgICAgc2Vzc2lvbklkLnNob3VsZC5lcWwoZGF0YS5zZXNzaW9uSWQpO1xuICAgICAgICBkYXRhLnN0YXR1cy5zaG91bGQuZXFsKDEzKTtcbiAgICAgICAgZGF0YS52YWx1ZS5zaG91bGQuaGF2ZS5wcm9wZXJ0eSgnbWVzc2FnZScpO1xuICAgICAgICBkYXRhLnZhbHVlLm1lc3NhZ2Uuc2hvdWxkLm1hdGNoKC9BbiB1bmtub3duIHNlcnZlci1zaWRlIGVycm9yIG9jY3VycmVkIHdoaWxlIHByb2Nlc3NpbmcgdGhlIGNvbW1hbmQuIE9yaWdpbmFsIGVycm9yOiBDb3VsZCBub3QgZXhlY3V0ZSBkcml2ZXIgc2NyaXB0LiBPcmlnaW5hbCBlcnJvciB3YXM6IEVycm9yOiBVbmV4cGVjdGVkIHRva2VuICc/Oyc/Lyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIHNldCBhIHRpbWVvdXQgb24gYSBkcml2ZXIgc2NyaXB0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBzY3JpcHQgPSBgXG4gICAgICAgICAgYXdhaXQgUHJvbWlzZS5kZWxheSgxMDAwKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgYDtcbiAgICAgICAgY29uc3Qge3ZhbHVlfSA9IChhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9zZXNzaW9uLyR7c2Vzc2lvbklkfS9hcm1vci9leGVjdXRlX2RyaXZlcmAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICAgICAgZGF0YToge3NjcmlwdCwgdGltZW91dDogNTB9LFxuICAgICAgICB9KSkuZGF0YTtcbiAgICAgICAgdmFsdWUubWVzc2FnZS5zaG91bGQubWF0Y2goLy4rNTAuK3RpbWVvdXQuKy8pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBiYXNlRHJpdmVyRTJFVGVzdHM7XG4iXSwibWFwcGluZ3MiOiI7Ozs7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
