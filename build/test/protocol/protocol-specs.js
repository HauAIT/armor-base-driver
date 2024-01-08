"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
require("source-map-support/register");
require("../..");
var _chai = _interopRequireDefault(require("chai"));
var _sinon = _interopRequireDefault(require("sinon"));
var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));
var _protocol = require("../../lib/protocol/protocol");
var _constants = require("../../lib/constants");
var _driver = _interopRequireDefault(require("../../lib/basedriver/driver"));
_chai.default.should();
_chai.default.use(_chaiAsPromised.default);
describe('Protocol', function () {
  describe('#driverShouldDoJwpProxy', function () {
    it('should not proxy if an image element is found in request url', function () {
      const d = new _driver.default();
      _sinon.default.stub(d, 'proxyActive').returns(true);
      _sinon.default.stub(d, 'proxyRouteIsAvoided').returns(false);
      const hasImageElements = [`/wd/hub/session/:sessionId/element/${_constants.IMAGE_ELEMENT_PREFIX}bar`, `/wd/hub/session/:sessionId/element/${_constants.IMAGE_ELEMENT_PREFIX}bar/click`, `/wd/hub/session/:sessionId/element/${_constants.IMAGE_ELEMENT_PREFIX}bar/submit`, `/wd/hub/session/:sessionId/screenshot/${_constants.IMAGE_ELEMENT_PREFIX}bar`];
      const noImageElements = [`/wd/hub/session/:sessionId/element/${_constants.IMAGE_ELEMENT_PREFIX}`, `/wd/hub/session/:sessionId/screenshot/${_constants.IMAGE_ELEMENT_PREFIX}`, `/wd/hub/session/:sessionId/element/bar${_constants.IMAGE_ELEMENT_PREFIX}`, '/wd/hub/session/:sessionId/element/element123', '/wd/hub/session/:sessionId/title', `/wd/hub/session/:sessionId/notelement/${_constants.IMAGE_ELEMENT_PREFIX}bar`];
      for (let testCase of hasImageElements) {
        const req = {
          body: {},
          params: {},
          originalUrl: testCase
        };
        (0, _protocol.driverShouldDoJwpProxy)(d, req, null).should.be.false;
      }
      for (let testCase of noImageElements) {
        const req = {
          body: {},
          params: {},
          originalUrl: testCase
        };
        (0, _protocol.driverShouldDoJwpProxy)(d, req, null).should.be.true;
      }
    });
    it('should not proxy if an image element is found in request body', function () {
      const d = new _driver.default();
      _sinon.default.stub(d, 'proxyActive').returns(true);
      _sinon.default.stub(d, 'proxyRouteIsAvoided').returns(false);
      const hasImageElements = [{
        [_constants.W3C_ELEMENT_KEY]: `${_constants.IMAGE_ELEMENT_PREFIX}bar`
      }, {
        [_constants.W3C_ELEMENT_KEY]: `${_constants.IMAGE_ELEMENT_PREFIX}foo`
      }, {
        [_constants.MJSONWP_ELEMENT_KEY]: `${_constants.IMAGE_ELEMENT_PREFIX}bar`
      }];
      const noImageElements = [{
        [_constants.IMAGE_ELEMENT_PREFIX]: 'foo'
      }, {
        [_constants.W3C_ELEMENT_KEY]: `${_constants.IMAGE_ELEMENT_PREFIX}`
      }, {
        [_constants.MJSONWP_ELEMENT_KEY]: `${_constants.IMAGE_ELEMENT_PREFIX}`
      }, {
        foo: 'bar'
      }, {
        [_constants.W3C_ELEMENT_KEY]: 'bar'
      }, {
        [_constants.MJSONWP_ELEMENT_KEY]: 'bar'
      }, {
        foo: `${_constants.IMAGE_ELEMENT_PREFIX}bar`
      }, {
        foo: `bar${_constants.IMAGE_ELEMENT_PREFIX}`
      }, {
        [_constants.W3C_ELEMENT_KEY]: `bar${_constants.IMAGE_ELEMENT_PREFIX}`
      }, {
        [_constants.MJSONWP_ELEMENT_KEY]: `bar${_constants.IMAGE_ELEMENT_PREFIX}`
      }];
      for (let testCase of hasImageElements) {
        const req = {
          body: testCase,
          params: {}
        };
        (0, _protocol.driverShouldDoJwpProxy)(d, req, null).should.be.false;
      }
      for (let testCase of noImageElements) {
        const req = {
          body: testCase,
          params: {}
        };
        (0, _protocol.driverShouldDoJwpProxy)(d, req, null).should.be.true;
      }
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC9wcm90b2NvbC9wcm90b2NvbC1zcGVjcy5qcyIsIm5hbWVzIjpbInJlcXVpcmUiLCJfY2hhaSIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJfc2lub24iLCJfY2hhaUFzUHJvbWlzZWQiLCJfcHJvdG9jb2wiLCJfY29uc3RhbnRzIiwiX2RyaXZlciIsImNoYWkiLCJzaG91bGQiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsImRlc2NyaWJlIiwiaXQiLCJkIiwiQmFzZURyaXZlciIsInNpbm9uIiwic3R1YiIsInJldHVybnMiLCJoYXNJbWFnZUVsZW1lbnRzIiwiSU1BR0VfRUxFTUVOVF9QUkVGSVgiLCJub0ltYWdlRWxlbWVudHMiLCJ0ZXN0Q2FzZSIsInJlcSIsImJvZHkiLCJwYXJhbXMiLCJvcmlnaW5hbFVybCIsImRyaXZlclNob3VsZERvSndwUHJveHkiLCJiZSIsImZhbHNlIiwidHJ1ZSIsIlczQ19FTEVNRU5UX0tFWSIsIk1KU09OV1BfRUxFTUVOVF9LRVkiLCJmb28iXSwic291cmNlUm9vdCI6Ii4uLy4uLy4uIiwic291cmNlcyI6WyJ0ZXN0L3Byb3RvY29sL3Byb3RvY29sLXNwZWNzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHRyYW5zcGlsZTptb2NoYVxuXG5pbXBvcnQgJy4uLy4uJzsgLy8gTk9URTogRm9yIHNvbWUgcmVhc29uIHRoaXMgZmlsZSBuZWVkcyB0byBiZSBpbXBvcnRlZCB0byBwcmV2ZW50IGEgYmFiZWwgZXJyb3JcbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IHNpbm9uIGZyb20gJ3Npbm9uJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IGRyaXZlclNob3VsZERvSndwUHJveHkgfSBmcm9tICcuLi8uLi9saWIvcHJvdG9jb2wvcHJvdG9jb2wnO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG5pbXBvcnQgeyBNSlNPTldQX0VMRU1FTlRfS0VZLCBXM0NfRUxFTUVOVF9LRVksIElNQUdFX0VMRU1FTlRfUFJFRklYIH0gZnJvbSAnLi4vLi4vbGliL2NvbnN0YW50cyc7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbmltcG9ydCBCYXNlRHJpdmVyIGZyb20gJy4uLy4uL2xpYi9iYXNlZHJpdmVyL2RyaXZlcic7XG5cbmNoYWkuc2hvdWxkKCk7XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cbmRlc2NyaWJlKCdQcm90b2NvbCcsIGZ1bmN0aW9uICgpIHtcblxuICBkZXNjcmliZSgnI2RyaXZlclNob3VsZERvSndwUHJveHknLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBub3QgcHJveHkgaWYgYW4gaW1hZ2UgZWxlbWVudCBpcyBmb3VuZCBpbiByZXF1ZXN0IHVybCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGQgPSBuZXcgQmFzZURyaXZlcigpO1xuICAgICAgc2lub24uc3R1YihkLCAncHJveHlBY3RpdmUnKS5yZXR1cm5zKHRydWUpO1xuICAgICAgc2lub24uc3R1YihkLCAncHJveHlSb3V0ZUlzQXZvaWRlZCcpLnJldHVybnMoZmFsc2UpO1xuICAgICAgY29uc3QgaGFzSW1hZ2VFbGVtZW50cyA9IFtcbiAgICAgICAgYC93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvJHtJTUFHRV9FTEVNRU5UX1BSRUZJWH1iYXJgLFxuICAgICAgICBgL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZWxlbWVudC8ke0lNQUdFX0VMRU1FTlRfUFJFRklYfWJhci9jbGlja2AsXG4gICAgICAgIGAvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50LyR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YmFyL3N1Ym1pdGAsXG4gICAgICAgIGAvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9zY3JlZW5zaG90LyR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YmFyYCxcbiAgICAgIF07XG4gICAgICBjb25zdCBub0ltYWdlRWxlbWVudHMgPSBbXG4gICAgICAgIGAvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50LyR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YCxcbiAgICAgICAgYC93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3NjcmVlbnNob3QvJHtJTUFHRV9FTEVNRU5UX1BSRUZJWH1gLFxuICAgICAgICBgL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZWxlbWVudC9iYXIke0lNQUdFX0VMRU1FTlRfUFJFRklYfWAsXG4gICAgICAgICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50L2VsZW1lbnQxMjMnLFxuICAgICAgICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvdGl0bGUnLFxuICAgICAgICBgL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvbm90ZWxlbWVudC8ke0lNQUdFX0VMRU1FTlRfUFJFRklYfWJhcmAsXG4gICAgICBdO1xuICAgICAgZm9yIChsZXQgdGVzdENhc2Ugb2YgaGFzSW1hZ2VFbGVtZW50cykge1xuICAgICAgICBjb25zdCByZXEgPSB7Ym9keToge30sIHBhcmFtczoge30sIG9yaWdpbmFsVXJsOiB0ZXN0Q2FzZX07XG4gICAgICAgIGRyaXZlclNob3VsZERvSndwUHJveHkoZCwgcmVxLCBudWxsKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCB0ZXN0Q2FzZSBvZiBub0ltYWdlRWxlbWVudHMpIHtcbiAgICAgICAgY29uc3QgcmVxID0ge2JvZHk6IHt9LCBwYXJhbXM6IHt9LCBvcmlnaW5hbFVybDogdGVzdENhc2V9O1xuICAgICAgICBkcml2ZXJTaG91bGREb0p3cFByb3h5KGQsIHJlcSwgbnVsbCkuc2hvdWxkLmJlLnRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBub3QgcHJveHkgaWYgYW4gaW1hZ2UgZWxlbWVudCBpcyBmb3VuZCBpbiByZXF1ZXN0IGJvZHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBkID0gbmV3IEJhc2VEcml2ZXIoKTtcbiAgICAgIHNpbm9uLnN0dWIoZCwgJ3Byb3h5QWN0aXZlJykucmV0dXJucyh0cnVlKTtcbiAgICAgIHNpbm9uLnN0dWIoZCwgJ3Byb3h5Um91dGVJc0F2b2lkZWQnKS5yZXR1cm5zKGZhbHNlKTtcbiAgICAgIGNvbnN0IGhhc0ltYWdlRWxlbWVudHMgPSBbe1xuICAgICAgICBbVzNDX0VMRU1FTlRfS0VZXTogYCR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YmFyYCxcbiAgICAgIH0sIHtcbiAgICAgICAgW1czQ19FTEVNRU5UX0tFWV06IGAke0lNQUdFX0VMRU1FTlRfUFJFRklYfWZvb2AsXG4gICAgICB9LCB7XG4gICAgICAgIFtNSlNPTldQX0VMRU1FTlRfS0VZXTogYCR7SU1BR0VfRUxFTUVOVF9QUkVGSVh9YmFyYCxcbiAgICAgIH1dO1xuICAgICAgY29uc3Qgbm9JbWFnZUVsZW1lbnRzID0gW3tcbiAgICAgICAgW0lNQUdFX0VMRU1FTlRfUFJFRklYXTogJ2ZvbycsXG4gICAgICB9LCB7XG4gICAgICAgIFtXM0NfRUxFTUVOVF9LRVldOiBgJHtJTUFHRV9FTEVNRU5UX1BSRUZJWH1gLFxuICAgICAgfSwge1xuICAgICAgICBbTUpTT05XUF9FTEVNRU5UX0tFWV06IGAke0lNQUdFX0VMRU1FTlRfUFJFRklYfWAsXG4gICAgICB9LCB7XG4gICAgICAgIGZvbzogJ2JhcicsXG4gICAgICB9LCB7XG4gICAgICAgIFtXM0NfRUxFTUVOVF9LRVldOiAnYmFyJyxcbiAgICAgIH0sIHtcbiAgICAgICAgW01KU09OV1BfRUxFTUVOVF9LRVldOiAnYmFyJyxcbiAgICAgIH0sIHtcbiAgICAgICAgZm9vOiBgJHtJTUFHRV9FTEVNRU5UX1BSRUZJWH1iYXJgLFxuICAgICAgfSwge1xuICAgICAgICBmb286IGBiYXIke0lNQUdFX0VMRU1FTlRfUFJFRklYfWBcbiAgICAgIH0sIHtcbiAgICAgICAgW1czQ19FTEVNRU5UX0tFWV06IGBiYXIke0lNQUdFX0VMRU1FTlRfUFJFRklYfWBcbiAgICAgIH0sIHtcbiAgICAgICAgW01KU09OV1BfRUxFTUVOVF9LRVldOiBgYmFyJHtJTUFHRV9FTEVNRU5UX1BSRUZJWH1gXG4gICAgICB9XTtcbiAgICAgIGZvciAobGV0IHRlc3RDYXNlIG9mIGhhc0ltYWdlRWxlbWVudHMpIHtcbiAgICAgICAgY29uc3QgcmVxID0ge2JvZHk6IHRlc3RDYXNlLCBwYXJhbXM6IHt9fTtcbiAgICAgICAgZHJpdmVyU2hvdWxkRG9Kd3BQcm94eShkLCByZXEsIG51bGwpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IHRlc3RDYXNlIG9mIG5vSW1hZ2VFbGVtZW50cykge1xuICAgICAgICBjb25zdCByZXEgPSB7Ym9keTogdGVzdENhc2UsIHBhcmFtczoge319O1xuICAgICAgICBkcml2ZXJTaG91bGREb0p3cFByb3h5KGQsIHJlcSwgbnVsbCkuc2hvdWxkLmJlLnRydWU7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7OztBQUVBQSxPQUFBO0FBQ0EsSUFBQUMsS0FBQSxHQUFBQyxzQkFBQSxDQUFBRixPQUFBO0FBQ0EsSUFBQUcsTUFBQSxHQUFBRCxzQkFBQSxDQUFBRixPQUFBO0FBQ0EsSUFBQUksZUFBQSxHQUFBRixzQkFBQSxDQUFBRixPQUFBO0FBQ0EsSUFBQUssU0FBQSxHQUFBTCxPQUFBO0FBRUEsSUFBQU0sVUFBQSxHQUFBTixPQUFBO0FBRUEsSUFBQU8sT0FBQSxHQUFBTCxzQkFBQSxDQUFBRixPQUFBO0FBRUFRLGFBQUksQ0FBQ0MsTUFBTSxDQUFDLENBQUM7QUFDYkQsYUFBSSxDQUFDRSxHQUFHLENBQUNDLHVCQUFjLENBQUM7QUFFeEJDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsWUFBWTtFQUUvQkEsUUFBUSxDQUFDLHlCQUF5QixFQUFFLFlBQVk7SUFDOUNDLEVBQUUsQ0FBQyw4REFBOEQsRUFBRSxZQUFZO01BQzdFLE1BQU1DLENBQUMsR0FBRyxJQUFJQyxl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
