"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
require("source-map-support/register");
var _capabilities = require("../../lib/basedriver/capabilities");
var _chai = _interopRequireDefault(require("chai"));
var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));
var _lodash = _interopRequireDefault(require("lodash"));
var _desiredCaps = require("../../lib/basedriver/desired-caps");
_chai.default.use(_chaiAsPromised.default);
const should = _chai.default.should();
describe('caps', function () {
  describe('#validateCaps', function () {
    it('returns invalid argument error if "capability" is not a JSON object (1)', function () {
      for (let arg of [undefined, null, 1, true, 'string']) {
        (function () {
          (0, _capabilities.validateCaps)(arg);
        }).should.throw(/must be a JSON object/);
      }
    });
    it('returns result {} by default if caps is empty object and no constraints provided (2)', function () {
      (0, _capabilities.validateCaps)({}).should.deep.equal({});
    });
    describe('throws errors if constraints are not met', function () {
      it('returns invalid argument error if "present" constraint not met on property', function () {
        (() => (0, _capabilities.validateCaps)({}, {
          foo: {
            presence: true
          }
        })).should.throw(/'foo' can't be blank/);
      });
      it('returns the capability that was passed in if "skipPresenceConstraint" is false', function () {
        (0, _capabilities.validateCaps)({}, {
          foo: {
            presence: true
          }
        }, {
          skipPresenceConstraint: true
        }).should.deep.equal({});
      });
      it('returns invalid argument error if "isString" constraint not met on property', function () {
        (() => (0, _capabilities.validateCaps)({
          foo: 1
        }, {
          foo: {
            isString: true
          }
        })).should.throw(/'foo' must be of type string/);
      });
      it('returns invalid argument error if "isNumber" constraint not met on property', function () {
        (() => (0, _capabilities.validateCaps)({
          foo: 'bar'
        }, {
          foo: {
            isNumber: true
          }
        })).should.throw(/'foo' must be of type number/);
      });
      it('returns invalid argument error if "isBoolean" constraint not met on property', function () {
        (() => (0, _capabilities.validateCaps)({
          foo: 'bar'
        }, {
          foo: {
            isBoolean: true
          }
        })).should.throw(/'foo' must be of type boolean/);
      });
      it('returns invalid argument error if "inclusion" constraint not met on property', function () {
        (() => (0, _capabilities.validateCaps)({
          foo: '3'
        }, {
          foo: {
            inclusionCaseInsensitive: ['1', '2']
          }
        })).should.throw(/'foo' 3 not part of 1,2/);
      });
      it('returns invalid argument error if "inclusionCaseInsensitive" constraint not met on property', function () {
        (() => (0, _capabilities.validateCaps)({
          foo: 'a'
        }, {
          foo: {
            inclusion: ['A', 'B', 'C']
          }
        })).should.throw(/'foo' a is not included in the list/);
      });
    });
    it('should not throw errors if constraints are met', function () {
      let caps = {
        number: 1,
        string: 'string',
        present: 'present',
        extra: 'extra'
      };
      let constraints = {
        number: {
          isNumber: true
        },
        string: {
          isString: true
        },
        present: {
          presence: true
        },
        notPresent: {
          presence: false
        }
      };
      (0, _capabilities.validateCaps)(caps, constraints).should.deep.equal(caps);
    });
  });
  describe('#mergeCaps', function () {
    it('returns a result that is {} by default (1)', function () {
      (0, _capabilities.mergeCaps)().should.deep.equal({});
    });
    it('returns a result that matches primary by default (2, 3)', function () {
      (0, _capabilities.mergeCaps)({
        hello: 'world'
      }).should.deep.equal({
        hello: 'world'
      });
    });
    it('returns invalid argument error if primary and secondary have matching properties (4)', function () {
      (() => (0, _capabilities.mergeCaps)({
        hello: 'world'
      }, {
        hello: 'whirl'
      })).should.throw(/property 'hello' should not exist on both primary [\w\W]* and secondary [\w\W]*/);
    });
    it('returns a result with keys from primary and secondary together', function () {
      let primary = {
        a: 'a',
        b: 'b'
      };
      let secondary = {
        c: 'c',
        d: 'd'
      };
      (0, _capabilities.mergeCaps)(primary, secondary).should.deep.equal({
        a: 'a',
        b: 'b',
        c: 'c',
        d: 'd'
      });
    });
  });
  describe('#parseCaps', function () {
    let caps;
    beforeEach(function () {
      caps = {};
    });
    it('should return invalid argument if no caps object provided', function () {
      (() => (0, _capabilities.parseCaps)()).should.throw(/must be a JSON object/);
    });
    it('sets "requiredCaps" to property named "alwaysMatch" (2)', function () {
      caps.alwaysMatch = {
        hello: 'world'
      };
      (0, _capabilities.parseCaps)(caps).requiredCaps.should.deep.equal(caps.alwaysMatch);
    });
    it('sets "requiredCaps" to empty JSON object if "alwaysMatch" is not an object (2.1)', function () {
      (0, _capabilities.parseCaps)(caps).requiredCaps.should.deep.equal({});
    });
    it('returns invalid argument error if "requiredCaps" don\'t match "constraints" (2.2)', function () {
      caps.alwaysMatch = {
        foo: 1
      };
      (() => (0, _capabilities.parseCaps)(caps, {
        foo: {
          isString: true
        }
      })).should.throw(/'foo' must be of type string/);
    });
    it('sets "allFirstMatchCaps" to property named "firstMatch" (3)', function () {
      (0, _capabilities.parseCaps)({}, [{}]).allFirstMatchCaps.should.deep.equal([{}]);
    });
    it('sets "allFirstMatchCaps" to [{}] if "firstMatch" is undefined (3.1)', function () {
      (0, _capabilities.parseCaps)({}).allFirstMatchCaps.should.deep.equal([{}]);
    });
    it('returns invalid argument error if "firstMatch" is not an array and is not undefined (3.2)', function () {
      for (let arg of [null, 1, true, 'string']) {
        caps.firstMatch = arg;
        (function () {
          (0, _capabilities.parseCaps)(caps);
        }).should.throw(/must be a JSON array or undefined/);
      }
    });
    it('has "validatedFirstMatchCaps" property that is empty by default if no valid firstMatch caps were found (4)', function () {
      (0, _capabilities.parseCaps)(caps, {
        foo: {
          presence: true
        }
      }).validatedFirstMatchCaps.should.deep.equal([]);
    });
    describe('returns a "validatedFirstMatchCaps" array (5)', function () {
      it('that equals "firstMatch" if firstMatch is one empty object and there are no constraints', function () {
        caps.firstMatch = [{}];
        (0, _capabilities.parseCaps)(caps).validatedFirstMatchCaps.should.deep.equal(caps.firstMatch);
      });
      it('returns "null" matchedCaps if nothing matches', function () {
        caps.firstMatch = [{}];
        should.equal((0, _capabilities.parseCaps)(caps, {
          foo: {
            presence: true
          }
        }).matchedCaps, null);
      });
      it(`should return capabilities if presence constraint is matched in at least one of the 'firstMatch' capabilities objects`, function () {
        caps.alwaysMatch = {
          foo: 'bar'
        };
        caps.firstMatch = [{
          hello: 'world'
        }, {
          goodbye: 'world'
        }];
        (0, _capabilities.parseCaps)(caps, {
          goodbye: {
            presence: true
          }
        }).matchedCaps.should.deep.equal({
          foo: 'bar',
          goodbye: 'world'
        });
      });
      it(`throws invalid argument if presence constraint is not met on any capabilities`, function () {
        caps.alwaysMatch = {
          foo: 'bar'
        };
        caps.firstMatch = [{
          hello: 'world'
        }, {
          goodbye: 'world'
        }];
        should.equal((0, _capabilities.parseCaps)(caps, {
          someAttribute: {
            presence: true
          }
        }).matchedCaps, null);
      });
      it('that equals firstMatch if firstMatch contains two objects that pass the provided constraints', function () {
        caps.alwaysMatch = {
          foo: 'bar'
        };
        caps.firstMatch = [{
          foo: 'bar1'
        }, {
          foo: 'bar2'
        }];
        let constraints = {
          foo: {
            presence: true,
            isString: true
          }
        };
        (0, _capabilities.parseCaps)(caps, constraints).validatedFirstMatchCaps.should.deep.equal(caps.firstMatch);
      });
      it('returns invalid argument error if the firstMatch[2] is not an object', function () {
        caps.alwaysMatch = 'Not an object and not undefined';
        caps.firstMatch = [{
          foo: 'bar'
        }, 'foo'];
        (() => (0, _capabilities.parseCaps)(caps, {})).should.throw(/must be a JSON object/);
      });
    });
    describe('returns a matchedCaps object (6)', function () {
      beforeEach(function () {
        caps.alwaysMatch = {
          hello: 'world'
        };
      });
      it('which is same as alwaysMatch if firstMatch array is not provided', function () {
        (0, _capabilities.parseCaps)(caps).matchedCaps.should.deep.equal({
          hello: 'world'
        });
      });
      it('merges caps together', function () {
        caps.firstMatch = [{
          foo: 'bar'
        }];
        (0, _capabilities.parseCaps)(caps).matchedCaps.should.deep.equal({
          hello: 'world',
          foo: 'bar'
        });
      });
      it('with merged caps', function () {
        caps.firstMatch = [{
          hello: 'bar',
          foo: 'foo'
        }, {
          foo: 'bar'
        }];
        (0, _capabilities.parseCaps)(caps).matchedCaps.should.deep.equal({
          hello: 'world',
          foo: 'bar'
        });
      });
    });
  });
  describe('#processCaps', function () {
    it('should return "alwaysMatch" if "firstMatch" and "constraints" were not provided', function () {
      (0, _capabilities.processCapabilities)({}).should.deep.equal({});
    });
    it('should return merged caps', function () {
      (0, _capabilities.processCapabilities)({
        alwaysMatch: {
          hello: 'world'
        },
        firstMatch: [{
          foo: 'bar'
        }]
      }).should.deep.equal({
        hello: 'world',
        foo: 'bar'
      });
    });
    it('should strip out the "armor:" prefix for non-standard capabilities', function () {
      (0, _capabilities.processCapabilities)({
        alwaysMatch: {
          'armor:hello': 'world'
        },
        firstMatch: [{
          'armor:foo': 'bar'
        }]
      }).should.deep.equal({
        hello: 'world',
        foo: 'bar'
      });
    });
    it('should still accept prefixed caps even if they are standard capabilities (https://www.w3.org/TR/webdriver/#dfn-table-of-standard-capabilities)', function () {
      (0, _capabilities.processCapabilities)({
        alwaysMatch: {
          'armor:platformName': 'Whatevz'
        },
        firstMatch: [{
          'armor:browserName': 'Anything'
        }]
      }).should.deep.equal({
        platformName: 'Whatevz',
        browserName: 'Anything'
      });
    });
    it('should prefer standard caps that are non-prefixed to prefixed', function () {
      (0, _capabilities.processCapabilities)({
        alwaysMatch: {
          'armor:platformName': 'Foo',
          'platformName': 'Bar'
        },
        firstMatch: [{
          'armor:browserName': 'FOO',
          'browserName': 'BAR'
        }]
      }).should.deep.equal({
        platformName: 'Bar',
        browserName: 'BAR'
      });
    });
    it('should throw exception if duplicates in alwaysMatch and firstMatch', function () {
      (() => (0, _capabilities.processCapabilities)({
        alwaysMatch: {
          'platformName': 'Fake',
          'armor:fakeCap': 'foobar'
        },
        firstMatch: [{
          'armor:platformName': 'bar'
        }]
      })).should.throw(/should not exist on both primary/);
    });
    it('should not throw an exception if presence constraint is not met on a firstMatch capability', function () {
      const caps = (0, _capabilities.processCapabilities)({
        alwaysMatch: {
          'platformName': 'Fake',
          'armor:fakeCap': 'foobar'
        },
        firstMatch: [{
          'foo': 'bar'
        }]
      }, {
        platformName: {
          presence: true
        },
        fakeCap: {
          presence: true
        }
      });
      caps.platformName.should.equal('Fake');
      caps.fakeCap.should.equal('foobar');
      caps.foo.should.equal('bar');
    });
    it('should throw an exception if no matching caps were found', function () {
      (() => (0, _capabilities.processCapabilities)({
        alwaysMatch: {
          'platformName': 'Fake',
          'armor:fakeCap': 'foobar'
        },
        firstMatch: [{
          'foo': 'bar'
        }]
      }, {
        platformName: {
          presence: true
        },
        fakeCap: {
          presence: true
        },
        missingCap: {
          presence: true
        }
      })).should.throw(/'missingCap' can't be blank/);
    });
    describe('validate Armor constraints', function () {
      let constraints = {
        ..._desiredCaps.desiredCapabilityConstraints
      };
      let matchingCaps = {
        'platformName': 'Fake',
        'automationName': 'Fake',
        'deviceName': 'Fake'
      };
      let caps;
      it('should validate when alwaysMatch has the proper caps', function () {
        caps = {
          alwaysMatch: matchingCaps,
          firstMatch: [{}]
        };
        (0, _capabilities.processCapabilities)(caps, constraints).should.deep.equal(matchingCaps);
      });
      it('should validate when firstMatch[0] has the proper caps', function () {
        caps = {
          alwaysMatch: {},
          firstMatch: [matchingCaps]
        };
        (0, _capabilities.processCapabilities)(caps, constraints).should.deep.equal(matchingCaps);
      });
      it('should validate when alwaysMatch and firstMatch[0] have the proper caps when merged together', function () {
        caps = {
          alwaysMatch: _lodash.default.omit(matchingCaps, ['deviceName']),
          firstMatch: [{
            'armor:deviceName': 'Fake'
          }]
        };
        (0, _capabilities.processCapabilities)(caps, constraints).should.deep.equal(matchingCaps);
      });
      it('should validate when automationName is omitted', function () {
        caps = {
          alwaysMatch: _lodash.default.omit(matchingCaps, ['automationName'])
        };
        (0, _capabilities.processCapabilities)(caps, constraints).should.deep.equal(_lodash.default.omit(matchingCaps, 'automationName'));
      });
      it('should pass if first element in "firstMatch" does validate and second element does not', function () {
        caps = {
          alwaysMatch: {},
          firstMatch: [matchingCaps, {
            badCaps: 'badCaps'
          }]
        };
        (0, _capabilities.processCapabilities)(caps, constraints).should.deep.equal(matchingCaps);
      });
      it('should pass if first element in "firstMatch" does not validate and second element does', function () {
        caps = {
          alwaysMatch: {},
          firstMatch: [{
            badCaps: 'badCaps'
          }, matchingCaps]
        };
        (0, _capabilities.processCapabilities)(caps, constraints).should.deep.equal(matchingCaps);
      });
      it('should fail when bad parameters are passed in more than one firstMatch capability', function () {
        caps = {
          alwaysMatch: {},
          firstMatch: [{
            bad: 'params'
          }, {
            more: 'bad-params'
          }]
        };
        (() => (0, _capabilities.processCapabilities)(caps, constraints)).should.throw(/Could not find matching capabilities/);
      });
    });
  });
  describe('.findNonPrefixedCaps', function () {
    it('should find alwaysMatch caps with no prefix', function () {
      (0, _capabilities.findNonPrefixedCaps)({
        alwaysMatch: {
          'non-standard': 'dummy'
        }
      }).should.eql(['non-standard']);
    });
    it('should not find a standard cap in alwaysMatch', function () {
      (0, _capabilities.findNonPrefixedCaps)({
        alwaysMatch: {
          'platformName': 'Any'
        }
      }).should.eql([]);
    });
    it('should find firstMatch caps with no prefix', function () {
      (0, _capabilities.findNonPrefixedCaps)({
        alwaysMatch: {},
        firstMatch: [{
          'non-standard': 'dummy'
        }]
      }).should.eql(['non-standard']);
    });
    it('should not find a standard cap in prefix', function () {
      (0, _capabilities.findNonPrefixedCaps)({
        alwaysMatch: {},
        firstMatch: [{
          'platformName': 'Any'
        }]
      }).should.eql([]);
    });
    it('should find firstMatch caps in second item of firstMatch array', function () {
      (0, _capabilities.findNonPrefixedCaps)({
        alwaysMatch: {},
        firstMatch: [{}, {
          'non-standard': 'dummy'
        }]
      }).should.eql(['non-standard']);
    });
    it('should remove duplicates from alwaysMatch and firstMatch', function () {
      (0, _capabilities.findNonPrefixedCaps)({
        alwaysMatch: {
          'non-standard': 'something'
        },
        firstMatch: [{
          'non-standard': 'dummy'
        }]
      }).should.eql(['non-standard']);
    });
    it('should remove duplicates from firstMatch', function () {
      (0, _capabilities.findNonPrefixedCaps)({
        firstMatch: [{
          'non-standard': 'dummy'
        }, {
          'non-standard': 'dummy 2'
        }]
      }).should.eql(['non-standard']);
    });
    it('should remove duplicates and keep standard capabilities', function () {
      const alwaysMatch = {
        platformName: 'Fake',
        nonStandardOne: 'non-standard',
        nonStandardTwo: 'non-standard'
      };
      const firstMatch = [{
        nonStandardThree: 'non-standard',
        nonStandardFour: 'non-standard',
        browserName: 'FakeBrowser'
      }, {
        nonStandardThree: 'non-standard',
        nonStandardFour: 'non-standard',
        nonStandardFive: 'non-standard',
        browserVersion: 'whateva'
      }];
      (0, _capabilities.findNonPrefixedCaps)({
        alwaysMatch,
        firstMatch
      }).should.eql(['nonStandardOne', 'nonStandardTwo', 'nonStandardThree', 'nonStandardFour', 'nonStandardFive']);
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC9iYXNlZHJpdmVyL2NhcGFiaWxpdGllcy1zcGVjcy5qcyIsIm5hbWVzIjpbIl9jYXBhYmlsaXRpZXMiLCJyZXF1aXJlIiwiX2NoYWkiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwiX2NoYWlBc1Byb21pc2VkIiwiX2xvZGFzaCIsIl9kZXNpcmVkQ2FwcyIsImNoYWkiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsInNob3VsZCIsImRlc2NyaWJlIiwiaXQiLCJhcmciLCJ1bmRlZmluZWQiLCJ2YWxpZGF0ZUNhcHMiLCJ0aHJvdyIsImRlZXAiLCJlcXVhbCIsImZvbyIsInByZXNlbmNlIiwic2tpcFByZXNlbmNlQ29uc3RyYWludCIsImlzU3RyaW5nIiwiaXNOdW1iZXIiLCJpc0Jvb2xlYW4iLCJpbmNsdXNpb25DYXNlSW5zZW5zaXRpdmUiLCJpbmNsdXNpb24iLCJjYXBzIiwibnVtYmVyIiwic3RyaW5nIiwicHJlc2VudCIsImV4dHJhIiwiY29uc3RyYWludHMiLCJub3RQcmVzZW50IiwibWVyZ2VDYXBzIiwiaGVsbG8iLCJwcmltYXJ5IiwiYSIsImIiLCJzZWNvbmRhcnkiLCJjIiwiZCIsImJlZm9yZUVhY2giLCJwYXJzZUNhcHMiLCJhbHdheXNNYXRjaCIsInJlcXVpcmVkQ2FwcyIsImFsbEZpcnN0TWF0Y2hDYXBzIiwiZmlyc3RNYXRjaCIsInZhbGlkYXRlZEZpcnN0TWF0Y2hDYXBzIiwibWF0Y2hlZENhcHMiLCJnb29kYnllIiwic29tZUF0dHJpYnV0ZSIsInByb2Nlc3NDYXBhYmlsaXRpZXMiLCJwbGF0Zm9ybU5hbWUiLCJicm93c2VyTmFtZSIsImZha2VDYXAiLCJtaXNzaW5nQ2FwIiwiZGVzaXJlZENhcGFiaWxpdHlDb25zdHJhaW50cyIsIm1hdGNoaW5nQ2FwcyIsIl8iLCJvbWl0IiwiYmFkQ2FwcyIsImJhZCIsIm1vcmUiLCJmaW5kTm9uUHJlZml4ZWRDYXBzIiwiZXFsIiwibm9uU3RhbmRhcmRPbmUiLCJub25TdGFuZGFyZFR3byIsIm5vblN0YW5kYXJkVGhyZWUiLCJub25TdGFuZGFyZEZvdXIiLCJub25TdGFuZGFyZEZpdmUiLCJicm93c2VyVmVyc2lvbiJdLCJzb3VyY2VSb290IjoiLi4vLi4vLi4iLCJzb3VyY2VzIjpbInRlc3QvYmFzZWRyaXZlci9jYXBhYmlsaXRpZXMtc3BlY3MuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcGFyc2VDYXBzLCB2YWxpZGF0ZUNhcHMsIG1lcmdlQ2FwcywgcHJvY2Vzc0NhcGFiaWxpdGllcywgZmluZE5vblByZWZpeGVkQ2FwcyB9IGZyb20gJy4uLy4uL2xpYi9iYXNlZHJpdmVyL2NhcGFiaWxpdGllcyc7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBkZXNpcmVkQ2FwYWJpbGl0eUNvbnN0cmFpbnRzIH0gZnJvbSAnLi4vLi4vbGliL2Jhc2Vkcml2ZXIvZGVzaXJlZC1jYXBzJztcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3Qgc2hvdWxkID0gY2hhaS5zaG91bGQoKTtcblxuZGVzY3JpYmUoJ2NhcHMnLCBmdW5jdGlvbiAoKSB7XG5cbiAgLy8gVGVzdHMgYmFzZWQgb246IGh0dHBzOi8vd3d3LnczLm9yZy9UUi93ZWJkcml2ZXIvI2Rmbi12YWxpZGF0ZS1jYXBzXG4gIGRlc2NyaWJlKCcjdmFsaWRhdGVDYXBzJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdyZXR1cm5zIGludmFsaWQgYXJndW1lbnQgZXJyb3IgaWYgXCJjYXBhYmlsaXR5XCIgaXMgbm90IGEgSlNPTiBvYmplY3QgKDEpJywgZnVuY3Rpb24gKCkge1xuICAgICAgZm9yIChsZXQgYXJnIG9mIFt1bmRlZmluZWQsIG51bGwsIDEsIHRydWUsICdzdHJpbmcnXSkge1xuICAgICAgICAoZnVuY3Rpb24gKCkgeyB2YWxpZGF0ZUNhcHMoYXJnKTsgfSkuc2hvdWxkLnRocm93KC9tdXN0IGJlIGEgSlNPTiBvYmplY3QvKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGl0KCdyZXR1cm5zIHJlc3VsdCB7fSBieSBkZWZhdWx0IGlmIGNhcHMgaXMgZW1wdHkgb2JqZWN0IGFuZCBubyBjb25zdHJhaW50cyBwcm92aWRlZCAoMiknLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YWxpZGF0ZUNhcHMoe30pLnNob3VsZC5kZWVwLmVxdWFsKHt9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCd0aHJvd3MgZXJyb3JzIGlmIGNvbnN0cmFpbnRzIGFyZSBub3QgbWV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3JldHVybnMgaW52YWxpZCBhcmd1bWVudCBlcnJvciBpZiBcInByZXNlbnRcIiBjb25zdHJhaW50IG5vdCBtZXQgb24gcHJvcGVydHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB2YWxpZGF0ZUNhcHMoe30sIHtmb286IHtwcmVzZW5jZTogdHJ1ZX19KSkuc2hvdWxkLnRocm93KC8nZm9vJyBjYW4ndCBiZSBibGFuay8pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdyZXR1cm5zIHRoZSBjYXBhYmlsaXR5IHRoYXQgd2FzIHBhc3NlZCBpbiBpZiBcInNraXBQcmVzZW5jZUNvbnN0cmFpbnRcIiBpcyBmYWxzZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFsaWRhdGVDYXBzKHt9LCB7Zm9vOiB7cHJlc2VuY2U6IHRydWV9fSwge3NraXBQcmVzZW5jZUNvbnN0cmFpbnQ6IHRydWV9KS5zaG91bGQuZGVlcC5lcXVhbCh7fSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3JldHVybnMgaW52YWxpZCBhcmd1bWVudCBlcnJvciBpZiBcImlzU3RyaW5nXCIgY29uc3RyYWludCBub3QgbWV0IG9uIHByb3BlcnR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4gdmFsaWRhdGVDYXBzKHtmb286IDF9LCB7Zm9vOiB7aXNTdHJpbmc6IHRydWV9fSkpLnNob3VsZC50aHJvdygvJ2ZvbycgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy8pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdyZXR1cm5zIGludmFsaWQgYXJndW1lbnQgZXJyb3IgaWYgXCJpc051bWJlclwiIGNvbnN0cmFpbnQgbm90IG1ldCBvbiBwcm9wZXJ0eScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHZhbGlkYXRlQ2Fwcyh7Zm9vOiAnYmFyJ30sIHtmb286IHtpc051bWJlcjogdHJ1ZX19KSkuc2hvdWxkLnRocm93KC8nZm9vJyBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyLyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3JldHVybnMgaW52YWxpZCBhcmd1bWVudCBlcnJvciBpZiBcImlzQm9vbGVhblwiIGNvbnN0cmFpbnQgbm90IG1ldCBvbiBwcm9wZXJ0eScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHZhbGlkYXRlQ2Fwcyh7Zm9vOiAnYmFyJ30sIHtmb286IHtpc0Jvb2xlYW46IHRydWV9fSkpLnNob3VsZC50aHJvdygvJ2ZvbycgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4vKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgncmV0dXJucyBpbnZhbGlkIGFyZ3VtZW50IGVycm9yIGlmIFwiaW5jbHVzaW9uXCIgY29uc3RyYWludCBub3QgbWV0IG9uIHByb3BlcnR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4gdmFsaWRhdGVDYXBzKHtmb286ICczJ30sIHtmb286IHtpbmNsdXNpb25DYXNlSW5zZW5zaXRpdmU6IFsnMScsICcyJ119fSkpLnNob3VsZC50aHJvdygvJ2ZvbycgMyBub3QgcGFydCBvZiAxLDIvKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgncmV0dXJucyBpbnZhbGlkIGFyZ3VtZW50IGVycm9yIGlmIFwiaW5jbHVzaW9uQ2FzZUluc2Vuc2l0aXZlXCIgY29uc3RyYWludCBub3QgbWV0IG9uIHByb3BlcnR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4gdmFsaWRhdGVDYXBzKHtmb286ICdhJ30sIHtmb286IHtpbmNsdXNpb246IFsnQScsICdCJywgJ0MnXX19KSkuc2hvdWxkLnRocm93KC8nZm9vJyBhIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgbGlzdC8pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG5vdCB0aHJvdyBlcnJvcnMgaWYgY29uc3RyYWludHMgYXJlIG1ldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBjYXBzID0ge1xuICAgICAgICBudW1iZXI6IDEsXG4gICAgICAgIHN0cmluZzogJ3N0cmluZycsXG4gICAgICAgIHByZXNlbnQ6ICdwcmVzZW50JyxcbiAgICAgICAgZXh0cmE6ICdleHRyYScsXG4gICAgICB9O1xuXG4gICAgICBsZXQgY29uc3RyYWludHMgPSB7XG4gICAgICAgIG51bWJlcjoge2lzTnVtYmVyOiB0cnVlfSxcbiAgICAgICAgc3RyaW5nOiB7aXNTdHJpbmc6IHRydWV9LFxuICAgICAgICBwcmVzZW50OiB7cHJlc2VuY2U6IHRydWV9LFxuICAgICAgICBub3RQcmVzZW50OiB7cHJlc2VuY2U6IGZhbHNlfSxcbiAgICAgIH07XG5cbiAgICAgIHZhbGlkYXRlQ2FwcyhjYXBzLCBjb25zdHJhaW50cykuc2hvdWxkLmRlZXAuZXF1YWwoY2Fwcyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIFRlc3RzIGJhc2VkIG9uOiBodHRwczovL3d3dy53My5vcmcvVFIvd2ViZHJpdmVyLyNkZm4tbWVyZ2luZy1jYXBzXG4gIGRlc2NyaWJlKCcjbWVyZ2VDYXBzJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdyZXR1cm5zIGEgcmVzdWx0IHRoYXQgaXMge30gYnkgZGVmYXVsdCAoMSknLCBmdW5jdGlvbiAoKSB7XG4gICAgICBtZXJnZUNhcHMoKS5zaG91bGQuZGVlcC5lcXVhbCh7fSk7XG4gICAgfSk7XG5cbiAgICBpdCgncmV0dXJucyBhIHJlc3VsdCB0aGF0IG1hdGNoZXMgcHJpbWFyeSBieSBkZWZhdWx0ICgyLCAzKScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1lcmdlQ2Fwcyh7aGVsbG86ICd3b3JsZCd9KS5zaG91bGQuZGVlcC5lcXVhbCh7aGVsbG86ICd3b3JsZCd9KTtcbiAgICB9KTtcblxuICAgIGl0KCdyZXR1cm5zIGludmFsaWQgYXJndW1lbnQgZXJyb3IgaWYgcHJpbWFyeSBhbmQgc2Vjb25kYXJ5IGhhdmUgbWF0Y2hpbmcgcHJvcGVydGllcyAoNCknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAoKCkgPT4gbWVyZ2VDYXBzKHtoZWxsbzogJ3dvcmxkJ30sIHtoZWxsbzogJ3doaXJsJ30pKS5zaG91bGQudGhyb3coL3Byb3BlcnR5ICdoZWxsbycgc2hvdWxkIG5vdCBleGlzdCBvbiBib3RoIHByaW1hcnkgW1xcd1xcV10qIGFuZCBzZWNvbmRhcnkgW1xcd1xcV10qLyk7XG4gICAgfSk7XG5cbiAgICBpdCgncmV0dXJucyBhIHJlc3VsdCB3aXRoIGtleXMgZnJvbSBwcmltYXJ5IGFuZCBzZWNvbmRhcnkgdG9nZXRoZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgcHJpbWFyeSA9IHtcbiAgICAgICAgYTogJ2EnLFxuICAgICAgICBiOiAnYicsXG4gICAgICB9O1xuICAgICAgbGV0IHNlY29uZGFyeSA9IHtcbiAgICAgICAgYzogJ2MnLFxuICAgICAgICBkOiAnZCcsXG4gICAgICB9O1xuICAgICAgbWVyZ2VDYXBzKHByaW1hcnksIHNlY29uZGFyeSkuc2hvdWxkLmRlZXAuZXF1YWwoe1xuICAgICAgICBhOiAnYScsIGI6ICdiJywgYzogJ2MnLCBkOiAnZCcsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gVGVzdHMgYmFzZWQgb246IGh0dHBzOi8vd3d3LnczLm9yZy9UUi93ZWJkcml2ZXIvI3Byb2Nlc3NpbmctY2Fwc1xuICBkZXNjcmliZSgnI3BhcnNlQ2FwcycsIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgY2FwcztcblxuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgY2FwcyA9IHt9O1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gaW52YWxpZCBhcmd1bWVudCBpZiBubyBjYXBzIG9iamVjdCBwcm92aWRlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICgoKSA9PiBwYXJzZUNhcHMoKSkuc2hvdWxkLnRocm93KC9tdXN0IGJlIGEgSlNPTiBvYmplY3QvKTtcbiAgICB9KTtcblxuICAgIGl0KCdzZXRzIFwicmVxdWlyZWRDYXBzXCIgdG8gcHJvcGVydHkgbmFtZWQgXCJhbHdheXNNYXRjaFwiICgyKScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhcHMuYWx3YXlzTWF0Y2ggPSB7aGVsbG86ICd3b3JsZCd9O1xuICAgICAgcGFyc2VDYXBzKGNhcHMpLnJlcXVpcmVkQ2Fwcy5zaG91bGQuZGVlcC5lcXVhbChjYXBzLmFsd2F5c01hdGNoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzZXRzIFwicmVxdWlyZWRDYXBzXCIgdG8gZW1wdHkgSlNPTiBvYmplY3QgaWYgXCJhbHdheXNNYXRjaFwiIGlzIG5vdCBhbiBvYmplY3QgKDIuMSknLCBmdW5jdGlvbiAoKSB7XG4gICAgICBwYXJzZUNhcHMoY2FwcykucmVxdWlyZWRDYXBzLnNob3VsZC5kZWVwLmVxdWFsKHt9KTtcbiAgICB9KTtcblxuICAgIGl0KCdyZXR1cm5zIGludmFsaWQgYXJndW1lbnQgZXJyb3IgaWYgXCJyZXF1aXJlZENhcHNcIiBkb25cXCd0IG1hdGNoIFwiY29uc3RyYWludHNcIiAoMi4yKScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhcHMuYWx3YXlzTWF0Y2ggPSB7Zm9vOiAxfTtcbiAgICAgICgoKSA9PiBwYXJzZUNhcHMoY2Fwcywge2Zvbzoge2lzU3RyaW5nOiB0cnVlfX0pKS5zaG91bGQudGhyb3coLydmb28nIG11c3QgYmUgb2YgdHlwZSBzdHJpbmcvKTtcbiAgICB9KTtcblxuICAgIGl0KCdzZXRzIFwiYWxsRmlyc3RNYXRjaENhcHNcIiB0byBwcm9wZXJ0eSBuYW1lZCBcImZpcnN0TWF0Y2hcIiAoMyknLCBmdW5jdGlvbiAoKSB7XG4gICAgICBwYXJzZUNhcHMoe30sIFt7fV0pLmFsbEZpcnN0TWF0Y2hDYXBzLnNob3VsZC5kZWVwLmVxdWFsKFt7fV0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3NldHMgXCJhbGxGaXJzdE1hdGNoQ2Fwc1wiIHRvIFt7fV0gaWYgXCJmaXJzdE1hdGNoXCIgaXMgdW5kZWZpbmVkICgzLjEpJywgZnVuY3Rpb24gKCkge1xuICAgICAgcGFyc2VDYXBzKHt9KS5hbGxGaXJzdE1hdGNoQ2Fwcy5zaG91bGQuZGVlcC5lcXVhbChbe31dKTtcbiAgICB9KTtcblxuICAgIGl0KCdyZXR1cm5zIGludmFsaWQgYXJndW1lbnQgZXJyb3IgaWYgXCJmaXJzdE1hdGNoXCIgaXMgbm90IGFuIGFycmF5IGFuZCBpcyBub3QgdW5kZWZpbmVkICgzLjIpJywgZnVuY3Rpb24gKCkge1xuICAgICAgZm9yIChsZXQgYXJnIG9mIFtudWxsLCAxLCB0cnVlLCAnc3RyaW5nJ10pIHtcbiAgICAgICAgY2Fwcy5maXJzdE1hdGNoID0gYXJnO1xuICAgICAgICAoZnVuY3Rpb24gKCkgeyBwYXJzZUNhcHMoY2Fwcyk7IH0pLnNob3VsZC50aHJvdygvbXVzdCBiZSBhIEpTT04gYXJyYXkgb3IgdW5kZWZpbmVkLyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpdCgnaGFzIFwidmFsaWRhdGVkRmlyc3RNYXRjaENhcHNcIiBwcm9wZXJ0eSB0aGF0IGlzIGVtcHR5IGJ5IGRlZmF1bHQgaWYgbm8gdmFsaWQgZmlyc3RNYXRjaCBjYXBzIHdlcmUgZm91bmQgKDQpJywgZnVuY3Rpb24gKCkge1xuICAgICAgcGFyc2VDYXBzKGNhcHMsIHtmb286IHtwcmVzZW5jZTogdHJ1ZX19KS52YWxpZGF0ZWRGaXJzdE1hdGNoQ2Fwcy5zaG91bGQuZGVlcC5lcXVhbChbXSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgncmV0dXJucyBhIFwidmFsaWRhdGVkRmlyc3RNYXRjaENhcHNcIiBhcnJheSAoNSknLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgndGhhdCBlcXVhbHMgXCJmaXJzdE1hdGNoXCIgaWYgZmlyc3RNYXRjaCBpcyBvbmUgZW1wdHkgb2JqZWN0IGFuZCB0aGVyZSBhcmUgbm8gY29uc3RyYWludHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhcHMuZmlyc3RNYXRjaCA9IFt7fV07XG4gICAgICAgIHBhcnNlQ2FwcyhjYXBzKS52YWxpZGF0ZWRGaXJzdE1hdGNoQ2Fwcy5zaG91bGQuZGVlcC5lcXVhbChjYXBzLmZpcnN0TWF0Y2gpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdyZXR1cm5zIFwibnVsbFwiIG1hdGNoZWRDYXBzIGlmIG5vdGhpbmcgbWF0Y2hlcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2Fwcy5maXJzdE1hdGNoID0gW3t9XTtcbiAgICAgICAgc2hvdWxkLmVxdWFsKHBhcnNlQ2FwcyhjYXBzLCB7Zm9vOiB7cHJlc2VuY2U6IHRydWV9fSkubWF0Y2hlZENhcHMsIG51bGwpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KGBzaG91bGQgcmV0dXJuIGNhcGFiaWxpdGllcyBpZiBwcmVzZW5jZSBjb25zdHJhaW50IGlzIG1hdGNoZWQgaW4gYXQgbGVhc3Qgb25lIG9mIHRoZSAnZmlyc3RNYXRjaCcgY2FwYWJpbGl0aWVzIG9iamVjdHNgLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhcHMuYWx3YXlzTWF0Y2ggPSB7XG4gICAgICAgICAgZm9vOiAnYmFyJyxcbiAgICAgICAgfTtcbiAgICAgICAgY2Fwcy5maXJzdE1hdGNoID0gW3tcbiAgICAgICAgICBoZWxsbzogJ3dvcmxkJyxcbiAgICAgICAgfSwge1xuICAgICAgICAgIGdvb2RieWU6ICd3b3JsZCcsXG4gICAgICAgIH1dO1xuICAgICAgICBwYXJzZUNhcHMoY2Fwcywge2dvb2RieWU6IHtwcmVzZW5jZTogdHJ1ZX19KS5tYXRjaGVkQ2Fwcy5zaG91bGQuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgZm9vOiAnYmFyJyxcbiAgICAgICAgICBnb29kYnllOiAnd29ybGQnLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdChgdGhyb3dzIGludmFsaWQgYXJndW1lbnQgaWYgcHJlc2VuY2UgY29uc3RyYWludCBpcyBub3QgbWV0IG9uIGFueSBjYXBhYmlsaXRpZXNgLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhcHMuYWx3YXlzTWF0Y2ggPSB7XG4gICAgICAgICAgZm9vOiAnYmFyJyxcbiAgICAgICAgfTtcbiAgICAgICAgY2Fwcy5maXJzdE1hdGNoID0gW3tcbiAgICAgICAgICBoZWxsbzogJ3dvcmxkJyxcbiAgICAgICAgfSwge1xuICAgICAgICAgIGdvb2RieWU6ICd3b3JsZCcsXG4gICAgICAgIH1dO1xuICAgICAgICBzaG91bGQuZXF1YWwocGFyc2VDYXBzKGNhcHMsIHtzb21lQXR0cmlidXRlOiB7cHJlc2VuY2U6IHRydWV9fSkubWF0Y2hlZENhcHMsIG51bGwpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCd0aGF0IGVxdWFscyBmaXJzdE1hdGNoIGlmIGZpcnN0TWF0Y2ggY29udGFpbnMgdHdvIG9iamVjdHMgdGhhdCBwYXNzIHRoZSBwcm92aWRlZCBjb25zdHJhaW50cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2Fwcy5hbHdheXNNYXRjaCA9IHtcbiAgICAgICAgICBmb286ICdiYXInXG4gICAgICAgIH07XG4gICAgICAgIGNhcHMuZmlyc3RNYXRjaCA9IFtcbiAgICAgICAgICB7Zm9vOiAnYmFyMSd9LFxuICAgICAgICAgIHtmb286ICdiYXIyJ30sXG4gICAgICAgIF07XG5cbiAgICAgICAgbGV0IGNvbnN0cmFpbnRzID0ge1xuICAgICAgICAgIGZvbzoge1xuICAgICAgICAgICAgcHJlc2VuY2U6IHRydWUsXG4gICAgICAgICAgICBpc1N0cmluZzogdHJ1ZSxcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcGFyc2VDYXBzKGNhcHMsIGNvbnN0cmFpbnRzKS52YWxpZGF0ZWRGaXJzdE1hdGNoQ2Fwcy5zaG91bGQuZGVlcC5lcXVhbChjYXBzLmZpcnN0TWF0Y2gpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdyZXR1cm5zIGludmFsaWQgYXJndW1lbnQgZXJyb3IgaWYgdGhlIGZpcnN0TWF0Y2hbMl0gaXMgbm90IGFuIG9iamVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2Fwcy5hbHdheXNNYXRjaCA9ICdOb3QgYW4gb2JqZWN0IGFuZCBub3QgdW5kZWZpbmVkJztcbiAgICAgICAgY2Fwcy5maXJzdE1hdGNoID0gW3tmb286ICdiYXInfSwgJ2ZvbyddO1xuICAgICAgICAoKCkgPT4gcGFyc2VDYXBzKGNhcHMsIHt9KSkuc2hvdWxkLnRocm93KC9tdXN0IGJlIGEgSlNPTiBvYmplY3QvKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3JldHVybnMgYSBtYXRjaGVkQ2FwcyBvYmplY3QgKDYpJywgZnVuY3Rpb24gKCkge1xuICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhcHMuYWx3YXlzTWF0Y2ggPSB7aGVsbG86ICd3b3JsZCd9O1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCd3aGljaCBpcyBzYW1lIGFzIGFsd2F5c01hdGNoIGlmIGZpcnN0TWF0Y2ggYXJyYXkgaXMgbm90IHByb3ZpZGVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBwYXJzZUNhcHMoY2FwcykubWF0Y2hlZENhcHMuc2hvdWxkLmRlZXAuZXF1YWwoe2hlbGxvOiAnd29ybGQnfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ21lcmdlcyBjYXBzIHRvZ2V0aGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjYXBzLmZpcnN0TWF0Y2ggPSBbe2ZvbzogJ2Jhcid9XTtcbiAgICAgICAgcGFyc2VDYXBzKGNhcHMpLm1hdGNoZWRDYXBzLnNob3VsZC5kZWVwLmVxdWFsKHtoZWxsbzogJ3dvcmxkJywgZm9vOiAnYmFyJ30pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCd3aXRoIG1lcmdlZCBjYXBzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjYXBzLmZpcnN0TWF0Y2ggPSBbe2hlbGxvOiAnYmFyJywgZm9vOiAnZm9vJ30sIHtmb286ICdiYXInfV07XG4gICAgICAgIHBhcnNlQ2FwcyhjYXBzKS5tYXRjaGVkQ2Fwcy5zaG91bGQuZGVlcC5lcXVhbCh7aGVsbG86ICd3b3JsZCcsIGZvbzogJ2Jhcid9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnI3Byb2Nlc3NDYXBzJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIFwiYWx3YXlzTWF0Y2hcIiBpZiBcImZpcnN0TWF0Y2hcIiBhbmQgXCJjb25zdHJhaW50c1wiIHdlcmUgbm90IHByb3ZpZGVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgcHJvY2Vzc0NhcGFiaWxpdGllcyh7fSkuc2hvdWxkLmRlZXAuZXF1YWwoe30pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gbWVyZ2VkIGNhcHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBwcm9jZXNzQ2FwYWJpbGl0aWVzKHtcbiAgICAgICAgYWx3YXlzTWF0Y2g6IHtoZWxsbzogJ3dvcmxkJ30sXG4gICAgICAgIGZpcnN0TWF0Y2g6IFt7Zm9vOiAnYmFyJ31dXG4gICAgICB9KS5zaG91bGQuZGVlcC5lcXVhbCh7aGVsbG86ICd3b3JsZCcsIGZvbzogJ2Jhcid9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc3RyaXAgb3V0IHRoZSBcImFybW9yOlwiIHByZWZpeCBmb3Igbm9uLXN0YW5kYXJkIGNhcGFiaWxpdGllcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHByb2Nlc3NDYXBhYmlsaXRpZXMoe1xuICAgICAgICBhbHdheXNNYXRjaDogeydhcm1vcjpoZWxsbyc6ICd3b3JsZCd9LFxuICAgICAgICBmaXJzdE1hdGNoOiBbeydhcm1vcjpmb28nOiAnYmFyJ31dXG4gICAgICB9KS5zaG91bGQuZGVlcC5lcXVhbCh7aGVsbG86ICd3b3JsZCcsIGZvbzogJ2Jhcid9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc3RpbGwgYWNjZXB0IHByZWZpeGVkIGNhcHMgZXZlbiBpZiB0aGV5IGFyZSBzdGFuZGFyZCBjYXBhYmlsaXRpZXMgKGh0dHBzOi8vd3d3LnczLm9yZy9UUi93ZWJkcml2ZXIvI2Rmbi10YWJsZS1vZi1zdGFuZGFyZC1jYXBhYmlsaXRpZXMpJywgZnVuY3Rpb24gKCkge1xuICAgICAgcHJvY2Vzc0NhcGFiaWxpdGllcyh7XG4gICAgICAgIGFsd2F5c01hdGNoOiB7J2FybW9yOnBsYXRmb3JtTmFtZSc6ICdXaGF0ZXZ6J30sXG4gICAgICAgIGZpcnN0TWF0Y2g6IFt7J2FybW9yOmJyb3dzZXJOYW1lJzogJ0FueXRoaW5nJ31dLFxuICAgICAgfSkuc2hvdWxkLmRlZXAuZXF1YWwoe3BsYXRmb3JtTmFtZTogJ1doYXRldnonLCBicm93c2VyTmFtZTogJ0FueXRoaW5nJ30pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwcmVmZXIgc3RhbmRhcmQgY2FwcyB0aGF0IGFyZSBub24tcHJlZml4ZWQgdG8gcHJlZml4ZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBwcm9jZXNzQ2FwYWJpbGl0aWVzKHtcbiAgICAgICAgYWx3YXlzTWF0Y2g6IHsnYXJtb3I6cGxhdGZvcm1OYW1lJzogJ0ZvbycsICdwbGF0Zm9ybU5hbWUnOiAnQmFyJ30sXG4gICAgICAgIGZpcnN0TWF0Y2g6IFt7J2FybW9yOmJyb3dzZXJOYW1lJzogJ0ZPTycsICdicm93c2VyTmFtZSc6ICdCQVInfV0sXG4gICAgICB9KS5zaG91bGQuZGVlcC5lcXVhbCh7cGxhdGZvcm1OYW1lOiAnQmFyJywgYnJvd3Nlck5hbWU6ICdCQVInfSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBleGNlcHRpb24gaWYgZHVwbGljYXRlcyBpbiBhbHdheXNNYXRjaCBhbmQgZmlyc3RNYXRjaCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICgoKSA9PiBwcm9jZXNzQ2FwYWJpbGl0aWVzKHtcbiAgICAgICAgYWx3YXlzTWF0Y2g6IHsncGxhdGZvcm1OYW1lJzogJ0Zha2UnLCAnYXJtb3I6ZmFrZUNhcCc6ICdmb29iYXInfSxcbiAgICAgICAgZmlyc3RNYXRjaDogW3snYXJtb3I6cGxhdGZvcm1OYW1lJzogJ2Jhcid9XSxcbiAgICAgIH0pKS5zaG91bGQudGhyb3coL3Nob3VsZCBub3QgZXhpc3Qgb24gYm90aCBwcmltYXJ5Lyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG5vdCB0aHJvdyBhbiBleGNlcHRpb24gaWYgcHJlc2VuY2UgY29uc3RyYWludCBpcyBub3QgbWV0IG9uIGEgZmlyc3RNYXRjaCBjYXBhYmlsaXR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgY2FwcyA9IHByb2Nlc3NDYXBhYmlsaXRpZXMoe1xuICAgICAgICBhbHdheXNNYXRjaDogeydwbGF0Zm9ybU5hbWUnOiAnRmFrZScsICdhcm1vcjpmYWtlQ2FwJzogJ2Zvb2Jhcid9LFxuICAgICAgICBmaXJzdE1hdGNoOiBbeydmb28nOiAnYmFyJ31dLFxuICAgICAgfSwge1xuICAgICAgICBwbGF0Zm9ybU5hbWU6IHtcbiAgICAgICAgICBwcmVzZW5jZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgZmFrZUNhcDoge1xuICAgICAgICAgIHByZXNlbmNlOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgY2Fwcy5wbGF0Zm9ybU5hbWUuc2hvdWxkLmVxdWFsKCdGYWtlJyk7XG4gICAgICBjYXBzLmZha2VDYXAuc2hvdWxkLmVxdWFsKCdmb29iYXInKTtcbiAgICAgIGNhcHMuZm9vLnNob3VsZC5lcXVhbCgnYmFyJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBubyBtYXRjaGluZyBjYXBzIHdlcmUgZm91bmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAoKCkgPT4gcHJvY2Vzc0NhcGFiaWxpdGllcyh7XG4gICAgICAgIGFsd2F5c01hdGNoOiB7J3BsYXRmb3JtTmFtZSc6ICdGYWtlJywgJ2FybW9yOmZha2VDYXAnOiAnZm9vYmFyJ30sXG4gICAgICAgIGZpcnN0TWF0Y2g6IFt7J2Zvbyc6ICdiYXInfV0sXG4gICAgICB9LCB7XG4gICAgICAgIHBsYXRmb3JtTmFtZToge1xuICAgICAgICAgIHByZXNlbmNlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBmYWtlQ2FwOiB7XG4gICAgICAgICAgcHJlc2VuY2U6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgbWlzc2luZ0NhcDoge1xuICAgICAgICAgIHByZXNlbmNlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSkpLnNob3VsZC50aHJvdygvJ21pc3NpbmdDYXAnIGNhbid0IGJlIGJsYW5rLyk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgndmFsaWRhdGUgQXJtb3IgY29uc3RyYWludHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgY29uc3RyYWludHMgPSB7Li4uZGVzaXJlZENhcGFiaWxpdHlDb25zdHJhaW50c307XG5cbiAgICAgIGxldCBtYXRjaGluZ0NhcHMgPSB7J3BsYXRmb3JtTmFtZSc6ICdGYWtlJywgJ2F1dG9tYXRpb25OYW1lJzogJ0Zha2UnLCAnZGV2aWNlTmFtZSc6ICdGYWtlJ307XG4gICAgICBsZXQgY2FwcztcblxuICAgICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSB3aGVuIGFsd2F5c01hdGNoIGhhcyB0aGUgcHJvcGVyIGNhcHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhcHMgPSB7XG4gICAgICAgICAgYWx3YXlzTWF0Y2g6IG1hdGNoaW5nQ2FwcyxcbiAgICAgICAgICBmaXJzdE1hdGNoOiBbe31dLFxuICAgICAgICB9O1xuICAgICAgICBwcm9jZXNzQ2FwYWJpbGl0aWVzKGNhcHMsIGNvbnN0cmFpbnRzKS5zaG91bGQuZGVlcC5lcXVhbChtYXRjaGluZ0NhcHMpO1xuICAgICAgfSk7XG5cblxuICAgICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSB3aGVuIGZpcnN0TWF0Y2hbMF0gaGFzIHRoZSBwcm9wZXIgY2FwcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2FwcyA9IHtcbiAgICAgICAgICBhbHdheXNNYXRjaDoge30sXG4gICAgICAgICAgZmlyc3RNYXRjaDogW21hdGNoaW5nQ2Fwc10sXG4gICAgICAgIH07XG4gICAgICAgIHByb2Nlc3NDYXBhYmlsaXRpZXMoY2FwcywgY29uc3RyYWludHMpLnNob3VsZC5kZWVwLmVxdWFsKG1hdGNoaW5nQ2Fwcyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSB3aGVuIGFsd2F5c01hdGNoIGFuZCBmaXJzdE1hdGNoWzBdIGhhdmUgdGhlIHByb3BlciBjYXBzIHdoZW4gbWVyZ2VkIHRvZ2V0aGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjYXBzID0ge1xuICAgICAgICAgIGFsd2F5c01hdGNoOiBfLm9taXQobWF0Y2hpbmdDYXBzLCBbJ2RldmljZU5hbWUnXSksXG4gICAgICAgICAgZmlyc3RNYXRjaDogW3snYXJtb3I6ZGV2aWNlTmFtZSc6ICdGYWtlJ31dLFxuICAgICAgICB9O1xuICAgICAgICBwcm9jZXNzQ2FwYWJpbGl0aWVzKGNhcHMsIGNvbnN0cmFpbnRzKS5zaG91bGQuZGVlcC5lcXVhbChtYXRjaGluZ0NhcHMpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgd2hlbiBhdXRvbWF0aW9uTmFtZSBpcyBvbWl0dGVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjYXBzID0ge1xuICAgICAgICAgIGFsd2F5c01hdGNoOiBfLm9taXQobWF0Y2hpbmdDYXBzLCBbJ2F1dG9tYXRpb25OYW1lJ10pLFxuICAgICAgICB9O1xuICAgICAgICBwcm9jZXNzQ2FwYWJpbGl0aWVzKGNhcHMsIGNvbnN0cmFpbnRzKS5zaG91bGQuZGVlcC5lcXVhbChfLm9taXQobWF0Y2hpbmdDYXBzLCAnYXV0b21hdGlvbk5hbWUnKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBwYXNzIGlmIGZpcnN0IGVsZW1lbnQgaW4gXCJmaXJzdE1hdGNoXCIgZG9lcyB2YWxpZGF0ZSBhbmQgc2Vjb25kIGVsZW1lbnQgZG9lcyBub3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhcHMgPSB7XG4gICAgICAgICAgYWx3YXlzTWF0Y2g6IHt9LFxuICAgICAgICAgIGZpcnN0TWF0Y2g6IFtcbiAgICAgICAgICAgIG1hdGNoaW5nQ2FwcyxcbiAgICAgICAgICAgIHtiYWRDYXBzOiAnYmFkQ2Fwcyd9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgICAgIHByb2Nlc3NDYXBhYmlsaXRpZXMoY2FwcywgY29uc3RyYWludHMpLnNob3VsZC5kZWVwLmVxdWFsKG1hdGNoaW5nQ2Fwcyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBwYXNzIGlmIGZpcnN0IGVsZW1lbnQgaW4gXCJmaXJzdE1hdGNoXCIgZG9lcyBub3QgdmFsaWRhdGUgYW5kIHNlY29uZCBlbGVtZW50IGRvZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhcHMgPSB7XG4gICAgICAgICAgYWx3YXlzTWF0Y2g6IHt9LFxuICAgICAgICAgIGZpcnN0TWF0Y2g6IFtcbiAgICAgICAgICAgIHtiYWRDYXBzOiAnYmFkQ2Fwcyd9LFxuICAgICAgICAgICAgbWF0Y2hpbmdDYXBzLFxuICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgICAgIHByb2Nlc3NDYXBhYmlsaXRpZXMoY2FwcywgY29uc3RyYWludHMpLnNob3VsZC5kZWVwLmVxdWFsKG1hdGNoaW5nQ2Fwcyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gYmFkIHBhcmFtZXRlcnMgYXJlIHBhc3NlZCBpbiBtb3JlIHRoYW4gb25lIGZpcnN0TWF0Y2ggY2FwYWJpbGl0eScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2FwcyA9IHtcbiAgICAgICAgICBhbHdheXNNYXRjaDoge30sXG4gICAgICAgICAgZmlyc3RNYXRjaDogW3tcbiAgICAgICAgICAgIGJhZDogJ3BhcmFtcycsXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgbW9yZTogJ2JhZC1wYXJhbXMnLFxuICAgICAgICAgIH1dLFxuICAgICAgICB9O1xuICAgICAgICAoKCkgPT4gcHJvY2Vzc0NhcGFiaWxpdGllcyhjYXBzLCBjb25zdHJhaW50cykpLnNob3VsZC50aHJvdygvQ291bGQgbm90IGZpbmQgbWF0Y2hpbmcgY2FwYWJpbGl0aWVzLyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCcuZmluZE5vblByZWZpeGVkQ2FwcycsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGZpbmQgYWx3YXlzTWF0Y2ggY2FwcyB3aXRoIG5vIHByZWZpeCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGZpbmROb25QcmVmaXhlZENhcHMoe2Fsd2F5c01hdGNoOiB7XG4gICAgICAgICdub24tc3RhbmRhcmQnOiAnZHVtbXknLFxuICAgICAgfX0pLnNob3VsZC5lcWwoWydub24tc3RhbmRhcmQnXSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBub3QgZmluZCBhIHN0YW5kYXJkIGNhcCBpbiBhbHdheXNNYXRjaCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGZpbmROb25QcmVmaXhlZENhcHMoe2Fsd2F5c01hdGNoOiB7XG4gICAgICAgICdwbGF0Zm9ybU5hbWUnOiAnQW55JyxcbiAgICAgIH19KS5zaG91bGQuZXFsKFtdKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGZpbmQgZmlyc3RNYXRjaCBjYXBzIHdpdGggbm8gcHJlZml4JywgZnVuY3Rpb24gKCkge1xuICAgICAgZmluZE5vblByZWZpeGVkQ2Fwcyh7YWx3YXlzTWF0Y2g6IHt9LCBmaXJzdE1hdGNoOiBbe1xuICAgICAgICAnbm9uLXN0YW5kYXJkJzogJ2R1bW15JyxcbiAgICAgIH1dfSkuc2hvdWxkLmVxbChbJ25vbi1zdGFuZGFyZCddKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG5vdCBmaW5kIGEgc3RhbmRhcmQgY2FwIGluIHByZWZpeCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGZpbmROb25QcmVmaXhlZENhcHMoe2Fsd2F5c01hdGNoOiB7fSwgZmlyc3RNYXRjaDogW3tcbiAgICAgICAgJ3BsYXRmb3JtTmFtZSc6ICdBbnknLFxuICAgICAgfV19KS5zaG91bGQuZXFsKFtdKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGZpbmQgZmlyc3RNYXRjaCBjYXBzIGluIHNlY29uZCBpdGVtIG9mIGZpcnN0TWF0Y2ggYXJyYXknLCBmdW5jdGlvbiAoKSB7XG4gICAgICBmaW5kTm9uUHJlZml4ZWRDYXBzKHthbHdheXNNYXRjaDoge30sIGZpcnN0TWF0Y2g6IFt7fSwge1xuICAgICAgICAnbm9uLXN0YW5kYXJkJzogJ2R1bW15JyxcbiAgICAgIH1dfSkuc2hvdWxkLmVxbChbJ25vbi1zdGFuZGFyZCddKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJlbW92ZSBkdXBsaWNhdGVzIGZyb20gYWx3YXlzTWF0Y2ggYW5kIGZpcnN0TWF0Y2gnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBmaW5kTm9uUHJlZml4ZWRDYXBzKHthbHdheXNNYXRjaDoge1xuICAgICAgICAnbm9uLXN0YW5kYXJkJzogJ3NvbWV0aGluZycsXG4gICAgICB9LCBmaXJzdE1hdGNoOiBbe1xuICAgICAgICAnbm9uLXN0YW5kYXJkJzogJ2R1bW15JyxcbiAgICAgIH1dfSkuc2hvdWxkLmVxbChbJ25vbi1zdGFuZGFyZCddKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJlbW92ZSBkdXBsaWNhdGVzIGZyb20gZmlyc3RNYXRjaCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGZpbmROb25QcmVmaXhlZENhcHMoe2ZpcnN0TWF0Y2g6IFt7XG4gICAgICAgICdub24tc3RhbmRhcmQnOiAnZHVtbXknLFxuICAgICAgfSwge1xuICAgICAgICAnbm9uLXN0YW5kYXJkJzogJ2R1bW15IDInLFxuICAgICAgfV19KS5zaG91bGQuZXFsKFsnbm9uLXN0YW5kYXJkJ10pO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcmVtb3ZlIGR1cGxpY2F0ZXMgYW5kIGtlZXAgc3RhbmRhcmQgY2FwYWJpbGl0aWVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgYWx3YXlzTWF0Y2ggPSB7XG4gICAgICAgIHBsYXRmb3JtTmFtZTogJ0Zha2UnLFxuICAgICAgICBub25TdGFuZGFyZE9uZTogJ25vbi1zdGFuZGFyZCcsXG4gICAgICAgIG5vblN0YW5kYXJkVHdvOiAnbm9uLXN0YW5kYXJkJyxcbiAgICAgIH07XG4gICAgICBjb25zdCBmaXJzdE1hdGNoID0gW1xuICAgICAgICB7bm9uU3RhbmRhcmRUaHJlZTogJ25vbi1zdGFuZGFyZCcsIG5vblN0YW5kYXJkRm91cjogJ25vbi1zdGFuZGFyZCcsIGJyb3dzZXJOYW1lOiAnRmFrZUJyb3dzZXInfSxcbiAgICAgICAge25vblN0YW5kYXJkVGhyZWU6ICdub24tc3RhbmRhcmQnLCBub25TdGFuZGFyZEZvdXI6ICdub24tc3RhbmRhcmQnLCBub25TdGFuZGFyZEZpdmU6ICdub24tc3RhbmRhcmQnLCBicm93c2VyVmVyc2lvbjogJ3doYXRldmEnfSxcbiAgICAgIF07XG4gICAgICBmaW5kTm9uUHJlZml4ZWRDYXBzKHthbHdheXNNYXRjaCwgZmlyc3RNYXRjaH0pLnNob3VsZC5lcWwoWydub25TdGFuZGFyZE9uZScsICdub25TdGFuZGFyZFR3bycsICdub25TdGFuZGFyZFRocmVlJywgJ25vblN0YW5kYXJkRm91cicsICdub25TdGFuZGFyZEZpdmUnXSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxJQUFBQSxhQUFBLEdBQUFDLE9BQUE7QUFDQSxJQUFBQyxLQUFBLEdBQUFDLHNCQUFBLENBQUFGLE9BQUE7QUFDQSxJQUFBRyxlQUFBLEdBQUFE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
