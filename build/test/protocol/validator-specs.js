"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
require("source-map-support/register");
var _validators = require("../../lib/protocol/validators");
var _chai = _interopRequireDefault(require("chai"));
_chai.default.should();
describe('Protocol', function () {
  describe('direct to driver', function () {
    describe('setUrl', function () {
      it('should fail when no url passed', function () {
        (() => {
          _validators.validators.setUrl();
        }).should.throw(/url/i);
      });
      it('should fail when given invalid url', function () {
        (() => {
          _validators.validators.setUrl('foo');
        }).should.throw(/url/i);
      });
      it('should succeed when given url starting with http', function () {
        (() => {
          _validators.validators.setUrl('http://armor.io');
        }).should.not.throw();
      });
      it('should succeed when given an android-like scheme', function () {
        (() => {
          _validators.validators.setUrl('content://contacts/people/1');
        }).should.not.throw();
      });
      it('should succeed with hyphens dots and plus chars in the scheme', function () {
        (() => {
          _validators.validators.setUrl('my-app.a+b://login');
        }).should.not.throw();
      });
      it('should succeed when given an about scheme', function () {
        (() => {
          _validators.validators.setUrl('about:blank');
        }).should.not.throw();
      });
      it('should succeed when given a data scheme', function () {
        (() => {
          _validators.validators.setUrl('data:text/html,<html></html>');
        }).should.not.throw();
      });
    });
    describe('implicitWait', function () {
      it('should fail when given no ms', function () {
        (() => {
          _validators.validators.implicitWait();
        }).should.throw(/ms/i);
      });
      it('should fail when given a non-numeric ms', function () {
        (() => {
          _validators.validators.implicitWait('five');
        }).should.throw(/ms/i);
      });
      it('should fail when given a negative ms', function () {
        (() => {
          _validators.validators.implicitWait(-1);
        }).should.throw(/ms/i);
      });
      it('should succeed when given an ms of 0', function () {
        (() => {
          _validators.validators.implicitWait(0);
        }).should.not.throw();
      });
      it('should succeed when given an ms greater than 0', function () {
        (() => {
          _validators.validators.implicitWait(100);
        }).should.not.throw();
      });
    });
    describe('asyncScriptTimeout', function () {
      it('should fail when given no ms', function () {
        (() => {
          _validators.validators.asyncScriptTimeout();
        }).should.throw(/ms/i);
      });
      it('should fail when given a non-numeric ms', function () {
        (() => {
          _validators.validators.asyncScriptTimeout('five');
        }).should.throw(/ms/i);
      });
      it('should fail when given a negative ms', function () {
        (() => {
          _validators.validators.asyncScriptTimeout(-1);
        }).should.throw(/ms/i);
      });
      it('should succeed when given an ms of 0', function () {
        (() => {
          _validators.validators.asyncScriptTimeout(0);
        }).should.not.throw();
      });
      it('should succeed when given an ms greater than 0', function () {
        (() => {
          _validators.validators.asyncScriptTimeout(100);
        }).should.not.throw();
      });
    });
    describe('clickCurrent', function () {
      it('should fail when given an invalid button', function () {
        (() => {
          _validators.validators.clickCurrent(4);
        }).should.throw(/0, 1, or 2/i);
      });
      it('should succeed when given a valid button', function () {
        (() => {
          _validators.validators.clickCurrent(0);
        }).should.not.throw();
        (() => {
          _validators.validators.clickCurrent(1);
        }).should.not.throw();
        (() => {
          _validators.validators.clickCurrent(2);
        }).should.not.throw();
      });
    });
    describe('setNetworkConnection', function () {
      it('should fail when given no type', function () {
        (() => {
          _validators.validators.setNetworkConnection();
        }).should.throw(/0, 1, 2, 4, 6/i);
      });
      it('should fail when given an invalid type', function () {
        (() => {
          _validators.validators.setNetworkConnection(8);
        }).should.throw(/0, 1, 2, 4, 6/i);
      });
      it('should succeed when given a valid type', function () {
        (() => {
          _validators.validators.setNetworkConnection(0);
        }).should.not.throw();
        (() => {
          _validators.validators.setNetworkConnection(1);
        }).should.not.throw();
        (() => {
          _validators.validators.setNetworkConnection(2);
        }).should.not.throw();
        (() => {
          _validators.validators.setNetworkConnection(4);
        }).should.not.throw();
        (() => {
          _validators.validators.setNetworkConnection(6);
        }).should.not.throw();
      });
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC9wcm90b2NvbC92YWxpZGF0b3Itc3BlY3MuanMiLCJuYW1lcyI6WyJfdmFsaWRhdG9ycyIsInJlcXVpcmUiLCJfY2hhaSIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJjaGFpIiwic2hvdWxkIiwiZGVzY3JpYmUiLCJpdCIsInZhbGlkYXRvcnMiLCJzZXRVcmwiLCJ0aHJvdyIsIm5vdCIsImltcGxpY2l0V2FpdCIsImFzeW5jU2NyaXB0VGltZW91dCIsImNsaWNrQ3VycmVudCIsInNldE5ldHdvcmtDb25uZWN0aW9uIl0sInNvdXJjZVJvb3QiOiIuLi8uLi8uLiIsInNvdXJjZXMiOlsidGVzdC9wcm90b2NvbC92YWxpZGF0b3Itc3BlY3MuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdHJhbnNwaWxlOm1vY2hhXG5cbmltcG9ydCB7IHZhbGlkYXRvcnMgfSBmcm9tICcuLi8uLi9saWIvcHJvdG9jb2wvdmFsaWRhdG9ycyc7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcblxuXG5jaGFpLnNob3VsZCgpO1xuXG5kZXNjcmliZSgnUHJvdG9jb2wnLCBmdW5jdGlvbiAoKSB7XG4gIGRlc2NyaWJlKCdkaXJlY3QgdG8gZHJpdmVyJywgZnVuY3Rpb24gKCkge1xuXG4gICAgZGVzY3JpYmUoJ3NldFVybCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIG5vIHVybCBwYXNzZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5zZXRVcmwoKTt9KS5zaG91bGQudGhyb3coL3VybC9pKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gZ2l2ZW4gaW52YWxpZCB1cmwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5zZXRVcmwoJ2ZvbycpO30pLnNob3VsZC50aHJvdygvdXJsL2kpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHN1Y2NlZWQgd2hlbiBnaXZlbiB1cmwgc3RhcnRpbmcgd2l0aCBodHRwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0VXJsKCdodHRwOi8vYXJtb3IuaW8nKTt9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgc3VjY2VlZCB3aGVuIGdpdmVuIGFuIGFuZHJvaWQtbGlrZSBzY2hlbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5zZXRVcmwoJ2NvbnRlbnQ6Ly9jb250YWN0cy9wZW9wbGUvMScpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdpdGggaHlwaGVucyBkb3RzIGFuZCBwbHVzIGNoYXJzIGluIHRoZSBzY2hlbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5zZXRVcmwoJ215LWFwcC5hK2I6Ly9sb2dpbicpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYW4gYWJvdXQgc2NoZW1lJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0VXJsKCdhYm91dDpibGFuaycpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYSBkYXRhIHNjaGVtZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLnNldFVybCgnZGF0YTp0ZXh0L2h0bWwsPGh0bWw+PC9odG1sPicpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdpbXBsaWNpdFdhaXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBnaXZlbiBubyBtcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLmltcGxpY2l0V2FpdCgpO30pLnNob3VsZC50aHJvdygvbXMvaSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIGdpdmVuIGEgbm9uLW51bWVyaWMgbXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5pbXBsaWNpdFdhaXQoJ2ZpdmUnKTt9KS5zaG91bGQudGhyb3coL21zL2kpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBnaXZlbiBhIG5lZ2F0aXZlIG1zJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuaW1wbGljaXRXYWl0KC0xKTt9KS5zaG91bGQudGhyb3coL21zL2kpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHN1Y2NlZWQgd2hlbiBnaXZlbiBhbiBtcyBvZiAwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuaW1wbGljaXRXYWl0KDApO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYW4gbXMgZ3JlYXRlciB0aGFuIDAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5pbXBsaWNpdFdhaXQoMTAwKTt9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnYXN5bmNTY3JpcHRUaW1lb3V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gZ2l2ZW4gbm8gbXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5hc3luY1NjcmlwdFRpbWVvdXQoKTt9KS5zaG91bGQudGhyb3coL21zL2kpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBnaXZlbiBhIG5vbi1udW1lcmljIG1zJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuYXN5bmNTY3JpcHRUaW1lb3V0KCdmaXZlJyk7fSkuc2hvdWxkLnRocm93KC9tcy9pKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBmYWlsIHdoZW4gZ2l2ZW4gYSBuZWdhdGl2ZSBtcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLmFzeW5jU2NyaXB0VGltZW91dCgtMSk7fSkuc2hvdWxkLnRocm93KC9tcy9pKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYW4gbXMgb2YgMCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLmFzeW5jU2NyaXB0VGltZW91dCgwKTt9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgc3VjY2VlZCB3aGVuIGdpdmVuIGFuIG1zIGdyZWF0ZXIgdGhhbiAwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuYXN5bmNTY3JpcHRUaW1lb3V0KDEwMCk7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2NsaWNrQ3VycmVudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIGdpdmVuIGFuIGludmFsaWQgYnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuY2xpY2tDdXJyZW50KDQpO30pLnNob3VsZC50aHJvdygvMCwgMSwgb3IgMi9pKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYSB2YWxpZCBidXR0b24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICgoKSA9PiB7dmFsaWRhdG9ycy5jbGlja0N1cnJlbnQoMCk7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuY2xpY2tDdXJyZW50KDEpO30pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLmNsaWNrQ3VycmVudCgyKTt9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnc2V0TmV0d29ya0Nvbm5lY3Rpb24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGZhaWwgd2hlbiBnaXZlbiBubyB0eXBlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oKTt9KS5zaG91bGQudGhyb3coLzAsIDEsIDIsIDQsIDYvaSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgZmFpbCB3aGVuIGdpdmVuIGFuIGludmFsaWQgdHlwZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKCgpID0+IHt2YWxpZGF0b3JzLnNldE5ldHdvcmtDb25uZWN0aW9uKDgpO30pLnNob3VsZC50aHJvdygvMCwgMSwgMiwgNCwgNi9pKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzdWNjZWVkIHdoZW4gZ2l2ZW4gYSB2YWxpZCB0eXBlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oMCk7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oMSk7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oMik7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oNCk7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICAoKCkgPT4ge3ZhbGlkYXRvcnMuc2V0TmV0d29ya0Nvbm5lY3Rpb24oNik7fSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwibWFwcGluZ3MiOiI7Ozs7QUFFQSxJQUFBQSxXQUFBLEdBQUFDLE9BQUE7QUFDQSxJQUFBQyxLQUFBLEdBQUFDLHNCQUFBLENBQUFGLE9BQUE7QUFHQUcsYUFBSSxDQUFDQyxNQUFNLENBQUMsQ0FBQztBQUViQyxRQUFRLENBQUMsVUFBVSxFQUFFLFlBQVk7RUFDL0JBLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxZQUFZO0lBRXZDQSxRQUFRLENBQUMsUUFBUSxFQUFFLFlBQVk7TUFDN0JDLEVBQUUsQ0FBQyxnQ0FBZ0MsRUFBRSxZQUFZO1FBQy9DLENBQUMsTUFBTTtVQUFDQyxzQkFBVSxDQUFDQyxNQUFNLENBQUMsQ0FBQztRQUFDLENBQUMsRUFBRUosTUFBTSxDQUFDSyxLQUFLLENBQUMsTUFBTSxDQUFDO01BQ3JELENBQUMsQ0FBQztNQUNGSCxFQUFFLENBQUMsb0NBQW9DLEVBQUUsWUFBWTtRQUNuRCxDQUFDLE1BQU07VUFBQ0Msc0JBQVUsQ0FBQ0MsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUFDLENBQUMsRUFBRUosTUFBTSxDQUFDSyxLQUFLLENBQUMsTUFBTSxDQUFDO01BQzFELENBQUMsQ0FBQztNQUNGSCxFQUFFLENBQUMsa0RBQWtELEVBQUUsWUFBWTtRQUNqRSxDQUFDLE1BQU07VUFBQ0Msc0JBQVUsQ0FBQ0MsTUFBTSxDQUFDLGlCQUFpQixDQUFDO1FBQUMsQ0FBQyxFQUFFSixNQUFNLENBQUNNLEdBQUcsQ0FBQ0QsS0FBSyxDQUFDLENBQUM7TUFDcEUsQ0FBQyxDQUFDO01BQ0ZILEVBQUUsQ0FBQyxrREFBa0QsRUFBRSxZQUFZO1FBQ2pFLENBQUMsTUFBTTtVQUFDQyxzQkFBVSxDQUFDQyxNQUFNLENBQUMsNkJBQTZCLENBQUM7UUFBQyxDQUFDLEVBQUVKLE1BQU0sQ0FBQ00sR0FBRyxDQUFDRCxLQUFLLENBQUMsQ0FBQztNQUNoRixDQUFDLENBQUM7TUFDRkgsRUFBRSxDQUFDLCtEQUErRCxFQUFFLFlBQVk7UUFDOUUsQ0FBQyxNQUFNO1VBQUNDLHNCQUFVLENBQUNDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQztRQUFDLENBQUMsRUFBRUosTUFBTSxDQUFDTSxHQUFHLENBQUNELEtBQUssQ0FBQyxDQUFDO01BQ3ZFLENBQUMsQ0FBQztNQUNGSCxFQUFFLENBQUMsMkNBQTJDLEVBQUUsWUFBWTtRQUMxRCxDQUFDLE1BQU07VUFBQ0Msc0JBQVUsQ0FBQ0MsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUFDLENBQUMsRUFBRUosTUFBTSxDQUFDTSxHQUFHLENBQUNELEtBQUssQ0FBQyxDQUFDO01BQ2hFLENBQUMsQ0FBQztNQUNGSCxFQUFFLENBQUMseUNBQXlDLEVBQUUsWUFBWTtRQUN4RCxDQUFDLE1BQU07VUFBQ0Msc0JBQVUsQ0FBQ0MsTUFBTSxDQUFDLDhCQUE4QixDQUFDO1FBQUMsQ0FBQyxFQUFFSixNQUFNLENBQUNNLEdBQUcsQ0FBQ0QsS0FBSyxDQUFDLENBQUM7TUFDakYsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0lBQ0ZKLFFBQVEsQ0FBQyxjQUFjLEVBQUUsWUFBWTtNQUNuQ0MsRUFBRSxDQUFDLDhCQUE4QixFQUFFLFlBQVk7UUFDN0MsQ0FBQyxNQUFNO1VBQUNDLHNCQUFVLENBQUNJLFlBQVksQ0FBQyxDQUFDO1FBQUMsQ0FBQyxFQUFFUCxNQUFNLENBQUNLLEtBQUssQ0FBQyxLQUFLLENBQUM7TUFDMUQsQ0FBQyxDQUFDO01BQ0ZILEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRSxZQUFZO1FBQ3hELENBQUMsTUFBTTtVQUFDQyxzQkFBVSxDQUFDSSxZQUFZLENBQUMsTUFBTSxDQUFDO1FBQUMsQ0FBQyxFQUFFUCxNQUFNLENBQUNLLEtBQUssQ0FBQyxLQUFLLENBQUM7TUFDaEUsQ0FBQyxDQUFDO01BQ0ZILEVBQUUsQ0FBQyxzQ0FBc0MsRUFBRSxZQUFZO1FBQ3JELENBQUMsTUFBTTtVQUFDQyxzQkFBVSxDQUFDSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDLEVBQUVQLE1BQU0sQ0FBQ0ssS0FBSyxDQUFDLEtBQUssQ0FBQztNQUM1RCxDQUFDLENBQUM7TUFDRkgsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLFlBQVk7UUFDckQsQ0FBQyxNQUFNO1VBQUNDLHNCQUFVLENBQUNJLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDLEVBQUVQLE1BQU0sQ0FBQ00sR0FBRyxDQUFDRCxLQUFLLENBQUMsQ0FBQztNQUMxRCxDQUFDLENBQUM7TUFDRkgsRUFBRSxDQUFDLGdEQUFnRCxFQUFFLFlBQVk7UUFDL0QsQ0FBQyxNQUFNO1VBQUNDLHNCQUFVLENBQUNJLFlBQVksQ0FBQyxHQUFHLENBQUM7UUFBQyxDQUFDLEVBQUVQLE1BQU0sQ0FBQ00sR0FBRyxDQUFDRCxLQUFLLENBQUMsQ0FBQztNQUM1RCxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7SUFDRkosUUFBUSxDQUFDLG9CQUFvQixFQUFFLFlBQVk7TUFDekNDLEVBQUUsQ0FBQyw4QkFBOEIsRUFBRSxZQUFZO1FBQzdDLENBQUMsTUFBTTtVQUFDQyxzQkFBVSxDQUFDSyxrQkFBa0IsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxFQUFFUixNQUFNLENBQUNLLEtBQUssQ0FBQyxLQUFLLENBQUM7TUFDaEUsQ0FBQyxDQUFDO01BQ0ZILEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRSxZQUFZO1FBQ3hELENBQUMsTUFBTTtVQUFDQyxzQkFBVSxDQUFDSyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7UUFBQyxDQUFDLEVBQUVSLE1BQU0sQ0FBQ0ssS0FBSyxDQUFDLEtBQUssQ0FBQztNQUN0RSxDQUFDLENBQUM7TUFDRkgsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLFlBQVk7UUFDckQsQ0FBQyxNQUFNO1VBQUNDLHNCQUFVLENBQUNLLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxFQUFFUixNQUFNLENBQUNLLEtBQUssQ0FBQyxLQUFLLENBQUM7TUFDbEUsQ0FBQyxDQUFDO01BQ0ZILEVBQUUsQ0FBQyxzQ0FBc0MsRUFBRSxZQUFZO1FBQ3JELENBQUMsTUFBTTtVQUFDQyxzQkFBVSxDQUFDSyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDLEVBQUVSLE1BQU0sQ0FBQ00sR0FBRyxDQUFDRCxLQUFLLENBQUMsQ0FBQztNQUNoRSxDQUFDLENBQUM7TUFDRkgsRUFBRSxDQUFDLGdEQUFnRCxFQUFFLFlBQVk7UUFDL0QsQ0FBQyxNQUFNO1VBQUNDLHNCQUFVLENBQUNLLGtCQUFrQixDQUFDLEdBQUcsQ0FBQztRQUFDLENBQUMsRUFBRVIsTUFBTSxDQUFDTSxHQUFHLENBQUNELEtBQUssQ0FBQyxDQUFDO01BQ2xFLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztJQUNGSixRQUFRLENBQUMsY0FBYyxFQUFFLFlBQVk7TUFDbkNDLEVBQUUsQ0FBQywwQ0FBMEMsRUFBRSxZQUFZO1FBQ3pELENBQUMsTUFBTTtVQUFDQyxzQkFBVSxDQUFDTSxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxFQUFFVCxNQUFNLENBQUNLLEtBQUssQ0FBQyxhQUFhLENBQUM7TUFDbkUsQ0FBQyxDQUFDO01BQ0ZILEVBQUUsQ0FBQywwQ0FBMEMsRUFBRSxZQUFZO1FBQ3pELENBQUMsTUFBTTtVQUFDQyxzQkFBVSxDQUFDTSxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxFQUFFVCxNQUFNLENBQUNNLEdBQUcsQ0FBQ0QsS0FBSyxDQUFDLENBQUM7UUFDeEQsQ0FBQyxNQUFNO1VBQUNGLHNCQUFVLENBQUNNLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDLEVBQUVULE1BQU0sQ0FBQ00sR0FBRyxDQUFDRCxLQUFLLENBQUMsQ0FBQztRQUN4RCxDQUFDLE1BQU07VUFBQ0Ysc0JBQVUsQ0FBQ00sWUFBWSxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUMsRUFBRVQsTUFBTSxDQUFDTSxHQUFHLENBQUNELEtBQUssQ0FBQyxDQUFDO01BQzFELENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztJQUNGSixRQUFRLENBQUMsc0JBQXNCLEVBQUUsWUFBWTtNQUMzQ0MsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLFlBQVk7UUFDL0MsQ0FBQyxNQUFNO1VBQUNDLHNCQUFVLENBQUNPLG9CQUFvQixDQUFDLENBQUM7UUFBQyxDQUFDLEVBQUVWLE1BQU0sQ0FBQ0ssS0FBSyxDQUFDLGdCQUFnQixDQUFDO01BQzdFLENBQUMsQ0FBQztNQUNGSCxFQUFFLENBQUMsd0NBQXdDLEVBQUUsWUFBWTtRQUN2RCxDQUFDLE1BQU07VUFBQ0Msc0JBQVUsQ0FBQ08sb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxFQUFFVixNQUFNLENBQUNLLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztNQUM5RSxDQUFDLENBQUM7TUFDRkgsRUFBRSxDQUFDLHdDQUF3QyxFQUFFLFlBQVk7UUFDdkQsQ0FBQyxNQUFNO1VBQUNDLHNCQUFVLENBQUNPLG9CQUFvQixDQUFDLENBQUMsQ0FBQztRQUFDLENBQUMsRUFBRVYsTUFBTSxDQUFDTSxHQUFHLENBQUNELEtBQUssQ0FBQyxDQUFDO1FBQ2hFLENBQUMsTUFBTTtVQUFDRixzQkFBVSxDQUFDTyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDLEVBQUVWLE1BQU0sQ0FBQ00sR0FBRyxDQUFDRCxLQUFLLENBQUMsQ0FBQztRQUNoRSxDQUFDLE1BQU07VUFBQ0Ysc0JBQVUsQ0FBQ08sb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxFQUFFVixNQUFNLENBQUNNLEdBQUcsQ0FBQ0QsS0FBSyxDQUFDLENBQUM7UUFDaEUsQ0FBQyxNQUFNO1VBQUNGLHNCQUFVLENBQUNPLG9CQUFvQixDQUFDLENBQUMsQ0FBQztRQUFDLENBQUMsRUFBRVYsTUFBTSxDQUFDTSxHQUFHLENBQUNELEtBQUssQ0FBQyxDQUFDO1FBQ2hFLENBQUMsTUFBTTtVQUFDRixzQkFBVSxDQUFDTyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDLEVBQUVWLE1BQU0sQ0FBQ00sR0FBRyxDQUFDRCxLQUFLLENBQUMsQ0FBQztNQUNsRSxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSixDQUFDLENBQUM7QUFDSixDQUFDLENBQUMifQ==
