"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
require("source-map-support/register");
var _2 = require("../..");
var _fakeDriver = require("./fake-driver");
var _lodash = _interopRequireDefault(require("lodash"));
var _axios = _interopRequireDefault(require("axios"));
var _chai = _interopRequireDefault(require("chai"));
var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));
var _sinon = _interopRequireDefault(require("sinon"));
var _httpStatusCodes = require("http-status-codes");
var _helpers = require("./helpers");
var _constants = require("../../lib/constants");
var _querystring = _interopRequireDefault(require("querystring"));
let should = _chai.default.should();
_chai.default.use(_chaiAsPromised.default);
const serverPort = 8181;
const baseUrl = `http://localhost:${serverPort}/wd/hub`;
describe('Protocol', function () {
  describe('direct to driver', function () {
    let d = new _fakeDriver.FakeDriver();
    it('should return response values directly from the driver', async function () {
      (await d.setUrl('http://google.com')).should.contain('google');
    });
  });
  describe('via express router', function () {
    let mjsonwpServer;
    let driver;
    before(async function () {
      driver = new _fakeDriver.FakeDriver();
      driver.sessionId = 'foo';
      mjsonwpServer = await (0, _2.server)({
        routeConfiguringFunction: (0, _2.routeConfiguringFunction)(driver),
        port: serverPort
      });
    });
    after(async function () {
      await mjsonwpServer.close();
    });
    it('should proxy to driver and return valid jsonwp response', async function () {
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        data: {
          url: 'http://google.com'
        }
      });
      data.should.eql({
        status: 0,
        value: 'Navigated to: http://google.com',
        sessionId: 'foo'
      });
    });
    it('should assume requests without a Content-Type are json requests', async function () {
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        data: {
          url: 'http://google.com'
        }
      });
      data.should.eql({
        status: 0,
        value: 'Navigated to: http://google.com',
        sessionId: 'foo'
      });
    });
    it('should respond to x-www-form-urlencoded as well as json requests', async function () {
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/url`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        data: _querystring.default.stringify({
          url: 'http://google.com'
        })
      });
      data.should.eql({
        status: 0,
        value: 'Navigated to: http://google.com',
        sessionId: 'foo'
      });
    });
    it('should include url request parameters for methods to use - sessionid', async function () {
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/back`,
        method: 'POST',
        data: {}
      });
      data.should.eql({
        status: 0,
        value: 'foo',
        sessionId: 'foo'
      });
    });
    it('should include url request parameters for methods to use - elementid', async function () {
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/element/bar/click`,
        method: 'POST',
        data: {}
      });
      data.status.should.equal(0);
      data.value.should.eql(['bar', 'foo']);
    });
    it('should include url req params in the order: custom, element, session', async function () {
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/element/bar/attribute/baz`
      });
      data.status.should.equal(0);
      data.value.should.eql(['baz', 'bar', 'foo']);
    });
    it('should respond with 400 Bad Request if parameters missing', async function () {
      const {
        data,
        status
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        data: {},
        validateStatus: null
      });
      status.should.equal(400);
      JSON.stringify(data).should.contain('url');
    });
    it('should reject requests with a badly formatted body and not crash', async function () {
      await (0, _axios.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        data: 'oh hello'
      }).should.eventually.be.rejected;
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        data: {
          url: 'http://google.com'
        }
      });
      data.should.eql({
        status: 0,
        value: 'Navigated to: http://google.com',
        sessionId: 'foo'
      });
    });
    it('should get 404 for bad routes', async function () {
      await (0, _axios.default)({
        url: `${baseUrl}/blargimarg`
      }).should.eventually.be.rejectedWith(/404/);
    });
    it('4xx responses should have content-type of application/json', async function () {
      const {
        headers
      } = await (0, _axios.default)({
        url: `${baseUrl}/blargimargarita`,
        validateStatus: null
      });
      headers['content-type'].should.include('application/json');
    });
    it('should throw not yet implemented for unfilledout commands', async function () {
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/element/bar/location`,
        validateStatus: null
      });
      status.should.equal(501);
      data.should.eql({
        status: 405,
        value: {
          message: 'Method has not yet been implemented'
        },
        sessionId: 'foo'
      });
    });
    it('should throw not implemented for ignored commands', async function () {
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/buttonup`,
        method: 'POST',
        validateStatus: null,
        data: {}
      });
      status.should.equal(501);
      data.should.eql({
        status: 405,
        value: {
          message: 'Method has not yet been implemented'
        },
        sessionId: 'foo'
      });
    });
    it('should get 400 for bad parameters', async function () {
      await (0, _axios.default)({
        url: `${baseUrl}/session/foo/url`,
        method: 'POST',
        data: {}
      }).should.eventually.be.rejectedWith(/400/);
    });
    it('should ignore special extra payload params in the right contexts', async function () {
      await (0, _axios.default)({
        url: `${baseUrl}/session/foo/element/bar/value`,
        method: 'POST',
        data: {
          id: 'baz',
          sessionId: 'lol',
          value: ['a']
        }
      });
      await (0, _axios.default)({
        url: `${baseUrl}/session/foo/element/bar/value`,
        method: 'POST',
        data: {
          id: 'baz'
        }
      }).should.eventually.be.rejectedWith(/400/);
      await (0, _axios.default)({
        url: `${baseUrl}/session/foo/frame`,
        method: 'POST',
        data: {
          id: 'baz'
        }
      });
    });
    it('should return the correct error even if driver does not throw', async function () {
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/armor/receive_async_response`,
        method: 'POST',
        data: {
          response: 'baz'
        },
        validateStatus: null
      });
      status.should.equal(500);
      data.should.eql({
        status: 13,
        value: {
          message: 'An unknown server-side error occurred while processing ' + 'the command. Original error: Mishandled Driver Error'
        },
        sessionId: 'foo'
      });
    });
    describe('w3c sendkeys migration', function () {
      it('should accept value for sendkeys', async function () {
        const {
          data
        } = await (0, _axios.default)({
          url: `${baseUrl}/session/foo/element/bar/value`,
          method: 'POST',
          data: {
            value: 'text to type'
          }
        });
        data.status.should.equal(0);
        data.value.should.eql(['text to type', 'bar']);
      });
      it('should accept text for sendkeys', async function () {
        const {
          data
        } = await (0, _axios.default)({
          url: `${baseUrl}/session/foo/element/bar/value`,
          method: 'POST',
          data: {
            text: 'text to type'
          }
        });
        data.status.should.equal(0);
        data.value.should.eql(['text to type', 'bar']);
      });
      it('should accept value and text for sendkeys, and use value', async function () {
        const {
          data
        } = await (0, _axios.default)({
          url: `${baseUrl}/session/foo/element/bar/value`,
          method: 'POST',
          data: {
            value: 'text to type',
            text: 'text to ignore'
          }
        });
        data.status.should.equal(0);
        data.value.should.eql(['text to type', 'bar']);
      });
    });
    describe('multiple sets of arguments', function () {
      describe('optional', function () {
        it('should allow moveto with element', async function () {
          const {
            data
          } = await (0, _axios.default)({
            url: `${baseUrl}/session/foo/moveto`,
            method: 'POST',
            data: {
              element: '3'
            }
          });
          data.status.should.equal(0);
          data.value.should.eql(['3', null, null]);
        });
        it('should allow moveto with xoffset/yoffset', async function () {
          const {
            data
          } = await (0, _axios.default)({
            url: `${baseUrl}/session/foo/moveto`,
            method: 'POST',
            data: {
              xoffset: 42,
              yoffset: 17
            }
          });
          data.status.should.equal(0);
          data.value.should.eql([null, 42, 17]);
        });
      });
      describe('required', function () {
        it('should allow removeApp with appId', async function () {
          const {
            data
          } = await (0, _axios.default)({
            url: `${baseUrl}/session/foo/armor/device/remove_app`,
            method: 'POST',
            data: {
              appId: 42
            }
          });
          data.status.should.equal(0);
          data.value.should.eql(42);
        });
        it('should allow removeApp with bundleId', async function () {
          const {
            data
          } = await (0, _axios.default)({
            url: `${baseUrl}/session/foo/armor/device/remove_app`,
            method: 'POST',
            data: {
              bundleId: 42
            }
          });
          data.status.should.equal(0);
          data.value.should.eql(42);
        });
      });
    });
    describe('default param wrap', function () {
      it('should wrap', async function () {
        const {
          data
        } = await (0, _axios.default)({
          url: `${baseUrl}/session/foo/touch/perform`,
          method: 'POST',
          data: [{
            'action': 'tap',
            'options': {
              'element': '3'
            }
          }]
        });
        data.value.should.deep.equal([[{
          'action': 'tap',
          'options': {
            'element': '3'
          }
        }], 'foo']);
      });
      it('should not wrap twice', async function () {
        const {
          data
        } = await (0, _axios.default)({
          url: `${baseUrl}/session/foo/touch/perform`,
          method: 'POST',
          data: {
            actions: [{
              'action': 'tap',
              'options': {
                'element': '3'
              }
            }]
          }
        });
        data.value.should.deep.equal([[{
          'action': 'tap',
          'options': {
            'element': '3'
          }
        }], 'foo']);
      });
    });
    describe('create sessions via HTTP endpoint', function () {
      let desiredCapabilities = {
        a: 'b'
      };
      let requiredCapabilities = {
        c: 'd'
      };
      let capabilities = {
        e: 'f'
      };
      let sessionId;
      beforeEach(function () {
        sessionId = null;
      });
      afterEach(async function () {
        if (sessionId) {
          await _axios.default.delete(`${baseUrl}/session/${sessionId}`);
        }
      });
      it('should allow create session with desired caps (MJSONWP)', async function () {
        const {
          data
        } = await (0, _axios.default)({
          url: `${baseUrl}/session`,
          method: 'POST',
          data: {
            desiredCapabilities
          }
        });
        sessionId = data.sessionId;
        data.status.should.equal(0);
        data.value.should.eql(desiredCapabilities);
      });
      it('should allow create session with desired and required caps', async function () {
        const {
          data
        } = await (0, _axios.default)({
          url: `${baseUrl}/session`,
          method: 'POST',
          data: {
            desiredCapabilities,
            requiredCapabilities
          }
        });
        sessionId = data.sessionId;
        data.status.should.equal(0);
        data.value.should.eql(_lodash.default.extend({}, desiredCapabilities, requiredCapabilities));
      });
      it('should fail to create session without capabilities or desiredCapabilities', async function () {
        await (0, _axios.default)({
          url: `${baseUrl}/session`,
          method: 'POST',
          data: {}
        }).should.eventually.be.rejectedWith(/400/);
      });
      it('should allow create session with capabilities (W3C)', async function () {
        const {
          data
        } = await (0, _axios.default)({
          url: `${baseUrl}/session`,
          method: 'POST',
          data: {
            capabilities
          }
        });
        sessionId = data.sessionId;
        should.not.exist(data.status);
        should.not.exist(data.sessionId);
        data.value.capabilities.should.eql(capabilities);
        data.value.sessionId.should.exist;
      });
      it('should fall back to MJSONWP if driver does not support W3C yet', async function () {
        const createSessionStub = _sinon.default.stub(driver, 'createSession').callsFake(function (capabilities) {
          driver.sessionId = null;
          return _2.BaseDriver.prototype.createSession.call(driver, capabilities);
        });
        try {
          let caps = {
            ...desiredCapabilities,
            platformName: 'Fake',
            deviceName: 'Fake'
          };
          const {
            data
          } = await (0, _axios.default)({
            url: `${baseUrl}/session`,
            method: 'POST',
            data: {
              desiredCapabilities: caps,
              capabilities: {
                alwaysMatch: caps,
                firstMatch: [{}]
              }
            }
          });
          sessionId = data.sessionId;
          should.exist(data.status);
          should.exist(data.sessionId);
          data.value.should.eql(caps);
        } finally {
          createSessionStub.restore();
        }
      });
      describe('w3c endpoints', function () {
        let w3cCaps = {
          alwaysMatch: {
            platformName: 'Fake',
            deviceName: 'Commodore 64'
          },
          firstMatch: [{}]
        };
        let sessionUrl;
        beforeEach(async function () {
          const {
            value
          } = (await (0, _axios.default)({
            url: `${baseUrl}/session`,
            method: 'POST',
            data: {
              capabilities: w3cCaps
            }
          })).data;
          sessionId = value.sessionId;
          sessionUrl = `${baseUrl}/session/${sessionId}`;
        });
        it(`should throw 400 Bad Parameters exception if the parameters are bad`, async function () {
          const {
            status,
            data
          } = await (0, _axios.default)({
            url: `${sessionUrl}/actions`,
            method: 'POST',
            validateStatus: null,
            data: {
              bad: 'params'
            }
          });
          status.should.equal(400);
          const {
            error: w3cError,
            message,
            stacktrace
          } = data.value;
          message.should.match(/Parameters were incorrect/);
          stacktrace.should.match(/protocol.js/);
          w3cError.should.be.a.string;
          w3cError.should.equal(_2.errors.InvalidArgumentError.error());
        });
        it(`should throw 405 exception if the command hasn't been implemented yet`, async function () {
          const {
            status,
            data
          } = await (0, _axios.default)({
            url: `${sessionUrl}/actions`,
            method: 'POST',
            validateStatus: null,
            data: {
              actions: []
            }
          });
          status.should.equal(405);
          const {
            error: w3cError,
            message,
            stacktrace
          } = data.value;
          message.should.match(/Method has not yet been implemented/);
          stacktrace.should.match(/protocol.js/);
          w3cError.should.be.a.string;
          w3cError.should.equal(_2.errors.NotYetImplementedError.error());
          message.should.match(/Method has not yet been implemented/);
        });
        it(`should throw 500 Unknown Error if the command throws an unexpected exception`, async function () {
          driver.performActions = () => {
            throw new Error(`Didn't work`);
          };
          const {
            status,
            data
          } = await (0, _axios.default)({
            url: `${sessionUrl}/actions`,
            method: 'POST',
            validateStatus: null,
            data: {
              actions: []
            }
          });
          status.should.equal(500);
          const {
            error: w3cError,
            message,
            stacktrace
          } = data.value;
          stacktrace.should.match(/protocol.js/);
          w3cError.should.be.a.string;
          w3cError.should.equal(_2.errors.UnknownError.error());
          message.should.match(/Didn't work/);
          delete driver.performActions;
        });
        it(`should translate element format from MJSONWP to W3C`, async function () {
          const retValue = [{
            something: {
              [_constants.MJSONWP_ELEMENT_KEY]: 'fooo',
              other: 'bar'
            }
          }, {
            [_constants.MJSONWP_ELEMENT_KEY]: 'bar'
          }, 'ignore'];
          const expectedValue = [{
            something: {
              [_constants.MJSONWP_ELEMENT_KEY]: 'fooo',
              [_constants.W3C_ELEMENT_KEY]: 'fooo',
              other: 'bar'
            }
          }, {
            [_constants.MJSONWP_ELEMENT_KEY]: 'bar',
            [_constants.W3C_ELEMENT_KEY]: 'bar'
          }, 'ignore'];
          const findElementsBackup = driver.findElements;
          driver.findElements = () => retValue;
          const {
            data
          } = await _axios.default.post(`${sessionUrl}/elements`, {
            using: 'whatever',
            value: 'whatever'
          });
          data.value.should.eql(expectedValue);
          driver.findElements = findElementsBackup;
        });
        it(`should fail with a 408 error if it throws a TimeoutError exception`, async function () {
          let setUrlStub = _sinon.default.stub(driver, 'setUrl').callsFake(function () {
            throw new _2.errors.TimeoutError();
          });
          const {
            status,
            data
          } = await (0, _axios.default)({
            url: `${sessionUrl}/url`,
            method: 'POST',
            validateStatus: null,
            data: {
              url: 'https://example.com/'
            }
          });
          status.should.equal(408);
          const {
            error: w3cError,
            message,
            stacktrace
          } = data.value;
          stacktrace.should.match(/protocol.js/);
          w3cError.should.be.a.string;
          w3cError.should.equal(_2.errors.TimeoutError.error());
          message.should.match(/An operation did not complete before its timeout expired/);
          setUrlStub.restore();
        });
        it(`should pass with 200 HTTP status code if the command returns a value`, async function () {
          driver.performActions = actions => 'It works ' + actions.join('');
          const {
            status,
            value,
            sessionId
          } = (await _axios.default.post(`${sessionUrl}/actions`, {
            actions: ['a', 'b', 'c']
          })).data;
          should.not.exist(sessionId);
          should.not.exist(status);
          value.should.equal('It works abc');
          delete driver.performActions;
        });
        describe('jwproxy', function () {
          const port = 56562;
          let server, jwproxy, app;
          beforeEach(function () {
            const res = (0, _helpers.createProxyServer)(sessionId, port);
            server = res.server;
            app = res.app;
            jwproxy = new _2.JWProxy({
              host: 'localhost',
              port
            });
            jwproxy.sessionId = sessionId;
            driver.performActions = async actions => await jwproxy.command('/perform-actions', 'POST', actions);
          });
          afterEach(async function () {
            delete driver.performActions;
            await server.close();
          });
          it('should work if a proxied request returns a response with status 200', async function () {
            app.post('/wd/hub/session/:sessionId/perform-actions', (req, res) => {
              res.json({
                sessionId: req.params.sessionId,
                value: req.body,
                status: 0
              });
            });
            const {
              status,
              value,
              sessionId
            } = (await _axios.default.post(`${sessionUrl}/actions`, {
              actions: [1, 2, 3]
            })).data;
            value.should.eql([1, 2, 3]);
            should.not.exist(status);
            should.not.exist(sessionId);
          });
          it('should return error if a proxied request returns a MJSONWP error response', async function () {
            app.post('/wd/hub/session/:sessionId/perform-actions', (req, res) => {
              res.status(500).json({
                sessionId,
                status: 6,
                value: 'A problem occurred'
              });
            });
            const {
              status,
              data
            } = await (0, _axios.default)({
              url: `${sessionUrl}/actions`,
              method: 'POST',
              validateStatus: null,
              data: {
                actions: [1, 2, 3]
              }
            });
            status.should.equal(_httpStatusCodes.StatusCodes.NOT_FOUND);
            JSON.stringify(data).should.match(/A problem occurred/);
          });
          it('should return W3C error if a proxied request returns a W3C error response', async function () {
            const error = new Error(`Some error occurred`);
            error.w3cStatus = 414;
            const executeCommandStub = _sinon.default.stub(driver, 'executeCommand').returns({
              protocol: 'W3C',
              error
            });
            const {
              status,
              data
            } = await (0, _axios.default)({
              url: `${sessionUrl}/actions`,
              method: 'POST',
              validateStatus: null,
              data: {
                actions: [1, 2, 3]
              }
            });
            status.should.equal(414);
            const {
              error: w3cError,
              message: errMessage,
              stacktrace
            } = data.value;
            w3cError.should.equal('unknown error');
            stacktrace.should.match(/Some error occurred/);
            errMessage.should.equal('Some error occurred');
            executeCommandStub.restore();
          });
          it('should return error if a proxied request returns a MJSONWP error response but HTTP status code is 200', async function () {
            app.post('/wd/hub/session/:sessionId/perform-actions', (req, res) => {
              res.status(200).json({
                sessionId: 'Fake Session Id',
                status: 7,
                value: 'A problem occurred'
              });
            });
            const {
              status,
              data
            } = await (0, _axios.default)({
              url: `${sessionUrl}/actions`,
              method: 'POST',
              validateStatus: null,
              data: {
                actions: [1, 2, 3]
              }
            });
            status.should.equal(_httpStatusCodes.StatusCodes.NOT_FOUND);
            const {
              error: w3cError,
              message: errMessage,
              stacktrace
            } = data.value;
            w3cError.should.equal('no such element');
            errMessage.should.match(/A problem occurred/);
            stacktrace.should.exist;
          });
          it('should return error if a proxied request returns a W3C error response', async function () {
            app.post('/wd/hub/session/:sessionId/perform-actions', (req, res) => {
              res.status(404).json({
                value: {
                  error: 'no such element',
                  message: 'does not make a difference',
                  stacktrace: 'arbitrary stacktrace'
                }
              });
            });
            const {
              status,
              data
            } = await (0, _axios.default)({
              url: `${sessionUrl}/actions`,
              method: 'POST',
              validateStatus: null,
              data: {
                actions: [1, 2, 3]
              }
            });
            status.should.equal(_httpStatusCodes.StatusCodes.NOT_FOUND);
            const {
              error: w3cError,
              stacktrace
            } = data.value;
            w3cError.should.equal('no such element');
            stacktrace.should.match(/arbitrary stacktrace/);
          });
          it('should return an error if a proxied request returns a W3C error response', async function () {
            app.post('/wd/hub/session/:sessionId/perform-actions', (req, res) => {
              res.set('Connection', 'close');
              res.status(444).json({
                value: {
                  error: 'bogus error code',
                  message: 'does not make a difference',
                  stacktrace: 'arbitrary stacktrace'
                }
              });
            });
            const {
              status,
              data
            } = await (0, _axios.default)({
              url: `${sessionUrl}/actions`,
              method: 'POST',
              validateStatus: null,
              data: {
                actions: [1, 2, 3]
              }
            });
            status.should.equal(_httpStatusCodes.StatusCodes.INTERNAL_SERVER_ERROR);
            const {
              error: w3cError,
              stacktrace
            } = data.value;
            w3cError.should.equal('unknown error');
            stacktrace.should.match(/arbitrary stacktrace/);
          });
        });
      });
    });
    it('should handle commands with no response values', async function () {
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/forward`,
        method: 'POST'
      });
      data.should.eql({
        status: 0,
        value: null,
        sessionId: 'foo'
      });
    });
    it('should allow empty string response values', async function () {
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/element/bar/text`
      });
      data.should.eql({
        status: 0,
        value: '',
        sessionId: 'foo'
      });
    });
    it('should send 500 response and an Unknown object for rejected commands', async function () {
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo/refresh`,
        method: 'POST',
        validateStatus: null
      });
      status.should.equal(500);
      data.should.eql({
        status: 13,
        value: {
          message: 'An unknown server-side error occurred while processing ' + 'the command. Original error: Too Fresh!'
        },
        sessionId: 'foo'
      });
    });
    it('should not throw UnknownError when known', async function () {
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/foo`,
        validateStatus: null
      });
      status.should.equal(404);
      data.should.eql({
        status: 6,
        value: {
          message: 'A session is either terminated or not started'
        },
        sessionId: 'foo'
      });
    });
  });
  describe('session Ids', function () {
    let driver = new _fakeDriver.FakeDriver();
    let mjsonwpServer;
    before(async function () {
      mjsonwpServer = await (0, _2.server)({
        routeConfiguringFunction: (0, _2.routeConfiguringFunction)(driver),
        port: serverPort
      });
    });
    after(async function () {
      await mjsonwpServer.close();
    });
    afterEach(function () {
      driver.sessionId = null;
    });
    it('should return null SessionId for commands without sessionIds', async function () {
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/status`
      });
      should.equal(data.sessionId, null);
    });
    it('responds with the same session ID in the request', async function () {
      let sessionId = 'Vader Sessions';
      driver.sessionId = sessionId;
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        data: {
          url: 'http://google.com'
        }
      });
      should.exist(data.sessionId);
      data.sessionId.should.eql(sessionId);
    });
    it('yells if no session exists', async function () {
      let sessionId = 'Vader Sessions';
      const {
        data,
        status
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        validateStatus: null,
        data: {
          url: 'http://google.com'
        }
      });
      status.should.equal(404);
      data.status.should.equal(6);
      data.value.message.should.contain('session');
    });
    it('yells if invalid session is sent', async function () {
      let sessionId = 'Vader Sessions';
      driver.sessionId = 'recession';
      const {
        data,
        status
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        validateStatus: null,
        data: {
          url: 'http://google.com'
        }
      });
      status.should.equal(404);
      data.status.should.equal(6);
      data.value.message.should.contain('session');
    });
    it('should have session IDs in error responses', async function () {
      let sessionId = 'Vader Sessions';
      driver.sessionId = sessionId;
      const {
        data,
        status
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/${sessionId}/refresh`,
        method: 'POST',
        validateStatus: null
      });
      status.should.equal(500);
      data.should.eql({
        status: 13,
        value: {
          message: 'An unknown server-side error occurred while processing ' + 'the command. Original error: Too Fresh!'
        },
        sessionId
      });
    });
    it('should return a new session ID on create', async function () {
      const {
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session`,
        method: 'POST',
        data: {
          desiredCapabilities: {
            greeting: 'hello'
          },
          requiredCapabilities: {
            valediction: 'bye'
          }
        }
      });
      should.exist(data.sessionId);
      data.sessionId.indexOf('fakeSession_').should.equal(0);
      data.value.should.eql({
        greeting: 'hello',
        valediction: 'bye'
      });
    });
  });
  describe('via drivers jsonwp proxy', function () {
    let driver;
    let sessionId = 'foo';
    let mjsonwpServer;
    beforeEach(async function () {
      driver = new _fakeDriver.FakeDriver();
      driver.sessionId = sessionId;
      driver.proxyActive = () => true;
      driver.canProxy = () => true;
      mjsonwpServer = await (0, _2.server)({
        routeConfiguringFunction: (0, _2.routeConfiguringFunction)(driver),
        port: serverPort
      });
    });
    afterEach(async function () {
      await mjsonwpServer.close();
    });
    it('should give a nice error if proxying is set but no proxy function exists', async function () {
      driver.canProxy = () => false;
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        validateStatus: null,
        data: {
          url: 'http://google.com'
        }
      });
      status.should.equal(500);
      data.should.eql({
        status: 13,
        value: {
          message: 'An unknown server-side error occurred while processing ' + 'the command. Original error: Trying to proxy to a JSONWP ' + 'server but driver is unable to proxy'
        },
        sessionId
      });
    });
    it('should pass on any errors in proxying', async function () {
      driver.proxyReqRes = async function () {
        throw new Error('foo');
      };
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        validateStatus: null,
        data: {
          url: 'http://google.com'
        }
      });
      status.should.equal(500);
      data.should.eql({
        status: 13,
        value: {
          message: 'An unknown server-side error occurred while processing ' + 'the command. Original error: Could not proxy. Proxy ' + 'error: foo'
        },
        sessionId
      });
    });
    it('should able to throw ProxyRequestError in proxying', async function () {
      driver.proxyReqRes = async function () {
        let jsonwp = {
          status: 35,
          value: 'No such context found.',
          sessionId: 'foo'
        };
        throw new _2.errors.ProxyRequestError(`Could not proxy command to remote server. `, jsonwp);
      };
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        validateStatus: null,
        data: {
          url: 'http://google.com'
        }
      });
      status.should.equal(500);
      data.should.eql({
        status: 35,
        value: {
          message: 'No such context found.'
        },
        sessionId: 'foo'
      });
    });
    it('should let the proxy handle req/res', async function () {
      driver.proxyReqRes = async function (req, res) {
        res.status(200).json({
          custom: 'data'
        });
      };
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        data: {
          url: 'http://google.com'
        }
      });
      status.should.equal(200);
      data.should.eql({
        custom: 'data'
      });
    });
    it('should avoid jsonwp proxying when path matches avoidance list', async function () {
      driver.getProxyAvoidList = () => [['POST', new RegExp('^/session/[^/]+/url$')]];
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/session/${sessionId}/url`,
        method: 'POST',
        data: {
          url: 'http://google.com'
        }
      });
      status.should.equal(200);
      data.should.eql({
        status: 0,
        value: 'Navigated to: http://google.com',
        sessionId
      });
    });
    it('should fail if avoid proxy list is malformed in some way', async function () {
      async function badProxyAvoidanceList(list) {
        driver.getProxyAvoidList = () => list;
        const {
          status,
          data
        } = await (0, _axios.default)({
          url: `${baseUrl}/session/${sessionId}/url`,
          method: 'POST',
          validateStatus: null,
          data: {
            url: 'http://google.com'
          }
        });
        status.should.equal(500);
        data.status.should.equal(13);
        data.value.message.should.contain('roxy');
      }
      const lists = ['foo', [['foo']], [['BAR', /lol/]], [['GET', 'foo']]];
      for (let list of lists) {
        await badProxyAvoidanceList(list);
      }
    });
    it('should avoid proxying non-session commands even if not in the list', async function () {
      driver.getProxyAvoidList = () => [['POST', new RegExp('')]];
      const {
        status,
        data
      } = await (0, _axios.default)({
        url: `${baseUrl}/status`
      });
      status.should.equal(200);
      data.should.eql({
        status: 0,
        value: "I'm fine",
        sessionId: null
      });
    });
    it('should avoid proxying deleteSession commands', async function () {
      driver.getProxyAvoidList = () => [['POST', new RegExp('')]];
      driver.sessionId.should.equal(sessionId);
      const {
        status
      } = await _axios.default.delete(`${baseUrl}/session/${sessionId}`);
      status.should.equal(200);
      should.not.exist(driver.sessionId);
      driver.jwpProxyActive.should.be.false;
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC9wcm90b2NvbC9wcm90b2NvbC1lMmUtc3BlY3MuanMiLCJuYW1lcyI6WyJfMiIsInJlcXVpcmUiLCJfZmFrZURyaXZlciIsIl9sb2Rhc2giLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwiX2F4aW9zIiwiX2NoYWkiLCJfY2hhaUFzUHJvbWlzZWQiLCJfc2lub24iLCJfaHR0cFN0YXR1c0NvZGVzIiwiX2hlbHBlcnMiLCJfY29uc3RhbnRzIiwiX3F1ZXJ5c3RyaW5nIiwic2hvdWxkIiwiY2hhaSIsInVzZSIsImNoYWlBc1Byb21pc2VkIiwic2VydmVyUG9ydCIsImJhc2VVcmwiLCJkZXNjcmliZSIsImQiLCJGYWtlRHJpdmVyIiwiaXQiLCJzZXRVcmwiLCJjb250YWluIiwibWpzb253cFNlcnZlciIsImRyaXZlciIsImJlZm9yZSIsInNlc3Npb25JZCIsInNlcnZlciIsInJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbiIsInBvcnQiLCJhZnRlciIsImNsb3NlIiwiZGF0YSIsImF4aW9zIiwidXJsIiwibWV0aG9kIiwiZXFsIiwic3RhdHVzIiwidmFsdWUiLCJoZWFkZXJzIiwicXMiLCJzdHJpbmdpZnkiLCJlcXVhbCIsInZhbGlkYXRlU3RhdHVzIiwiSlNPTiIsImV2ZW50dWFsbHkiLCJiZSIsInJlamVjdGVkIiwicmVqZWN0ZWRXaXRoIiwiaW5jbHVkZSIsIm1lc3NhZ2UiLCJpZCIsInJlc3BvbnNlIiwidGV4dCIsImVsZW1lbnQiLCJ4b2Zmc2V0IiwieW9mZnNldCIsImFwcElkIiwiYnVuZGxlSWQiLCJkZWVwIiwiYWN0aW9ucyIsImRlc2lyZWRDYXBhYmlsaXRpZXMiLCJhIiwicmVxdWlyZWRDYXBhYmlsaXRpZXMiLCJjIiwiY2FwYWJpbGl0aWVzIiwiZSIsImJlZm9yZUVhY2giLCJhZnRlckVhY2giLCJkZWxldGUiLCJfIiwiZXh0ZW5kIiwibm90IiwiZXhpc3QiLCJjcmVhdGVTZXNzaW9uU3R1YiIsInNpbm9uIiwic3R1YiIsImNhbGxzRmFrZSIsIkJhc2VEcml2ZXIiLCJwcm90b3R5cGUiLCJjcmVhdGVTZXNzaW9uIiwiY2FsbCIsImNhcHMiLCJwbGF0Zm9ybU5hbWUiLCJkZXZpY2VOYW1lIiwiYWx3YXlzTWF0Y2giLCJmaXJzdE1hdGNoIiwicmVzdG9yZSIsInczY0NhcHMiLCJzZXNzaW9uVXJsIiwiYmFkIiwiZXJyb3IiLCJ3M2NFcnJvciIsInN0YWNrdHJhY2UiLCJtYXRjaCIsInN0cmluZyIsImVycm9ycyIsIkludmFsaWRBcmd1bWVudEVycm9yIiwiTm90WWV0SW1wbGVtZW50ZWRFcnJvciIsInBlcmZvcm1BY3Rpb25zIiwiRXJyb3IiLCJVbmtub3duRXJyb3IiLCJyZXRWYWx1ZSIsInNvbWV0aGluZyIsIk1KU09OV1BfRUxFTUVOVF9LRVkiLCJvdGhlciIsImV4cGVjdGVkVmFsdWUiLCJXM0NfRUxFTUVOVF9LRVkiLCJmaW5kRWxlbWVudHNCYWNrdXAiLCJmaW5kRWxlbWVudHMiLCJwb3N0IiwidXNpbmciLCJzZXRVcmxTdHViIiwiVGltZW91dEVycm9yIiwiam9pbiIsImp3cHJveHkiLCJhcHAiLCJyZXMiLCJjcmVhdGVQcm94eVNlcnZlciIsIkpXUHJveHkiLCJob3N0IiwiY29tbWFuZCIsInJlcSIsImpzb24iLCJwYXJhbXMiLCJib2R5IiwiSFRUUFN0YXR1c0NvZGVzIiwiTk9UX0ZPVU5EIiwidzNjU3RhdHVzIiwiZXhlY3V0ZUNvbW1hbmRTdHViIiwicmV0dXJucyIsInByb3RvY29sIiwiZXJyTWVzc2FnZSIsInNldCIsIklOVEVSTkFMX1NFUlZFUl9FUlJPUiIsImdyZWV0aW5nIiwidmFsZWRpY3Rpb24iLCJpbmRleE9mIiwicHJveHlBY3RpdmUiLCJjYW5Qcm94eSIsInByb3h5UmVxUmVzIiwianNvbndwIiwiUHJveHlSZXF1ZXN0RXJyb3IiLCJjdXN0b20iLCJnZXRQcm94eUF2b2lkTGlzdCIsIlJlZ0V4cCIsImJhZFByb3h5QXZvaWRhbmNlTGlzdCIsImxpc3QiLCJsaXN0cyIsImp3cFByb3h5QWN0aXZlIiwiZmFsc2UiXSwic291cmNlUm9vdCI6Ii4uLy4uLy4uIiwic291cmNlcyI6WyJ0ZXN0L3Byb3RvY29sL3Byb3RvY29sLWUyZS1zcGVjcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0cmFuc3BpbGU6bW9jaGFcblxuaW1wb3J0IHtcbiAgc2VydmVyLCByb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb24sIGVycm9ycywgSldQcm94eSwgQmFzZURyaXZlclxufSBmcm9tICcuLi8uLic7XG5pbXBvcnQgeyBGYWtlRHJpdmVyIH0gZnJvbSAnLi9mYWtlLWRyaXZlcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHNpbm9uIGZyb20gJ3Npbm9uJztcbmltcG9ydCB7IFN0YXR1c0NvZGVzIGFzIEhUVFBTdGF0dXNDb2RlcyB9IGZyb20gJ2h0dHAtc3RhdHVzLWNvZGVzJztcbmltcG9ydCB7IGNyZWF0ZVByb3h5U2VydmVyIH0gZnJvbSAnLi9oZWxwZXJzJztcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuaW1wb3J0IHsgTUpTT05XUF9FTEVNRU5UX0tFWSwgVzNDX0VMRU1FTlRfS0VZIH0gZnJvbSAnLi4vLi4vbGliL2NvbnN0YW50cyc7XG5pbXBvcnQgcXMgZnJvbSAncXVlcnlzdHJpbmcnO1xuXG5cbmxldCBzaG91bGQgPSBjaGFpLnNob3VsZCgpO1xuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuXG5jb25zdCBzZXJ2ZXJQb3J0ID0gODE4MTtcbmNvbnN0IGJhc2VVcmwgPSBgaHR0cDovL2xvY2FsaG9zdDoke3NlcnZlclBvcnR9L3dkL2h1YmA7XG5cbmRlc2NyaWJlKCdQcm90b2NvbCcsIGZ1bmN0aW9uICgpIHtcblxuICAvL1RPRE86IG1vcmUgdGVzdHMhOlxuICAvLyBVbmtub3duIGNvbW1hbmRzIHNob3VsZCByZXR1cm4gNDA0XG5cbiAgZGVzY3JpYmUoJ2RpcmVjdCB0byBkcml2ZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGQgPSBuZXcgRmFrZURyaXZlcigpO1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHJlc3BvbnNlIHZhbHVlcyBkaXJlY3RseSBmcm9tIHRoZSBkcml2ZXInLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAoYXdhaXQgZC5zZXRVcmwoJ2h0dHA6Ly9nb29nbGUuY29tJykpLnNob3VsZC5jb250YWluKCdnb29nbGUnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3ZpYSBleHByZXNzIHJvdXRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgbWpzb253cFNlcnZlcjtcbiAgICBsZXQgZHJpdmVyO1xuXG4gICAgYmVmb3JlKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGRyaXZlciA9IG5ldyBGYWtlRHJpdmVyKCk7XG4gICAgICBkcml2ZXIuc2Vzc2lvbklkID0gJ2Zvbyc7XG4gICAgICBtanNvbndwU2VydmVyID0gYXdhaXQgc2VydmVyKHtcbiAgICAgICAgcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uOiByb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb24oZHJpdmVyKSxcbiAgICAgICAgcG9ydDogc2VydmVyUG9ydCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXIoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgbWpzb253cFNlcnZlci5jbG9zZSgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwcm94eSB0byBkcml2ZXIgYW5kIHJldHVybiB2YWxpZCBqc29ud3AgcmVzcG9uc2UnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vdXJsYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IHt1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbSd9XG4gICAgICB9KTtcbiAgICAgIGRhdGEuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMCxcbiAgICAgICAgdmFsdWU6ICdOYXZpZ2F0ZWQgdG86IGh0dHA6Ly9nb29nbGUuY29tJyxcbiAgICAgICAgc2Vzc2lvbklkOiAnZm9vJ1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFzc3VtZSByZXF1ZXN0cyB3aXRob3V0IGEgQ29udGVudC1UeXBlIGFyZSBqc29uIHJlcXVlc3RzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL3VybGAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7dXJsOiAnaHR0cDovL2dvb2dsZS5jb20nfSxcbiAgICAgIH0pO1xuICAgICAgZGF0YS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICB2YWx1ZTogJ05hdmlnYXRlZCB0bzogaHR0cDovL2dvb2dsZS5jb20nLFxuICAgICAgICBzZXNzaW9uSWQ6ICdmb28nXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVzcG9uZCB0byB4LXd3dy1mb3JtLXVybGVuY29kZWQgYXMgd2VsbCBhcyBqc29uIHJlcXVlc3RzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL3VybGAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcsXG4gICAgICAgIH0sXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiBxcy5zdHJpbmdpZnkoe1xuICAgICAgICAgIHVybDogJ2h0dHA6Ly9nb29nbGUuY29tJyxcbiAgICAgICAgfSksXG4gICAgICB9KTtcbiAgICAgIGRhdGEuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMCxcbiAgICAgICAgdmFsdWU6ICdOYXZpZ2F0ZWQgdG86IGh0dHA6Ly9nb29nbGUuY29tJyxcbiAgICAgICAgc2Vzc2lvbklkOiAnZm9vJ1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgdXJsIHJlcXVlc3QgcGFyYW1ldGVycyBmb3IgbWV0aG9kcyB0byB1c2UgLSBzZXNzaW9uaWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vYmFja2AsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7fSxcbiAgICAgIH0pO1xuICAgICAgZGF0YS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICB2YWx1ZTogJ2ZvbycsXG4gICAgICAgIHNlc3Npb25JZDogJ2ZvbydcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHVybCByZXF1ZXN0IHBhcmFtZXRlcnMgZm9yIG1ldGhvZHMgdG8gdXNlIC0gZWxlbWVudGlkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2VsZW1lbnQvYmFyL2NsaWNrYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IHt9LFxuICAgICAgfSk7XG4gICAgICBkYXRhLnN0YXR1cy5zaG91bGQuZXF1YWwoMCk7XG4gICAgICBkYXRhLnZhbHVlLnNob3VsZC5lcWwoWydiYXInLCAnZm9vJ10pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHVybCByZXEgcGFyYW1zIGluIHRoZSBvcmRlcjogY3VzdG9tLCBlbGVtZW50LCBzZXNzaW9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2VsZW1lbnQvYmFyL2F0dHJpYnV0ZS9iYXpgLFxuICAgICAgfSk7XG4gICAgICBkYXRhLnN0YXR1cy5zaG91bGQuZXF1YWwoMCk7XG4gICAgICBkYXRhLnZhbHVlLnNob3VsZC5lcWwoWydiYXonLCAnYmFyJywgJ2ZvbyddKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVzcG9uZCB3aXRoIDQwMCBCYWQgUmVxdWVzdCBpZiBwYXJhbWV0ZXJzIG1pc3NpbmcnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCB7ZGF0YSwgc3RhdHVzfSA9IGF3YWl0IGF4aW9zKHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgZGF0YToge30sXG4gICAgICAgIHZhbGlkYXRlU3RhdHVzOiBudWxsLFxuICAgICAgfSk7XG4gICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDQwMCk7XG4gICAgICBKU09OLnN0cmluZ2lmeShkYXRhKS5zaG91bGQuY29udGFpbigndXJsJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlamVjdCByZXF1ZXN0cyB3aXRoIGEgYmFkbHkgZm9ybWF0dGVkIGJvZHkgYW5kIG5vdCBjcmFzaCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGF3YWl0IGF4aW9zKHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgZGF0YTogJ29oIGhlbGxvJ1xuICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWQ7XG5cbiAgICAgIGNvbnN0IHtkYXRhfSA9IGF3YWl0IGF4aW9zKHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgZGF0YToge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ31cbiAgICAgIH0pO1xuICAgICAgZGF0YS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICB2YWx1ZTogJ05hdmlnYXRlZCB0bzogaHR0cDovL2dvb2dsZS5jb20nLFxuICAgICAgICBzZXNzaW9uSWQ6ICdmb28nXG4gICAgICB9KTtcblxuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZXQgNDA0IGZvciBiYWQgcm91dGVzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L2JsYXJnaW1hcmdgLFxuICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC80MDQvKTtcbiAgICB9KTtcblxuICAgIGl0KCc0eHggcmVzcG9uc2VzIHNob3VsZCBoYXZlIGNvbnRlbnQtdHlwZSBvZiBhcHBsaWNhdGlvbi9qc29uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qge2hlYWRlcnN9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L2JsYXJnaW1hcmdhcml0YWAsXG4gICAgICAgIHZhbGlkYXRlU3RhdHVzOiBudWxsLFxuICAgICAgfSk7XG5cbiAgICAgIGhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddLnNob3VsZC5pbmNsdWRlKCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IG5vdCB5ZXQgaW1wbGVtZW50ZWQgZm9yIHVuZmlsbGVkb3V0IGNvbW1hbmRzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qge3N0YXR1cywgZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZWxlbWVudC9iYXIvbG9jYXRpb25gLFxuICAgICAgICB2YWxpZGF0ZVN0YXR1czogbnVsbCxcbiAgICAgIH0pO1xuXG4gICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDUwMSk7XG4gICAgICBkYXRhLnNob3VsZC5lcWwoe1xuICAgICAgICBzdGF0dXM6IDQwNSxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiAnTWV0aG9kIGhhcyBub3QgeWV0IGJlZW4gaW1wbGVtZW50ZWQnXG4gICAgICAgIH0sXG4gICAgICAgIHNlc3Npb25JZDogJ2ZvbydcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBub3QgaW1wbGVtZW50ZWQgZm9yIGlnbm9yZWQgY29tbWFuZHMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCB7c3RhdHVzLCBkYXRhfSA9IGF3YWl0IGF4aW9zKHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby9idXR0b251cGAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB2YWxpZGF0ZVN0YXR1czogbnVsbCxcbiAgICAgICAgZGF0YToge30sXG4gICAgICB9KTtcblxuICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCg1MDEpO1xuICAgICAgZGF0YS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiA0MDUsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgbWVzc2FnZTogJ01ldGhvZCBoYXMgbm90IHlldCBiZWVuIGltcGxlbWVudGVkJ1xuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uSWQ6ICdmb28nXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZ2V0IDQwMCBmb3IgYmFkIHBhcmFtZXRlcnMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vdXJsYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IHt9XG4gICAgICB9KS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZFdpdGgoLzQwMC8pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpZ25vcmUgc3BlY2lhbCBleHRyYSBwYXlsb2FkIHBhcmFtcyBpbiB0aGUgcmlnaHQgY29udGV4dHMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZWxlbWVudC9iYXIvdmFsdWVgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgZGF0YToge2lkOiAnYmF6Jywgc2Vzc2lvbklkOiAnbG9sJywgdmFsdWU6IFsnYSddfVxuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IGF4aW9zKHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby9lbGVtZW50L2Jhci92YWx1ZWAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7aWQ6ICdiYXonfVxuICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC80MDAvKTtcblxuICAgICAgLy8gbWFrZSBzdXJlIGFkZGluZyB0aGUgb3B0aW9uYWwgJ2lkJyBkb2Vzbid0IGNsb2JiZXIgYSByb3V0ZSB3aGVyZSB3ZVxuICAgICAgLy8gaGF2ZSBhbiBhY3R1YWwgcmVxdWlyZWQgJ2lkJ1xuICAgICAgYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2ZyYW1lYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IHtpZDogJ2Jheid9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHRoZSBjb3JyZWN0IGVycm9yIGV2ZW4gaWYgZHJpdmVyIGRvZXMgbm90IHRocm93JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qge3N0YXR1cywgZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vYXJtb3IvcmVjZWl2ZV9hc3luY19yZXNwb25zZWAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7cmVzcG9uc2U6ICdiYXonfSxcbiAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICB9KTtcbiAgICAgIHN0YXR1cy5zaG91bGQuZXF1YWwoNTAwKTtcbiAgICAgIGRhdGEuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMTMsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgbWVzc2FnZTogJ0FuIHVua25vd24gc2VydmVyLXNpZGUgZXJyb3Igb2NjdXJyZWQgd2hpbGUgcHJvY2Vzc2luZyAnICtcbiAgICAgICAgICAgICAgICAgICAndGhlIGNvbW1hbmQuIE9yaWdpbmFsIGVycm9yOiBNaXNoYW5kbGVkIERyaXZlciBFcnJvcidcbiAgICAgICAgfSxcbiAgICAgICAgc2Vzc2lvbklkOiAnZm9vJ1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgndzNjIHNlbmRrZXlzIG1pZ3JhdGlvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgYWNjZXB0IHZhbHVlIGZvciBzZW5ka2V5cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZWxlbWVudC9iYXIvdmFsdWVgLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHt2YWx1ZTogJ3RleHQgdG8gdHlwZSd9XG4gICAgICAgIH0pO1xuICAgICAgICBkYXRhLnN0YXR1cy5zaG91bGQuZXF1YWwoMCk7XG4gICAgICAgIGRhdGEudmFsdWUuc2hvdWxkLmVxbChbJ3RleHQgdG8gdHlwZScsICdiYXInXSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgYWNjZXB0IHRleHQgZm9yIHNlbmRrZXlzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby9lbGVtZW50L2Jhci92YWx1ZWAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgZGF0YToge3RleHQ6ICd0ZXh0IHRvIHR5cGUnfVxuICAgICAgICB9KTtcbiAgICAgICAgZGF0YS5zdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgICBkYXRhLnZhbHVlLnNob3VsZC5lcWwoWyd0ZXh0IHRvIHR5cGUnLCAnYmFyJ10pO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGFjY2VwdCB2YWx1ZSBhbmQgdGV4dCBmb3Igc2VuZGtleXMsIGFuZCB1c2UgdmFsdWUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHtkYXRhfSA9IGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2VsZW1lbnQvYmFyL3ZhbHVlYCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7dmFsdWU6ICd0ZXh0IHRvIHR5cGUnLCB0ZXh0OiAndGV4dCB0byBpZ25vcmUnfVxuICAgICAgICB9KTtcbiAgICAgICAgZGF0YS5zdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgICBkYXRhLnZhbHVlLnNob3VsZC5lcWwoWyd0ZXh0IHRvIHR5cGUnLCAnYmFyJ10pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnbXVsdGlwbGUgc2V0cyBvZiBhcmd1bWVudHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkZXNjcmliZSgnb3B0aW9uYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgbW92ZXRvIHdpdGggZWxlbWVudCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL21vdmV0b2AsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IHtlbGVtZW50OiAnMyd9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZGF0YS5zdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgICAgIGRhdGEudmFsdWUuc2hvdWxkLmVxbChbJzMnLCBudWxsLCBudWxsXSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIGFsbG93IG1vdmV0byB3aXRoIHhvZmZzZXQveW9mZnNldCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL21vdmV0b2AsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IHt4b2Zmc2V0OiA0MiwgeW9mZnNldDogMTd9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZGF0YS5zdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgICAgIGRhdGEudmFsdWUuc2hvdWxkLmVxbChbbnVsbCwgNDIsIDE3XSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBkZXNjcmliZSgncmVxdWlyZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgcmVtb3ZlQXBwIHdpdGggYXBwSWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvby9hcm1vci9kZXZpY2UvcmVtb3ZlX2FwcGAsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IHthcHBJZDogNDJ9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZGF0YS5zdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgICAgIGRhdGEudmFsdWUuc2hvdWxkLmVxbCg0Mik7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIGFsbG93IHJlbW92ZUFwcCB3aXRoIGJ1bmRsZUlkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnN0IHtkYXRhfSA9IGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vYXJtb3IvZGV2aWNlL3JlbW92ZV9hcHBgLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiB7YnVuZGxlSWQ6IDQyfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGRhdGEuc3RhdHVzLnNob3VsZC5lcXVhbCgwKTtcbiAgICAgICAgICBkYXRhLnZhbHVlLnNob3VsZC5lcWwoNDIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2RlZmF1bHQgcGFyYW0gd3JhcCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgd3JhcCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vdG91Y2gvcGVyZm9ybWAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgZGF0YTogW3snYWN0aW9uJzogJ3RhcCcsICdvcHRpb25zJzogeydlbGVtZW50JzogJzMnfX1dXG4gICAgICAgIH0pO1xuICAgICAgICBkYXRhLnZhbHVlLnNob3VsZC5kZWVwLmVxdWFsKFtbeydhY3Rpb24nOiAndGFwJywgJ29wdGlvbnMnOiB7J2VsZW1lbnQnOiAnMyd9fV0sICdmb28nXSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBub3Qgd3JhcCB0d2ljZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vdG91Y2gvcGVyZm9ybWAsXG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgZGF0YToge2FjdGlvbnM6IFt7J2FjdGlvbic6ICd0YXAnLCAnb3B0aW9ucyc6IHsnZWxlbWVudCc6ICczJ319XX1cbiAgICAgICAgfSk7XG4gICAgICAgIGRhdGEudmFsdWUuc2hvdWxkLmRlZXAuZXF1YWwoW1t7J2FjdGlvbic6ICd0YXAnLCAnb3B0aW9ucyc6IHsnZWxlbWVudCc6ICczJ319XSwgJ2ZvbyddKTtcbiAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnY3JlYXRlIHNlc3Npb25zIHZpYSBIVFRQIGVuZHBvaW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGRlc2lyZWRDYXBhYmlsaXRpZXMgPSB7YTogJ2InfTtcbiAgICAgIGxldCByZXF1aXJlZENhcGFiaWxpdGllcyA9IHtjOiAnZCd9O1xuICAgICAgbGV0IGNhcGFiaWxpdGllcyA9IHtlOiAnZid9O1xuXG4gICAgICBsZXQgc2Vzc2lvbklkO1xuXG4gICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2Vzc2lvbklkID0gbnVsbDtcbiAgICAgIH0pO1xuICAgICAgYWZ0ZXJFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHNlc3Npb25JZCkge1xuICAgICAgICAgIGF3YWl0IGF4aW9zLmRlbGV0ZShgJHtiYXNlVXJsfS9zZXNzaW9uLyR7c2Vzc2lvbklkfWApO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBjcmVhdGUgc2Vzc2lvbiB3aXRoIGRlc2lyZWQgY2FwcyAoTUpTT05XUCknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHtkYXRhfSA9IGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb25gLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHtkZXNpcmVkQ2FwYWJpbGl0aWVzfVxuICAgICAgICB9KTtcbiAgICAgICAgc2Vzc2lvbklkID0gZGF0YS5zZXNzaW9uSWQ7XG5cbiAgICAgICAgZGF0YS5zdGF0dXMuc2hvdWxkLmVxdWFsKDApO1xuICAgICAgICBkYXRhLnZhbHVlLnNob3VsZC5lcWwoZGVzaXJlZENhcGFiaWxpdGllcyk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgYWxsb3cgY3JlYXRlIHNlc3Npb24gd2l0aCBkZXNpcmVkIGFuZCByZXF1aXJlZCBjYXBzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uYCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBkZXNpcmVkQ2FwYWJpbGl0aWVzLFxuICAgICAgICAgICAgcmVxdWlyZWRDYXBhYmlsaXRpZXNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBzZXNzaW9uSWQgPSBkYXRhLnNlc3Npb25JZDtcblxuICAgICAgICBkYXRhLnN0YXR1cy5zaG91bGQuZXF1YWwoMCk7XG4gICAgICAgIGRhdGEudmFsdWUuc2hvdWxkLmVxbChfLmV4dGVuZCh7fSwgZGVzaXJlZENhcGFiaWxpdGllcywgcmVxdWlyZWRDYXBhYmlsaXRpZXMpKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBmYWlsIHRvIGNyZWF0ZSBzZXNzaW9uIHdpdGhvdXQgY2FwYWJpbGl0aWVzIG9yIGRlc2lyZWRDYXBhYmlsaXRpZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb25gLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGRhdGE6IHt9LFxuICAgICAgICB9KS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZFdpdGgoLzQwMC8pO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGFsbG93IGNyZWF0ZSBzZXNzaW9uIHdpdGggY2FwYWJpbGl0aWVzIChXM0MpJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uYCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjYXBhYmlsaXRpZXMsXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgc2Vzc2lvbklkID0gZGF0YS5zZXNzaW9uSWQ7XG5cbiAgICAgICAgc2hvdWxkLm5vdC5leGlzdChkYXRhLnN0YXR1cyk7XG4gICAgICAgIHNob3VsZC5ub3QuZXhpc3QoZGF0YS5zZXNzaW9uSWQpO1xuICAgICAgICBkYXRhLnZhbHVlLmNhcGFiaWxpdGllcy5zaG91bGQuZXFsKGNhcGFiaWxpdGllcyk7XG4gICAgICAgIGRhdGEudmFsdWUuc2Vzc2lvbklkLnNob3VsZC5leGlzdDtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBmYWxsIGJhY2sgdG8gTUpTT05XUCBpZiBkcml2ZXIgZG9lcyBub3Qgc3VwcG9ydCBXM0MgeWV0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBjcmVhdGVTZXNzaW9uU3R1YiA9IHNpbm9uLnN0dWIoZHJpdmVyLCAnY3JlYXRlU2Vzc2lvbicpLmNhbGxzRmFrZShmdW5jdGlvbiAoY2FwYWJpbGl0aWVzKSB7XG4gICAgICAgICAgZHJpdmVyLnNlc3Npb25JZCA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIEJhc2VEcml2ZXIucHJvdG90eXBlLmNyZWF0ZVNlc3Npb24uY2FsbChkcml2ZXIsIGNhcGFiaWxpdGllcyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGxldCBjYXBzID0ge1xuICAgICAgICAgICAgLi4uZGVzaXJlZENhcGFiaWxpdGllcyxcbiAgICAgICAgICAgIHBsYXRmb3JtTmFtZTogJ0Zha2UnLFxuICAgICAgICAgICAgZGV2aWNlTmFtZTogJ0Zha2UnLFxuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gbGV0IHtzdGF0dXMsIHZhbHVlLCBzZXNzaW9uSWR9ID0gYXdhaXQgcmVxdWVzdCh7XG4gICAgICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uYCxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBkZXNpcmVkQ2FwYWJpbGl0aWVzOiBjYXBzLFxuICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IHtcbiAgICAgICAgICAgICAgICBhbHdheXNNYXRjaDogY2FwcyxcbiAgICAgICAgICAgICAgICBmaXJzdE1hdGNoOiBbe31dLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNlc3Npb25JZCA9IGRhdGEuc2Vzc2lvbklkO1xuXG4gICAgICAgICAgc2hvdWxkLmV4aXN0KGRhdGEuc3RhdHVzKTtcbiAgICAgICAgICBzaG91bGQuZXhpc3QoZGF0YS5zZXNzaW9uSWQpO1xuICAgICAgICAgIGRhdGEudmFsdWUuc2hvdWxkLmVxbChjYXBzKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBjcmVhdGVTZXNzaW9uU3R1Yi5yZXN0b3JlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgndzNjIGVuZHBvaW50cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHczY0NhcHMgPSB7XG4gICAgICAgICAgYWx3YXlzTWF0Y2g6IHtcbiAgICAgICAgICAgIHBsYXRmb3JtTmFtZTogJ0Zha2UnLFxuICAgICAgICAgICAgZGV2aWNlTmFtZTogJ0NvbW1vZG9yZSA2NCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBmaXJzdE1hdGNoOiBbe31dLFxuICAgICAgICB9O1xuICAgICAgICBsZXQgc2Vzc2lvblVybDtcblxuICAgICAgICBiZWZvcmVFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvLyBTdGFydCBhIFczQyBzZXNzaW9uXG4gICAgICAgICAgY29uc3Qge3ZhbHVlfSA9IChhd2FpdCBheGlvcyh7XG4gICAgICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb25gLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIGNhcGFiaWxpdGllczogdzNjQ2FwcyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSkpLmRhdGE7XG4gICAgICAgICAgc2Vzc2lvbklkID0gdmFsdWUuc2Vzc2lvbklkO1xuICAgICAgICAgIHNlc3Npb25VcmwgPSBgJHtiYXNlVXJsfS9zZXNzaW9uLyR7c2Vzc2lvbklkfWA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KGBzaG91bGQgdGhyb3cgNDAwIEJhZCBQYXJhbWV0ZXJzIGV4Y2VwdGlvbiBpZiB0aGUgcGFyYW1ldGVycyBhcmUgYmFkYCwgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgICAgdXJsOiBgJHtzZXNzaW9uVXJsfS9hY3Rpb25zYCxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIGJhZDogJ3BhcmFtcycsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCg0MDApO1xuXG4gICAgICAgICAgY29uc3Qge2Vycm9yOiB3M2NFcnJvciwgbWVzc2FnZSwgc3RhY2t0cmFjZX0gPSBkYXRhLnZhbHVlO1xuICAgICAgICAgIG1lc3NhZ2Uuc2hvdWxkLm1hdGNoKC9QYXJhbWV0ZXJzIHdlcmUgaW5jb3JyZWN0Lyk7XG4gICAgICAgICAgc3RhY2t0cmFjZS5zaG91bGQubWF0Y2goL3Byb3RvY29sLmpzLyk7XG4gICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmJlLmEuc3RyaW5nO1xuICAgICAgICAgIHczY0Vycm9yLnNob3VsZC5lcXVhbChlcnJvcnMuSW52YWxpZEFyZ3VtZW50RXJyb3IuZXJyb3IoKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KGBzaG91bGQgdGhyb3cgNDA1IGV4Y2VwdGlvbiBpZiB0aGUgY29tbWFuZCBoYXNuJ3QgYmVlbiBpbXBsZW1lbnRlZCB5ZXRgLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc3Qge3N0YXR1cywgZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgICB1cmw6IGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICB2YWxpZGF0ZVN0YXR1czogbnVsbCxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgYWN0aW9uczogW10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHN0YXR1cy5zaG91bGQuZXF1YWwoNDA1KTtcblxuICAgICAgICAgIGNvbnN0IHtlcnJvcjogdzNjRXJyb3IsIG1lc3NhZ2UsIHN0YWNrdHJhY2V9ID0gZGF0YS52YWx1ZTtcbiAgICAgICAgICBtZXNzYWdlLnNob3VsZC5tYXRjaCgvTWV0aG9kIGhhcyBub3QgeWV0IGJlZW4gaW1wbGVtZW50ZWQvKTtcbiAgICAgICAgICBzdGFja3RyYWNlLnNob3VsZC5tYXRjaCgvcHJvdG9jb2wuanMvKTtcbiAgICAgICAgICB3M2NFcnJvci5zaG91bGQuYmUuYS5zdHJpbmc7XG4gICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmVxdWFsKGVycm9ycy5Ob3RZZXRJbXBsZW1lbnRlZEVycm9yLmVycm9yKCkpO1xuICAgICAgICAgIG1lc3NhZ2Uuc2hvdWxkLm1hdGNoKC9NZXRob2QgaGFzIG5vdCB5ZXQgYmVlbiBpbXBsZW1lbnRlZC8pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChgc2hvdWxkIHRocm93IDUwMCBVbmtub3duIEVycm9yIGlmIHRoZSBjb21tYW5kIHRocm93cyBhbiB1bmV4cGVjdGVkIGV4Y2VwdGlvbmAsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkcml2ZXIucGVyZm9ybUFjdGlvbnMgPSAoKSA9PiB7IHRocm93IG5ldyBFcnJvcihgRGlkbid0IHdvcmtgKTsgfTtcbiAgICAgICAgICBjb25zdCB7c3RhdHVzLCBkYXRhfSA9IGF3YWl0IGF4aW9zKHtcbiAgICAgICAgICAgIHVybDogYCR7c2Vzc2lvblVybH0vYWN0aW9uc2AsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIHZhbGlkYXRlU3RhdHVzOiBudWxsLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBhY3Rpb25zOiBbXSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDUwMCk7XG5cbiAgICAgICAgICBjb25zdCB7ZXJyb3I6IHczY0Vycm9yLCBtZXNzYWdlLCBzdGFja3RyYWNlfSA9IGRhdGEudmFsdWU7XG4gICAgICAgICAgc3RhY2t0cmFjZS5zaG91bGQubWF0Y2goL3Byb3RvY29sLmpzLyk7XG4gICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmJlLmEuc3RyaW5nO1xuICAgICAgICAgIHczY0Vycm9yLnNob3VsZC5lcXVhbChlcnJvcnMuVW5rbm93bkVycm9yLmVycm9yKCkpO1xuICAgICAgICAgIG1lc3NhZ2Uuc2hvdWxkLm1hdGNoKC9EaWRuJ3Qgd29yay8pO1xuXG4gICAgICAgICAgZGVsZXRlIGRyaXZlci5wZXJmb3JtQWN0aW9ucztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoYHNob3VsZCB0cmFuc2xhdGUgZWxlbWVudCBmb3JtYXQgZnJvbSBNSlNPTldQIHRvIFczQ2AsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdCByZXRWYWx1ZSA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc29tZXRoaW5nOiB7XG4gICAgICAgICAgICAgICAgW01KU09OV1BfRUxFTUVOVF9LRVldOiAnZm9vbycsXG4gICAgICAgICAgICAgICAgb3RoZXI6ICdiYXInXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgW01KU09OV1BfRUxFTUVOVF9LRVldOiAnYmFyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdpZ25vcmUnLFxuICAgICAgICAgIF07XG5cbiAgICAgICAgICBjb25zdCBleHBlY3RlZFZhbHVlID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzb21ldGhpbmc6IHtcbiAgICAgICAgICAgICAgICBbTUpTT05XUF9FTEVNRU5UX0tFWV06ICdmb29vJyxcbiAgICAgICAgICAgICAgICBbVzNDX0VMRU1FTlRfS0VZXTogJ2Zvb28nLFxuICAgICAgICAgICAgICAgIG90aGVyOiAnYmFyJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIFtNSlNPTldQX0VMRU1FTlRfS0VZXTogJ2JhcicsXG4gICAgICAgICAgICAgIFtXM0NfRUxFTUVOVF9LRVldOiAnYmFyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdpZ25vcmUnLFxuICAgICAgICAgIF07XG5cbiAgICAgICAgICBjb25zdCBmaW5kRWxlbWVudHNCYWNrdXAgPSBkcml2ZXIuZmluZEVsZW1lbnRzO1xuICAgICAgICAgIGRyaXZlci5maW5kRWxlbWVudHMgPSAoKSA9PiByZXRWYWx1ZTtcbiAgICAgICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcy5wb3N0KGAke3Nlc3Npb25Vcmx9L2VsZW1lbnRzYCwge1xuICAgICAgICAgICAgdXNpbmc6ICd3aGF0ZXZlcicsXG4gICAgICAgICAgICB2YWx1ZTogJ3doYXRldmVyJyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBkYXRhLnZhbHVlLnNob3VsZC5lcWwoZXhwZWN0ZWRWYWx1ZSk7XG4gICAgICAgICAgZHJpdmVyLmZpbmRFbGVtZW50cyA9IGZpbmRFbGVtZW50c0JhY2t1cDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoYHNob3VsZCBmYWlsIHdpdGggYSA0MDggZXJyb3IgaWYgaXQgdGhyb3dzIGEgVGltZW91dEVycm9yIGV4Y2VwdGlvbmAsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBsZXQgc2V0VXJsU3R1YiA9IHNpbm9uLnN0dWIoZHJpdmVyLCAnc2V0VXJsJykuY2FsbHNGYWtlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcnMuVGltZW91dEVycm9yO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgICAgdXJsOiBgJHtzZXNzaW9uVXJsfS91cmxgLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICB2YWxpZGF0ZVN0YXR1czogbnVsbCxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9leGFtcGxlLmNvbS8nLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHN0YXR1cy5zaG91bGQuZXF1YWwoNDA4KTtcblxuICAgICAgICAgIGNvbnN0IHtlcnJvcjogdzNjRXJyb3IsIG1lc3NhZ2UsIHN0YWNrdHJhY2V9ID0gZGF0YS52YWx1ZTtcbiAgICAgICAgICBzdGFja3RyYWNlLnNob3VsZC5tYXRjaCgvcHJvdG9jb2wuanMvKTtcbiAgICAgICAgICB3M2NFcnJvci5zaG91bGQuYmUuYS5zdHJpbmc7XG4gICAgICAgICAgdzNjRXJyb3Iuc2hvdWxkLmVxdWFsKGVycm9ycy5UaW1lb3V0RXJyb3IuZXJyb3IoKSk7XG4gICAgICAgICAgbWVzc2FnZS5zaG91bGQubWF0Y2goL0FuIG9wZXJhdGlvbiBkaWQgbm90IGNvbXBsZXRlIGJlZm9yZSBpdHMgdGltZW91dCBleHBpcmVkLyk7XG5cbiAgICAgICAgICBzZXRVcmxTdHViLnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoYHNob3VsZCBwYXNzIHdpdGggMjAwIEhUVFAgc3RhdHVzIGNvZGUgaWYgdGhlIGNvbW1hbmQgcmV0dXJucyBhIHZhbHVlYCwgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGRyaXZlci5wZXJmb3JtQWN0aW9ucyA9IChhY3Rpb25zKSA9PiAnSXQgd29ya3MgJyArIGFjdGlvbnMuam9pbignJyk7XG4gICAgICAgICAgY29uc3Qge3N0YXR1cywgdmFsdWUsIHNlc3Npb25JZH0gPSAoYXdhaXQgYXhpb3MucG9zdChgJHtzZXNzaW9uVXJsfS9hY3Rpb25zYCwge1xuICAgICAgICAgICAgYWN0aW9uczogWydhJywgJ2InLCAnYyddLFxuICAgICAgICAgIH0pKS5kYXRhO1xuICAgICAgICAgIHNob3VsZC5ub3QuZXhpc3Qoc2Vzc2lvbklkKTtcbiAgICAgICAgICBzaG91bGQubm90LmV4aXN0KHN0YXR1cyk7XG4gICAgICAgICAgdmFsdWUuc2hvdWxkLmVxdWFsKCdJdCB3b3JrcyBhYmMnKTtcbiAgICAgICAgICBkZWxldGUgZHJpdmVyLnBlcmZvcm1BY3Rpb25zO1xuICAgICAgICB9KTtcblxuICAgICAgICBkZXNjcmliZSgnandwcm94eScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdCBwb3J0ID0gNTY1NjI7XG4gICAgICAgICAgbGV0IHNlcnZlciwgandwcm94eSwgYXBwO1xuXG4gICAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBjcmVhdGVQcm94eVNlcnZlcihzZXNzaW9uSWQsIHBvcnQpO1xuICAgICAgICAgICAgc2VydmVyID0gcmVzLnNlcnZlcjtcbiAgICAgICAgICAgIGFwcCA9IHJlcy5hcHA7XG4gICAgICAgICAgICBqd3Byb3h5ID0gbmV3IEpXUHJveHkoe2hvc3Q6ICdsb2NhbGhvc3QnLCBwb3J0fSk7XG4gICAgICAgICAgICBqd3Byb3h5LnNlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIGRyaXZlci5wZXJmb3JtQWN0aW9ucyA9IGFzeW5jIChhY3Rpb25zKSA9PiBhd2FpdCBqd3Byb3h5LmNvbW1hbmQoJy9wZXJmb3JtLWFjdGlvbnMnLCAnUE9TVCcsIGFjdGlvbnMpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYWZ0ZXJFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBkcml2ZXIucGVyZm9ybUFjdGlvbnM7XG4gICAgICAgICAgICBhd2FpdCBzZXJ2ZXIuY2xvc2UoKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGl0KCdzaG91bGQgd29yayBpZiBhIHByb3hpZWQgcmVxdWVzdCByZXR1cm5zIGEgcmVzcG9uc2Ugd2l0aCBzdGF0dXMgMjAwJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYXBwLnBvc3QoJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3BlcmZvcm0tYWN0aW9ucycsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICAgICAgICByZXMuanNvbih7XG4gICAgICAgICAgICAgICAgc2Vzc2lvbklkOiByZXEucGFyYW1zLnNlc3Npb25JZCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVxLmJvZHksXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCB7c3RhdHVzLCB2YWx1ZSwgc2Vzc2lvbklkfSA9IChhd2FpdCBheGlvcy5wb3N0KGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLCB7XG4gICAgICAgICAgICAgIGFjdGlvbnM6IFsxLCAyLCAzXSxcbiAgICAgICAgICAgIH0pKS5kYXRhO1xuICAgICAgICAgICAgdmFsdWUuc2hvdWxkLmVxbChbMSwgMiwgM10pO1xuICAgICAgICAgICAgc2hvdWxkLm5vdC5leGlzdChzdGF0dXMpO1xuICAgICAgICAgICAgc2hvdWxkLm5vdC5leGlzdChzZXNzaW9uSWQpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gZXJyb3IgaWYgYSBwcm94aWVkIHJlcXVlc3QgcmV0dXJucyBhIE1KU09OV1AgZXJyb3IgcmVzcG9uc2UnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhcHAucG9zdCgnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvcGVyZm9ybS1hY3Rpb25zJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uSWQsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiA2LFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnQSBwcm9ibGVtIG9jY3VycmVkJyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgICAgICB1cmw6IGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbMSwgMiwgM10sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbChIVFRQU3RhdHVzQ29kZXMuTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpLnNob3VsZC5tYXRjaCgvQSBwcm9ibGVtIG9jY3VycmVkLyk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpdCgnc2hvdWxkIHJldHVybiBXM0MgZXJyb3IgaWYgYSBwcm94aWVkIHJlcXVlc3QgcmV0dXJucyBhIFczQyBlcnJvciByZXNwb25zZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBTb21lIGVycm9yIG9jY3VycmVkYCk7XG4gICAgICAgICAgICBlcnJvci53M2NTdGF0dXMgPSA0MTQ7XG4gICAgICAgICAgICBjb25zdCBleGVjdXRlQ29tbWFuZFN0dWIgPSBzaW5vbi5zdHViKGRyaXZlciwgJ2V4ZWN1dGVDb21tYW5kJykucmV0dXJucyh7XG4gICAgICAgICAgICAgIHByb3RvY29sOiAnVzNDJyxcbiAgICAgICAgICAgICAgZXJyb3IsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgICAgICB1cmw6IGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICAgICAgICAgIGRhdGE6IHthY3Rpb25zOiBbMSwgMiwgM119LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDQxNCk7XG4gICAgICAgICAgICBjb25zdCB7ZXJyb3I6IHczY0Vycm9yLCBtZXNzYWdlOiBlcnJNZXNzYWdlLCBzdGFja3RyYWNlfSA9IGRhdGEudmFsdWU7XG4gICAgICAgICAgICB3M2NFcnJvci5zaG91bGQuZXF1YWwoJ3Vua25vd24gZXJyb3InKTtcbiAgICAgICAgICAgIHN0YWNrdHJhY2Uuc2hvdWxkLm1hdGNoKC9Tb21lIGVycm9yIG9jY3VycmVkLyk7XG4gICAgICAgICAgICBlcnJNZXNzYWdlLnNob3VsZC5lcXVhbCgnU29tZSBlcnJvciBvY2N1cnJlZCcpO1xuICAgICAgICAgICAgZXhlY3V0ZUNvbW1hbmRTdHViLnJlc3RvcmUoKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGl0KCdzaG91bGQgcmV0dXJuIGVycm9yIGlmIGEgcHJveGllZCByZXF1ZXN0IHJldHVybnMgYSBNSlNPTldQIGVycm9yIHJlc3BvbnNlIGJ1dCBIVFRQIHN0YXR1cyBjb2RlIGlzIDIwMCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFwcC5wb3N0KCcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9wZXJmb3JtLWFjdGlvbnMnLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICAgICAgICAgIHNlc3Npb25JZDogJ0Zha2UgU2Vzc2lvbiBJZCcsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiA3LFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnQSBwcm9ibGVtIG9jY3VycmVkJyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgICAgICB1cmw6IGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbMSwgMiwgM10sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbChIVFRQU3RhdHVzQ29kZXMuTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGNvbnN0IHtlcnJvcjogdzNjRXJyb3IsIG1lc3NhZ2U6IGVyck1lc3NhZ2UsIHN0YWNrdHJhY2V9ID0gZGF0YS52YWx1ZTtcbiAgICAgICAgICAgIHczY0Vycm9yLnNob3VsZC5lcXVhbCgnbm8gc3VjaCBlbGVtZW50Jyk7XG4gICAgICAgICAgICBlcnJNZXNzYWdlLnNob3VsZC5tYXRjaCgvQSBwcm9ibGVtIG9jY3VycmVkLyk7XG4gICAgICAgICAgICBzdGFja3RyYWNlLnNob3VsZC5leGlzdDtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGl0KCdzaG91bGQgcmV0dXJuIGVycm9yIGlmIGEgcHJveGllZCByZXF1ZXN0IHJldHVybnMgYSBXM0MgZXJyb3IgcmVzcG9uc2UnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhcHAucG9zdCgnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvcGVyZm9ybS1hY3Rpb25zJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgICAgZXJyb3I6ICdubyBzdWNoIGVsZW1lbnQnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ2RvZXMgbm90IG1ha2UgYSBkaWZmZXJlbmNlJyxcbiAgICAgICAgICAgICAgICAgIHN0YWNrdHJhY2U6ICdhcmJpdHJhcnkgc3RhY2t0cmFjZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgICAgICB1cmw6IGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbMSwgMiwgM10sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbChIVFRQU3RhdHVzQ29kZXMuTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGNvbnN0IHtlcnJvcjogdzNjRXJyb3IsIHN0YWNrdHJhY2V9ID0gZGF0YS52YWx1ZTtcbiAgICAgICAgICAgIHczY0Vycm9yLnNob3VsZC5lcXVhbCgnbm8gc3VjaCBlbGVtZW50Jyk7XG4gICAgICAgICAgICBzdGFja3RyYWNlLnNob3VsZC5tYXRjaCgvYXJiaXRyYXJ5IHN0YWNrdHJhY2UvKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGl0KCdzaG91bGQgcmV0dXJuIGFuIGVycm9yIGlmIGEgcHJveGllZCByZXF1ZXN0IHJldHVybnMgYSBXM0MgZXJyb3IgcmVzcG9uc2UnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhcHAucG9zdCgnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvcGVyZm9ybS1hY3Rpb25zJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIHJlcy5zZXQoJ0Nvbm5lY3Rpb24nLCAnY2xvc2UnKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1cyg0NDQpLmpzb24oe1xuICAgICAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgICBlcnJvcjogJ2JvZ3VzIGVycm9yIGNvZGUnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ2RvZXMgbm90IG1ha2UgYSBkaWZmZXJlbmNlJyxcbiAgICAgICAgICAgICAgICAgIHN0YWNrdHJhY2U6ICdhcmJpdHJhcnkgc3RhY2t0cmFjZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICAgICAgICB1cmw6IGAke3Nlc3Npb25Vcmx9L2FjdGlvbnNgLFxuICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbMSwgMiwgM10sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbChIVFRQU3RhdHVzQ29kZXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SKTtcbiAgICAgICAgICAgIGNvbnN0IHtlcnJvcjogdzNjRXJyb3IsIHN0YWNrdHJhY2V9ID0gZGF0YS52YWx1ZTtcbiAgICAgICAgICAgIHczY0Vycm9yLnNob3VsZC5lcXVhbCgndW5rbm93biBlcnJvcicpO1xuICAgICAgICAgICAgc3RhY2t0cmFjZS5zaG91bGQubWF0Y2goL2FyYml0cmFyeSBzdGFja3RyYWNlLyk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGNvbW1hbmRzIHdpdGggbm8gcmVzcG9uc2UgdmFsdWVzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL2ZvcndhcmRgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIH0pO1xuICAgICAgZGF0YS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgc2Vzc2lvbklkOiAnZm9vJ1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGVtcHR5IHN0cmluZyByZXNwb25zZSB2YWx1ZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCB7ZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi9mb28vZWxlbWVudC9iYXIvdGV4dGAsXG4gICAgICB9KTtcbiAgICAgIGRhdGEuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogMCxcbiAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICBzZXNzaW9uSWQ6ICdmb28nXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc2VuZCA1MDAgcmVzcG9uc2UgYW5kIGFuIFVua25vd24gb2JqZWN0IGZvciByZWplY3RlZCBjb21tYW5kcycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vZm9vL3JlZnJlc2hgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICB9KTtcblxuICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCg1MDApO1xuICAgICAgZGF0YS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAxMyxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiAnQW4gdW5rbm93biBzZXJ2ZXItc2lkZSBlcnJvciBvY2N1cnJlZCB3aGlsZSBwcm9jZXNzaW5nICcgK1xuICAgICAgICAgICAgICAgICAgICd0aGUgY29tbWFuZC4gT3JpZ2luYWwgZXJyb3I6IFRvbyBGcmVzaCEnXG4gICAgICAgIH0sXG4gICAgICAgIHNlc3Npb25JZDogJ2ZvbydcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgdGhyb3cgVW5rbm93bkVycm9yIHdoZW4ga25vd24nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCB7c3RhdHVzLCBkYXRhfSA9IGF3YWl0IGF4aW9zKHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uL2Zvb2AsXG4gICAgICAgIHZhbGlkYXRlU3RhdHVzOiBudWxsLFxuICAgICAgfSk7XG5cbiAgICAgIHN0YXR1cy5zaG91bGQuZXF1YWwoNDA0KTtcbiAgICAgIGRhdGEuc2hvdWxkLmVxbCh7XG4gICAgICAgIHN0YXR1czogNixcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiAnQSBzZXNzaW9uIGlzIGVpdGhlciB0ZXJtaW5hdGVkIG9yIG5vdCBzdGFydGVkJ1xuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uSWQ6ICdmb28nXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3Nlc3Npb24gSWRzJywgZnVuY3Rpb24gKCkge1xuICAgIGxldCBkcml2ZXIgPSBuZXcgRmFrZURyaXZlcigpO1xuICAgIGxldCBtanNvbndwU2VydmVyO1xuXG4gICAgYmVmb3JlKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1qc29ud3BTZXJ2ZXIgPSBhd2FpdCBzZXJ2ZXIoe1xuICAgICAgICByb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb246IHJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbihkcml2ZXIpLFxuICAgICAgICBwb3J0OiBzZXJ2ZXJQb3J0LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBhZnRlcihhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBtanNvbndwU2VydmVyLmNsb3NlKCk7XG4gICAgfSk7XG5cbiAgICBhZnRlckVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyLnNlc3Npb25JZCA9IG51bGw7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBudWxsIFNlc3Npb25JZCBmb3IgY29tbWFuZHMgd2l0aG91dCBzZXNzaW9uSWRzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3Qge2RhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3N0YXR1c2AsXG4gICAgICB9KTtcblxuICAgICAgc2hvdWxkLmVxdWFsKGRhdGEuc2Vzc2lvbklkLCBudWxsKTtcbiAgICB9KTtcblxuICAgIGl0KCdyZXNwb25kcyB3aXRoIHRoZSBzYW1lIHNlc3Npb24gSUQgaW4gdGhlIHJlcXVlc3QnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgc2Vzc2lvbklkID0gJ1ZhZGVyIFNlc3Npb25zJztcbiAgICAgIGRyaXZlci5zZXNzaW9uSWQgPSBzZXNzaW9uSWQ7XG5cbiAgICAgIGNvbnN0IHtkYXRhfSA9IGF3YWl0IGF4aW9zKHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uLyR7c2Vzc2lvbklkfS91cmxgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgZGF0YToge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ31cbiAgICAgIH0pO1xuXG4gICAgICBzaG91bGQuZXhpc3QoZGF0YS5zZXNzaW9uSWQpO1xuICAgICAgZGF0YS5zZXNzaW9uSWQuc2hvdWxkLmVxbChzZXNzaW9uSWQpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3llbGxzIGlmIG5vIHNlc3Npb24gZXhpc3RzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHNlc3Npb25JZCA9ICdWYWRlciBTZXNzaW9ucyc7XG5cbiAgICAgIGNvbnN0IHtkYXRhLCBzdGF0dXN9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9L3VybGAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB2YWxpZGF0ZVN0YXR1czogbnVsbCxcbiAgICAgICAgZGF0YToge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ30sXG4gICAgICB9KTtcblxuICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCg0MDQpO1xuICAgICAgZGF0YS5zdGF0dXMuc2hvdWxkLmVxdWFsKDYpO1xuICAgICAgZGF0YS52YWx1ZS5tZXNzYWdlLnNob3VsZC5jb250YWluKCdzZXNzaW9uJyk7XG4gICAgfSk7XG5cbiAgICBpdCgneWVsbHMgaWYgaW52YWxpZCBzZXNzaW9uIGlzIHNlbnQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgc2Vzc2lvbklkID0gJ1ZhZGVyIFNlc3Npb25zJztcbiAgICAgIGRyaXZlci5zZXNzaW9uSWQgPSAncmVjZXNzaW9uJztcblxuICAgICAgY29uc3Qge2RhdGEsIHN0YXR1c30gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc2Vzc2lvbi8ke3Nlc3Npb25JZH0vdXJsYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIHZhbGlkYXRlU3RhdHVzOiBudWxsLFxuICAgICAgICBkYXRhOiB7dXJsOiAnaHR0cDovL2dvb2dsZS5jb20nfSxcbiAgICAgIH0pO1xuXG4gICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDQwNCk7XG4gICAgICBkYXRhLnN0YXR1cy5zaG91bGQuZXF1YWwoNik7XG4gICAgICBkYXRhLnZhbHVlLm1lc3NhZ2Uuc2hvdWxkLmNvbnRhaW4oJ3Nlc3Npb24nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGF2ZSBzZXNzaW9uIElEcyBpbiBlcnJvciByZXNwb25zZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgc2Vzc2lvbklkID0gJ1ZhZGVyIFNlc3Npb25zJztcbiAgICAgIGRyaXZlci5zZXNzaW9uSWQgPSBzZXNzaW9uSWQ7XG5cbiAgICAgIGNvbnN0IHtkYXRhLCBzdGF0dXN9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9L3JlZnJlc2hgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgdmFsaWRhdGVTdGF0dXM6IG51bGwsXG4gICAgICB9KTtcblxuICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCg1MDApO1xuICAgICAgZGF0YS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAxMyxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiAnQW4gdW5rbm93biBzZXJ2ZXItc2lkZSBlcnJvciBvY2N1cnJlZCB3aGlsZSBwcm9jZXNzaW5nICcgK1xuICAgICAgICAgICAgICAgICAgICd0aGUgY29tbWFuZC4gT3JpZ2luYWwgZXJyb3I6IFRvbyBGcmVzaCEnXG4gICAgICAgIH0sXG4gICAgICAgIHNlc3Npb25JZFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBhIG5ldyBzZXNzaW9uIElEIG9uIGNyZWF0ZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHtkYXRhfSA9IGF3YWl0IGF4aW9zKHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uYCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IHtkZXNpcmVkQ2FwYWJpbGl0aWVzOiB7Z3JlZXRpbmc6ICdoZWxsbyd9LCByZXF1aXJlZENhcGFiaWxpdGllczoge3ZhbGVkaWN0aW9uOiAnYnllJ319XG4gICAgICB9KTtcblxuICAgICAgc2hvdWxkLmV4aXN0KGRhdGEuc2Vzc2lvbklkKTtcbiAgICAgIGRhdGEuc2Vzc2lvbklkLmluZGV4T2YoJ2Zha2VTZXNzaW9uXycpLnNob3VsZC5lcXVhbCgwKTtcbiAgICAgIGRhdGEudmFsdWUuc2hvdWxkLmVxbCh7Z3JlZXRpbmc6ICdoZWxsbycsIHZhbGVkaWN0aW9uOiAnYnllJ30pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndmlhIGRyaXZlcnMganNvbndwIHByb3h5JywgZnVuY3Rpb24gKCkge1xuICAgIGxldCBkcml2ZXI7XG4gICAgbGV0IHNlc3Npb25JZCA9ICdmb28nO1xuICAgIGxldCBtanNvbndwU2VydmVyO1xuXG4gICAgYmVmb3JlRWFjaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBkcml2ZXIgPSBuZXcgRmFrZURyaXZlcigpO1xuICAgICAgZHJpdmVyLnNlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgICAgIGRyaXZlci5wcm94eUFjdGl2ZSA9ICgpID0+IHRydWU7XG4gICAgICBkcml2ZXIuY2FuUHJveHkgPSAoKSA9PiB0cnVlO1xuXG4gICAgICBtanNvbndwU2VydmVyID0gYXdhaXQgc2VydmVyKHtcbiAgICAgICAgcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uOiByb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb24oZHJpdmVyKSxcbiAgICAgICAgcG9ydDogc2VydmVyUG9ydCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXJFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGF3YWl0IG1qc29ud3BTZXJ2ZXIuY2xvc2UoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZ2l2ZSBhIG5pY2UgZXJyb3IgaWYgcHJveHlpbmcgaXMgc2V0IGJ1dCBubyBwcm94eSBmdW5jdGlvbiBleGlzdHMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBkcml2ZXIuY2FuUHJveHkgPSAoKSA9PiBmYWxzZTtcbiAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9L3VybGAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB2YWxpZGF0ZVN0YXR1czogbnVsbCxcbiAgICAgICAgZGF0YToge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ30sXG4gICAgICB9KTtcblxuICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCg1MDApO1xuICAgICAgZGF0YS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAxMyxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiAnQW4gdW5rbm93biBzZXJ2ZXItc2lkZSBlcnJvciBvY2N1cnJlZCB3aGlsZSBwcm9jZXNzaW5nICcgK1xuICAgICAgICAgICAgICAgICAgICd0aGUgY29tbWFuZC4gT3JpZ2luYWwgZXJyb3I6IFRyeWluZyB0byBwcm94eSB0byBhIEpTT05XUCAnICtcbiAgICAgICAgICAgICAgICAgICAnc2VydmVyIGJ1dCBkcml2ZXIgaXMgdW5hYmxlIHRvIHByb3h5J1xuICAgICAgICB9LFxuICAgICAgICBzZXNzaW9uSWRcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwYXNzIG9uIGFueSBlcnJvcnMgaW4gcHJveHlpbmcnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBkcml2ZXIucHJveHlSZXFSZXMgPSBhc3luYyBmdW5jdGlvbiAoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcmVxdWlyZS1hd2FpdFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZvbycpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9L3VybGAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB2YWxpZGF0ZVN0YXR1czogbnVsbCxcbiAgICAgICAgZGF0YToge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ30sXG4gICAgICB9KTtcblxuICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCg1MDApO1xuICAgICAgZGF0YS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAxMyxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiAnQW4gdW5rbm93biBzZXJ2ZXItc2lkZSBlcnJvciBvY2N1cnJlZCB3aGlsZSBwcm9jZXNzaW5nICcgK1xuICAgICAgICAgICAgICAgICAgICd0aGUgY29tbWFuZC4gT3JpZ2luYWwgZXJyb3I6IENvdWxkIG5vdCBwcm94eS4gUHJveHkgJyArXG4gICAgICAgICAgICAgICAgICAgJ2Vycm9yOiBmb28nXG4gICAgICAgIH0sXG4gICAgICAgIHNlc3Npb25JZFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFibGUgdG8gdGhyb3cgUHJveHlSZXF1ZXN0RXJyb3IgaW4gcHJveHlpbmcnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBkcml2ZXIucHJveHlSZXFSZXMgPSBhc3luYyBmdW5jdGlvbiAoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcmVxdWlyZS1hd2FpdFxuICAgICAgICBsZXQganNvbndwID0ge3N0YXR1czogMzUsIHZhbHVlOiAnTm8gc3VjaCBjb250ZXh0IGZvdW5kLicsIHNlc3Npb25JZDogJ2Zvbyd9O1xuICAgICAgICB0aHJvdyBuZXcgZXJyb3JzLlByb3h5UmVxdWVzdEVycm9yKGBDb3VsZCBub3QgcHJveHkgY29tbWFuZCB0byByZW1vdGUgc2VydmVyLiBgLCBqc29ud3ApO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9L3VybGAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB2YWxpZGF0ZVN0YXR1czogbnVsbCxcbiAgICAgICAgZGF0YToge3VybDogJ2h0dHA6Ly9nb29nbGUuY29tJ30sXG4gICAgICB9KTtcblxuICAgICAgc3RhdHVzLnNob3VsZC5lcXVhbCg1MDApO1xuICAgICAgZGF0YS5zaG91bGQuZXFsKHtcbiAgICAgICAgc3RhdHVzOiAzNSxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBtZXNzYWdlOiAnTm8gc3VjaCBjb250ZXh0IGZvdW5kLidcbiAgICAgICAgfSxcbiAgICAgICAgc2Vzc2lvbklkOiAnZm9vJ1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGxldCB0aGUgcHJveHkgaGFuZGxlIHJlcS9yZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBkcml2ZXIucHJveHlSZXFSZXMgPSBhc3luYyBmdW5jdGlvbiAocmVxLCByZXMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSByZXF1aXJlLWF3YWl0XG4gICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtjdXN0b206ICdkYXRhJ30pO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9L3VybGAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7dXJsOiAnaHR0cDovL2dvb2dsZS5jb20nfVxuICAgICAgfSk7XG5cbiAgICAgIHN0YXR1cy5zaG91bGQuZXF1YWwoMjAwKTtcbiAgICAgIGRhdGEuc2hvdWxkLmVxbCh7Y3VzdG9tOiAnZGF0YSd9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYXZvaWQganNvbndwIHByb3h5aW5nIHdoZW4gcGF0aCBtYXRjaGVzIGF2b2lkYW5jZSBsaXN0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgZHJpdmVyLmdldFByb3h5QXZvaWRMaXN0ID0gKCkgPT4gW1snUE9TVCcsIG5ldyBSZWdFeHAoJ14vc2Vzc2lvbi9bXi9dKy91cmwkJyldXTtcbiAgICAgIGNvbnN0IHtzdGF0dXMsIGRhdGF9ID0gYXdhaXQgYXhpb3Moe1xuICAgICAgICB1cmw6IGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9L3VybGAsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7dXJsOiAnaHR0cDovL2dvb2dsZS5jb20nfSxcbiAgICAgIH0pO1xuXG4gICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDIwMCk7XG4gICAgICBkYXRhLnNob3VsZC5lcWwoe1xuICAgICAgICBzdGF0dXM6IDAsXG4gICAgICAgIHZhbHVlOiAnTmF2aWdhdGVkIHRvOiBodHRwOi8vZ29vZ2xlLmNvbScsXG4gICAgICAgIHNlc3Npb25JZFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGZhaWwgaWYgYXZvaWQgcHJveHkgbGlzdCBpcyBtYWxmb3JtZWQgaW4gc29tZSB3YXknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhc3luYyBmdW5jdGlvbiBiYWRQcm94eUF2b2lkYW5jZUxpc3QgKGxpc3QpIHtcbiAgICAgICAgZHJpdmVyLmdldFByb3h5QXZvaWRMaXN0ID0gKCkgPT4gbGlzdDtcbiAgICAgICAgY29uc3Qge3N0YXR1cywgZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgICAgdXJsOiBgJHtiYXNlVXJsfS9zZXNzaW9uLyR7c2Vzc2lvbklkfS91cmxgLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIHZhbGlkYXRlU3RhdHVzOiBudWxsLFxuICAgICAgICAgIGRhdGE6IHt1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbSd9LFxuICAgICAgICB9KTtcblxuICAgICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDUwMCk7XG4gICAgICAgIGRhdGEuc3RhdHVzLnNob3VsZC5lcXVhbCgxMyk7XG4gICAgICAgIGRhdGEudmFsdWUubWVzc2FnZS5zaG91bGQuY29udGFpbigncm94eScpO1xuICAgICAgfVxuICAgICAgY29uc3QgbGlzdHMgPSBbXG4gICAgICAgICdmb28nLFxuICAgICAgICBbWydmb28nXV0sXG4gICAgICAgIFtbJ0JBUicsIC9sb2wvXV0sXG4gICAgICAgIFtbJ0dFVCcsICdmb28nXV1cbiAgICAgIF07XG4gICAgICBmb3IgKGxldCBsaXN0IG9mIGxpc3RzKSB7XG4gICAgICAgIGF3YWl0IGJhZFByb3h5QXZvaWRhbmNlTGlzdChsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYXZvaWQgcHJveHlpbmcgbm9uLXNlc3Npb24gY29tbWFuZHMgZXZlbiBpZiBub3QgaW4gdGhlIGxpc3QnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBkcml2ZXIuZ2V0UHJveHlBdm9pZExpc3QgPSAoKSA9PiBbWydQT1NUJywgbmV3IFJlZ0V4cCgnJyldXTtcblxuICAgICAgY29uc3Qge3N0YXR1cywgZGF0YX0gPSBhd2FpdCBheGlvcyh7XG4gICAgICAgIHVybDogYCR7YmFzZVVybH0vc3RhdHVzYCxcbiAgICAgIH0pO1xuXG4gICAgICBzdGF0dXMuc2hvdWxkLmVxdWFsKDIwMCk7XG4gICAgICBkYXRhLnNob3VsZC5lcWwoe1xuICAgICAgICBzdGF0dXM6IDAsXG4gICAgICAgIHZhbHVlOiBcIkknbSBmaW5lXCIsXG4gICAgICAgIHNlc3Npb25JZDogbnVsbFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGF2b2lkIHByb3h5aW5nIGRlbGV0ZVNlc3Npb24gY29tbWFuZHMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBkcml2ZXIuZ2V0UHJveHlBdm9pZExpc3QgPSAoKSA9PiBbWydQT1NUJywgbmV3IFJlZ0V4cCgnJyldXTtcblxuICAgICAgZHJpdmVyLnNlc3Npb25JZC5zaG91bGQuZXF1YWwoc2Vzc2lvbklkKTtcbiAgICAgIGNvbnN0IHtzdGF0dXN9ID0gYXdhaXQgYXhpb3MuZGVsZXRlKGAke2Jhc2VVcmx9L3Nlc3Npb24vJHtzZXNzaW9uSWR9YCk7XG5cbiAgICAgIHN0YXR1cy5zaG91bGQuZXF1YWwoMjAwKTtcbiAgICAgIHNob3VsZC5ub3QuZXhpc3QoZHJpdmVyLnNlc3Npb25JZCk7XG4gICAgICBkcml2ZXIuandwUHJveHlBY3RpdmUuc2hvdWxkLmJlLmZhbHNlO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl0sIm1hcHBpbmdzIjoiOzs7O0FBRUEsSUFBQUEsRUFBQSxHQUFBQyxPQUFBO0FBR0EsSUFBQUMsV0FBQSxHQUFBRCxPQUFBO0FBQ0EsSUFBQUUsT0FBQSxHQUFBQyxzQkFBQSxDQUFBSCxPQUFBO0FBQ0EsSUFBQUksTUFBQSxHQUFBRCxzQkFBQSxDQUFBSCxPQUFBO0FBQ0EsSUFBQUssS0FBQSxHQUFBRixzQkFBQSxDQUFBSCxPQUFBO0FBQ0EsSUFBQU0sZUFBQSxHQUFBSCxzQkFBQSxDQUFBSCxPQUFBO0FBQ0EsSUFBQU8sTUFBQSxHQUFBSixzQkFBQSxDQUFBSCxPQUFBO0FBQ0EsSUFBQVEsZ0JBQUEsR0FBQVIsT0FBQTtBQUNBLElBQUFTLFFBQUEsR0FBQVQsT0FBQTtBQUVBLElBQUFVLFVBQUEsR0FBQVYsT0FBQTtBQUNBLElBQUFXLFlBQUEsR0FBQVIsc0JBQUEsQ0FBQUgsT0FBQTtBQUdBLElBQUlZLE1BQU0sR0FBR0MsYUFBSSxDQUFDRCxNQUFNLENBQUMsQ0FBQztBQUMxQkMsYUFBSSxDQUFDQyxHQUFHLENBQUNDLHVCQUFjLENBQUM7QUFFeEIsTUFBTUMsVUFBVSxHQUFHLElBQUk7QUFDdkIsTUFBTUMsT0FBTyxHQUFJLG9CQUFtQkQsVUFBVyxTQUFRO0FBRXZERSxRQUFRLENBQUMsVUFBVSxFQUFFLFlBQVk7RUFLL0JBLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxZQUFZO0lBQ3ZDLElBQUlDLENBQUMsR0FBRyxJQUFJQyxzQkFBVSxDQUFDLENBQUM7SUFDeEJDLEVBQUUsQ0FBQyx3REFBd0QsRUFBRSxrQkFBa0I7TUFDN0UsQ0FBQyxNQUFNRixDQUFDLENBQUNHLE1BQU0sQ0FBQyxtQkFBbUIs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
