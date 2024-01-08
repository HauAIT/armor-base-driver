"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
require("source-map-support/register");
var _chai = _interopRequireDefault(require("chai"));
var _path = _interopRequireDefault(require("path"));
var _url = _interopRequireDefault(require("url"));
var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));
var _armorSupport = require("armor-support");
var _helpers = require("../../lib/basedriver/helpers");
var _http = _interopRequireDefault(require("http"));
var _finalhandler = _interopRequireDefault(require("finalhandler"));
var _serveStatic = _interopRequireDefault(require("serve-static"));
var _contentDisposition = _interopRequireDefault(require("content-disposition"));
var _bluebird = _interopRequireDefault(require("bluebird"));
_chai.default.should();
_chai.default.use(_chaiAsPromised.default);
function getFixture(file) {
  return _path.default.resolve(__dirname, '..', '..', '..', 'test', 'basedriver', 'fixtures', file);
}
describe('app download and configuration', function () {
  describe('configureApp', function () {
    it('should get the path for a local .app', async function () {
      let newAppPath = await (0, _helpers.configureApp)(getFixture('FakeIOSApp.app'), '.app');
      newAppPath.should.contain('FakeIOSApp.app');
      let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
      contents.should.eql('this is not really an app\n');
    });
    it('should get the path for a local .apk', async function () {
      let newAppPath = await (0, _helpers.configureApp)(getFixture('FakeAndroidApp.apk'), '.apk');
      newAppPath.should.contain('FakeAndroidApp.apk');
      let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
      contents.should.eql('this is not really an apk\n');
    });
    it('should unzip and get the path for a local .app.zip', async function () {
      let newAppPath = await (0, _helpers.configureApp)(getFixture('FakeIOSApp.app.zip'), '.app');
      newAppPath.should.contain('FakeIOSApp.app');
      let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
      contents.should.eql('this is not really an app\n');
    });
    it('should unzip and get the path for a local .ipa', async function () {
      let newAppPath = await (0, _helpers.configureApp)(getFixture('FakeIOSApp.ipa'), '.app');
      newAppPath.should.contain('FakeIOSApp.app');
      let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
      contents.should.eql('this is not really an app\n');
    });
    it('should fail for a bad zip file', async function () {
      await (0, _helpers.configureApp)(getFixture('BadZippedApp.zip'), '.app').should.be.rejectedWith(/PK/);
    });
    it('should fail if extensions do not match', async function () {
      await (0, _helpers.configureApp)(getFixture('FakeIOSApp.app'), '.wrong').should.be.rejectedWith(/did not have extension/);
    });
    it('should fail if zip file does not contain an app whose extension matches', async function () {
      await (0, _helpers.configureApp)(getFixture('FakeIOSApp.app.zip'), '.wrong').should.be.rejectedWith(/did not have extension/);
    });
    describe('should download an app from the web', function () {
      const port = 8000;
      const serverUrl = `http://localhost:${port}`;
      describe('server not available', function () {
        it('should handle server not available', async function () {
          await (0, _helpers.configureApp)(`${serverUrl}/FakeIOSApp.app.zip`, '.app').should.eventually.be.rejectedWith(/ECONNREFUSED/);
        });
      });
      describe('server available', function () {
        let server;
        before(function () {
          const dir = _path.default.resolve(__dirname, '..', '..', '..', 'test', 'basedriver', 'fixtures');
          const serve = (0, _serveStatic.default)(dir, {
            index: false,
            setHeaders: (res, path) => {
              res.setHeader('Content-Disposition', (0, _contentDisposition.default)(path));
            }
          });
          server = _http.default.createServer(function (req, res) {
            if (req.url.indexOf('missing') !== -1) {
              res.writeHead(404);
              res.end();
              return;
            }
            const contentType = new URLSearchParams(_url.default.parse(req.url).search).get('content-type');
            if (contentType !== null) {
              res.setHeader('content-type', contentType);
            }
            serve(req, res, (0, _finalhandler.default)(req, res));
          });
          const close = server.close.bind(server);
          server.close = async function () {
            await _bluebird.default.delay(1000);
            return await new _bluebird.default((resolve, reject) => {
              server.on('close', resolve);
              close(err => {
                if (err) reject(err);
              });
            });
          };
          server.listen(port);
        });
        after(async function () {
          await server.close();
        });
        it('should download zip file', async function () {
          let newAppPath = await (0, _helpers.configureApp)(`${serverUrl}/FakeIOSApp.app.zip`, '.app');
          newAppPath.should.contain('FakeIOSApp.app');
          let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
          contents.should.eql('this is not really an app\n');
        });
        it('should download zip file with query string', async function () {
          let newAppPath = await (0, _helpers.configureApp)(`${serverUrl}/FakeIOSApp.app.zip?sv=abc&sr=def`, '.app');
          newAppPath.should.contain('.app');
          let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
          contents.should.eql('this is not really an app\n');
        });
        it('should download an app file', async function () {
          let newAppPath = await (0, _helpers.configureApp)(`${serverUrl}/FakeIOSApp.app`, '.app');
          newAppPath.should.contain('.app');
          let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
          contents.should.eql('this is not really an app\n');
        });
        it('should accept multiple extensions', async function () {
          let newAppPath = await (0, _helpers.configureApp)(`${serverUrl}/FakeIOSApp.app.zip`, ['.app', '.aab']);
          newAppPath.should.contain('FakeIOSApp.app');
          let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
          contents.should.eql('this is not really an app\n');
        });
        it('should download an apk file', async function () {
          let newAppPath = await (0, _helpers.configureApp)(`${serverUrl}/FakeAndroidApp.apk`, '.apk');
          newAppPath.should.contain('.apk');
          let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
          contents.should.eql('this is not really an apk\n');
        });
        it('should handle zip file that cannot be downloaded', async function () {
          await (0, _helpers.configureApp)(`${serverUrl}/missing/FakeIOSApp.app.zip`, '.app').should.eventually.be.rejected;
        });
        it('should handle invalid protocol', async function () {
          await (0, _helpers.configureApp)('file://C:/missing/FakeIOSApp.app.zip', '.app').should.eventually.be.rejectedWith(/is not supported/);
          await (0, _helpers.configureApp)('ftp://localhost:8000/missing/FakeIOSApp.app.zip', '.app').should.eventually.be.rejectedWith(/is not supported/);
        });
        it('should handle missing file in Windows path format', async function () {
          await (0, _helpers.configureApp)('C:\\missing\\FakeIOSApp.app.zip', '.app').should.eventually.be.rejectedWith(/does not exist or is not accessible/);
        });
        it('should recognize zip mime types and unzip the downloaded file', async function () {
          let newAppPath = await (0, _helpers.configureApp)(`${serverUrl}/FakeAndroidApp.asd?content-type=${encodeURIComponent('application/zip')}`, '.apk');
          newAppPath.should.contain('FakeAndroidApp.apk');
          newAppPath.should.not.contain('.asd');
          let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
          contents.should.eql('this is not really an apk\n');
        });
        it('should recognize zip mime types with parameter and unzip the downloaded file', async function () {
          let newAppPath = await (0, _helpers.configureApp)(`${serverUrl}/FakeAndroidApp.asd?content-type=${encodeURIComponent('application/zip; parameter=value')}`, '.apk');
          newAppPath.should.contain('FakeAndroidApp.apk');
          newAppPath.should.not.contain('.asd');
          let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
          contents.should.eql('this is not really an apk\n');
        });
        it('should recognize zip mime types and unzip the downloaded file with query string', async function () {
          let newAppPath = await (0, _helpers.configureApp)(`${serverUrl}/FakeAndroidApp.asd?content-type=${encodeURIComponent('application/zip')}&sv=abc&sr=def`, '.apk');
          newAppPath.should.contain('FakeAndroidApp.apk');
          newAppPath.should.not.contain('.asd');
          let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
          contents.should.eql('this is not really an apk\n');
        });
        it('should treat an unknown mime type as an app', async function () {
          let newAppPath = await (0, _helpers.configureApp)(`${serverUrl}/FakeAndroidApp.apk?content-type=${encodeURIComponent('application/bip')}`, '.apk');
          newAppPath.should.contain('.apk');
          let contents = await _armorSupport.fs.readFile(newAppPath, 'utf8');
          contents.should.eql('this is not really an apk\n');
        });
      });
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC9iYXNlZHJpdmVyL2hlbHBlcnMtZTJlLXNwZWNzLmpzIiwibmFtZXMiOlsiX2NoYWkiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9wYXRoIiwiX3VybCIsIl9jaGFpQXNQcm9taXNlZCIsIl9hcm1vclN1cHBvcnQiLCJfaGVscGVycyIsIl9odHRwIiwiX2ZpbmFsaGFuZGxlciIsIl9zZXJ2ZVN0YXRpYyIsIl9jb250ZW50RGlzcG9zaXRpb24iLCJfYmx1ZWJpcmQiLCJjaGFpIiwic2hvdWxkIiwidXNlIiwiY2hhaUFzUHJvbWlzZWQiLCJnZXRGaXh0dXJlIiwiZmlsZSIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwiZGVzY3JpYmUiLCJpdCIsIm5ld0FwcFBhdGgiLCJjb25maWd1cmVBcHAiLCJjb250YWluIiwiY29udGVudHMiLCJmcyIsInJlYWRGaWxlIiwiZXFsIiwiYmUiLCJyZWplY3RlZFdpdGgiLCJwb3J0Iiwic2VydmVyVXJsIiwiZXZlbnR1YWxseSIsInNlcnZlciIsImJlZm9yZSIsImRpciIsInNlcnZlIiwic2VydmVTdGF0aWMiLCJpbmRleCIsInNldEhlYWRlcnMiLCJyZXMiLCJzZXRIZWFkZXIiLCJjb250ZW50RGlzcG9zaXRpb24iLCJodHRwIiwiY3JlYXRlU2VydmVyIiwicmVxIiwidXJsIiwiaW5kZXhPZiIsIndyaXRlSGVhZCIsImVuZCIsImNvbnRlbnRUeXBlIiwiVVJMU2VhcmNoUGFyYW1zIiwicGFyc2UiLCJzZWFyY2giLCJnZXQiLCJmaW5hbGhhbmRsZXIiLCJjbG9zZSIsImJpbmQiLCJCIiwiZGVsYXkiLCJyZWplY3QiLCJvbiIsImVyciIsImxpc3RlbiIsImFmdGVyIiwicmVqZWN0ZWQiLCJlbmNvZGVVUklDb21wb25lbnQiLCJub3QiXSwic291cmNlUm9vdCI6Ii4uLy4uLy4uIiwic291cmNlcyI6WyJ0ZXN0L2Jhc2Vkcml2ZXIvaGVscGVycy1lMmUtc3BlY3MuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB1cmwgZnJvbSAndXJsJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IGZzIH0gZnJvbSAnYXJtb3Itc3VwcG9ydCc7XG5pbXBvcnQgeyBjb25maWd1cmVBcHAgfSBmcm9tICcuLi8uLi9saWIvYmFzZWRyaXZlci9oZWxwZXJzJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0IGZpbmFsaGFuZGxlciBmcm9tICdmaW5hbGhhbmRsZXInO1xuaW1wb3J0IHNlcnZlU3RhdGljIGZyb20gJ3NlcnZlLXN0YXRpYyc7XG5pbXBvcnQgY29udGVudERpc3Bvc2l0aW9uIGZyb20gJ2NvbnRlbnQtZGlzcG9zaXRpb24nO1xuaW1wb3J0IEIgZnJvbSAnYmx1ZWJpcmQnO1xuXG5cbmNoYWkuc2hvdWxkKCk7XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cbmZ1bmN0aW9uIGdldEZpeHR1cmUgKGZpbGUpIHtcbiAgcmV0dXJuIHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsICcuLicsICd0ZXN0JywgJ2Jhc2Vkcml2ZXInLCAnZml4dHVyZXMnLCBmaWxlKTtcbn1cblxuZGVzY3JpYmUoJ2FwcCBkb3dubG9hZCBhbmQgY29uZmlndXJhdGlvbicsIGZ1bmN0aW9uICgpIHtcbiAgZGVzY3JpYmUoJ2NvbmZpZ3VyZUFwcCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGdldCB0aGUgcGF0aCBmb3IgYSBsb2NhbCAuYXBwJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IG5ld0FwcFBhdGggPSBhd2FpdCBjb25maWd1cmVBcHAoZ2V0Rml4dHVyZSgnRmFrZUlPU0FwcC5hcHAnKSwgJy5hcHAnKTtcbiAgICAgIG5ld0FwcFBhdGguc2hvdWxkLmNvbnRhaW4oJ0Zha2VJT1NBcHAuYXBwJyk7XG4gICAgICBsZXQgY29udGVudHMgPSBhd2FpdCBmcy5yZWFkRmlsZShuZXdBcHBQYXRoLCAndXRmOCcpO1xuICAgICAgY29udGVudHMuc2hvdWxkLmVxbCgndGhpcyBpcyBub3QgcmVhbGx5IGFuIGFwcFxcbicpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgZ2V0IHRoZSBwYXRoIGZvciBhIGxvY2FsIC5hcGsnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgbmV3QXBwUGF0aCA9IGF3YWl0IGNvbmZpZ3VyZUFwcChnZXRGaXh0dXJlKCdGYWtlQW5kcm9pZEFwcC5hcGsnKSwgJy5hcGsnKTtcbiAgICAgIG5ld0FwcFBhdGguc2hvdWxkLmNvbnRhaW4oJ0Zha2VBbmRyb2lkQXBwLmFwaycpO1xuICAgICAgbGV0IGNvbnRlbnRzID0gYXdhaXQgZnMucmVhZEZpbGUobmV3QXBwUGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnRlbnRzLnNob3VsZC5lcWwoJ3RoaXMgaXMgbm90IHJlYWxseSBhbiBhcGtcXG4nKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHVuemlwIGFuZCBnZXQgdGhlIHBhdGggZm9yIGEgbG9jYWwgLmFwcC56aXAnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgbmV3QXBwUGF0aCA9IGF3YWl0IGNvbmZpZ3VyZUFwcChnZXRGaXh0dXJlKCdGYWtlSU9TQXBwLmFwcC56aXAnKSwgJy5hcHAnKTtcbiAgICAgIG5ld0FwcFBhdGguc2hvdWxkLmNvbnRhaW4oJ0Zha2VJT1NBcHAuYXBwJyk7XG4gICAgICBsZXQgY29udGVudHMgPSBhd2FpdCBmcy5yZWFkRmlsZShuZXdBcHBQYXRoLCAndXRmOCcpO1xuICAgICAgY29udGVudHMuc2hvdWxkLmVxbCgndGhpcyBpcyBub3QgcmVhbGx5IGFuIGFwcFxcbicpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgdW56aXAgYW5kIGdldCB0aGUgcGF0aCBmb3IgYSBsb2NhbCAuaXBhJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IG5ld0FwcFBhdGggPSBhd2FpdCBjb25maWd1cmVBcHAoZ2V0Rml4dHVyZSgnRmFrZUlPU0FwcC5pcGEnKSwgJy5hcHAnKTtcbiAgICAgIG5ld0FwcFBhdGguc2hvdWxkLmNvbnRhaW4oJ0Zha2VJT1NBcHAuYXBwJyk7XG4gICAgICBsZXQgY29udGVudHMgPSBhd2FpdCBmcy5yZWFkRmlsZShuZXdBcHBQYXRoLCAndXRmOCcpO1xuICAgICAgY29udGVudHMuc2hvdWxkLmVxbCgndGhpcyBpcyBub3QgcmVhbGx5IGFuIGFwcFxcbicpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgZmFpbCBmb3IgYSBiYWQgemlwIGZpbGUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBjb25maWd1cmVBcHAoZ2V0Rml4dHVyZSgnQmFkWmlwcGVkQXBwLnppcCcpLCAnLmFwcCcpXG4gICAgICAgIC5zaG91bGQuYmUucmVqZWN0ZWRXaXRoKC9QSy8pO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgZmFpbCBpZiBleHRlbnNpb25zIGRvIG5vdCBtYXRjaCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGF3YWl0IGNvbmZpZ3VyZUFwcChnZXRGaXh0dXJlKCdGYWtlSU9TQXBwLmFwcCcpLCAnLndyb25nJylcbiAgICAgICAgLnNob3VsZC5iZS5yZWplY3RlZFdpdGgoL2RpZCBub3QgaGF2ZSBleHRlbnNpb24vKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGZhaWwgaWYgemlwIGZpbGUgZG9lcyBub3QgY29udGFpbiBhbiBhcHAgd2hvc2UgZXh0ZW5zaW9uIG1hdGNoZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBjb25maWd1cmVBcHAoZ2V0Rml4dHVyZSgnRmFrZUlPU0FwcC5hcHAuemlwJyksICcud3JvbmcnKVxuICAgICAgICAuc2hvdWxkLmJlLnJlamVjdGVkV2l0aCgvZGlkIG5vdCBoYXZlIGV4dGVuc2lvbi8pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdzaG91bGQgZG93bmxvYWQgYW4gYXBwIGZyb20gdGhlIHdlYicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHBvcnQgPSA4MDAwO1xuICAgICAgY29uc3Qgc2VydmVyVXJsID0gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fWA7XG5cbiAgICAgIGRlc2NyaWJlKCdzZXJ2ZXIgbm90IGF2YWlsYWJsZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBoYW5kbGUgc2VydmVyIG5vdCBhdmFpbGFibGUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXdhaXQgY29uZmlndXJlQXBwKGAke3NlcnZlclVybH0vRmFrZUlPU0FwcC5hcHAuemlwYCwgJy5hcHAnKVxuICAgICAgICAgICAgLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgvRUNPTk5SRUZVU0VELyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBkZXNjcmliZSgnc2VydmVyIGF2YWlsYWJsZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gdXNlIGEgbG9jYWwgc2VydmVyIHNvIHRoZXJlIGlzIG5vIGRlcGVuZGVuY3kgb24gdGhlIGludGVybmV0XG4gICAgICAgIGxldCBzZXJ2ZXI7XG4gICAgICAgIGJlZm9yZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc3QgZGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJy4uJywgJ3Rlc3QnLCAnYmFzZWRyaXZlcicsICdmaXh0dXJlcycpO1xuICAgICAgICAgIGNvbnN0IHNlcnZlID0gc2VydmVTdGF0aWMoZGlyLCB7XG4gICAgICAgICAgICBpbmRleDogZmFsc2UsXG4gICAgICAgICAgICBzZXRIZWFkZXJzOiAocmVzLCBwYXRoKSA9PiB7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCBjb250ZW50RGlzcG9zaXRpb24ocGF0aCkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKGZ1bmN0aW9uIChyZXEsIHJlcykge1xuICAgICAgICAgICAgaWYgKHJlcS51cmwuaW5kZXhPZignbWlzc2luZycpICE9PSAtMSkge1xuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwNCk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZm9yIHRlc3RpbmcgemlwIGZpbGUgY29udGVudCB0eXBlc1xuICAgICAgICAgICAgY29uc3QgY29udGVudFR5cGUgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHVybC5wYXJzZShyZXEudXJsKS5zZWFyY2gpLmdldCgnY29udGVudC10eXBlJyk7XG4gICAgICAgICAgICBpZiAoY29udGVudFR5cGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignY29udGVudC10eXBlJywgY29udGVudFR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VydmUocmVxLCByZXMsIGZpbmFsaGFuZGxlcihyZXEsIHJlcykpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnN0IGNsb3NlID0gc2VydmVyLmNsb3NlLmJpbmQoc2VydmVyKTtcbiAgICAgICAgICBzZXJ2ZXIuY2xvc2UgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBwYXVzZSBhIG1vbWVudCBvciB3ZSBnZXQgRUNPTlJFU0VUIGVycm9yc1xuICAgICAgICAgICAgYXdhaXQgQi5kZWxheSgxMDAwKTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBuZXcgQigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgIHNlcnZlci5vbignY2xvc2UnLCByZXNvbHZlKTtcbiAgICAgICAgICAgICAgY2xvc2UoKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGN1cmx5XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBzZXJ2ZXIubGlzdGVuKHBvcnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgYWZ0ZXIoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGF3YWl0IHNlcnZlci5jbG9zZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIGRvd25sb2FkIHppcCBmaWxlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGxldCBuZXdBcHBQYXRoID0gYXdhaXQgY29uZmlndXJlQXBwKGAke3NlcnZlclVybH0vRmFrZUlPU0FwcC5hcHAuemlwYCwgJy5hcHAnKTtcbiAgICAgICAgICBuZXdBcHBQYXRoLnNob3VsZC5jb250YWluKCdGYWtlSU9TQXBwLmFwcCcpO1xuICAgICAgICAgIGxldCBjb250ZW50cyA9IGF3YWl0IGZzLnJlYWRGaWxlKG5ld0FwcFBhdGgsICd1dGY4Jyk7XG4gICAgICAgICAgY29udGVudHMuc2hvdWxkLmVxbCgndGhpcyBpcyBub3QgcmVhbGx5IGFuIGFwcFxcbicpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBkb3dubG9hZCB6aXAgZmlsZSB3aXRoIHF1ZXJ5IHN0cmluZycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBsZXQgbmV3QXBwUGF0aCA9IGF3YWl0IGNvbmZpZ3VyZUFwcChgJHtzZXJ2ZXJVcmx9L0Zha2VJT1NBcHAuYXBwLnppcD9zdj1hYmMmc3I9ZGVmYCwgJy5hcHAnKTtcbiAgICAgICAgICBuZXdBcHBQYXRoLnNob3VsZC5jb250YWluKCcuYXBwJyk7XG4gICAgICAgICAgbGV0IGNvbnRlbnRzID0gYXdhaXQgZnMucmVhZEZpbGUobmV3QXBwUGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgICBjb250ZW50cy5zaG91bGQuZXFsKCd0aGlzIGlzIG5vdCByZWFsbHkgYW4gYXBwXFxuJyk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIGRvd25sb2FkIGFuIGFwcCBmaWxlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGxldCBuZXdBcHBQYXRoID0gYXdhaXQgY29uZmlndXJlQXBwKGAke3NlcnZlclVybH0vRmFrZUlPU0FwcC5hcHBgLCAnLmFwcCcpO1xuICAgICAgICAgIG5ld0FwcFBhdGguc2hvdWxkLmNvbnRhaW4oJy5hcHAnKTtcbiAgICAgICAgICBsZXQgY29udGVudHMgPSBhd2FpdCBmcy5yZWFkRmlsZShuZXdBcHBQYXRoLCAndXRmOCcpO1xuICAgICAgICAgIGNvbnRlbnRzLnNob3VsZC5lcWwoJ3RoaXMgaXMgbm90IHJlYWxseSBhbiBhcHBcXG4nKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgYWNjZXB0IG11bHRpcGxlIGV4dGVuc2lvbnMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgbGV0IG5ld0FwcFBhdGggPSBhd2FpdCBjb25maWd1cmVBcHAoYCR7c2VydmVyVXJsfS9GYWtlSU9TQXBwLmFwcC56aXBgLCBbJy5hcHAnLCAnLmFhYiddKTtcbiAgICAgICAgICBuZXdBcHBQYXRoLnNob3VsZC5jb250YWluKCdGYWtlSU9TQXBwLmFwcCcpO1xuICAgICAgICAgIGxldCBjb250ZW50cyA9IGF3YWl0IGZzLnJlYWRGaWxlKG5ld0FwcFBhdGgsICd1dGY4Jyk7XG4gICAgICAgICAgY29udGVudHMuc2hvdWxkLmVxbCgndGhpcyBpcyBub3QgcmVhbGx5IGFuIGFwcFxcbicpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBkb3dubG9hZCBhbiBhcGsgZmlsZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBsZXQgbmV3QXBwUGF0aCA9IGF3YWl0IGNvbmZpZ3VyZUFwcChgJHtzZXJ2ZXJVcmx9L0Zha2VBbmRyb2lkQXBwLmFwa2AsICcuYXBrJyk7XG4gICAgICAgICAgbmV3QXBwUGF0aC5zaG91bGQuY29udGFpbignLmFwaycpO1xuICAgICAgICAgIGxldCBjb250ZW50cyA9IGF3YWl0IGZzLnJlYWRGaWxlKG5ld0FwcFBhdGgsICd1dGY4Jyk7XG4gICAgICAgICAgY29udGVudHMuc2hvdWxkLmVxbCgndGhpcyBpcyBub3QgcmVhbGx5IGFuIGFwa1xcbicpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBoYW5kbGUgemlwIGZpbGUgdGhhdCBjYW5ub3QgYmUgZG93bmxvYWRlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBhd2FpdCBjb25maWd1cmVBcHAoYCR7c2VydmVyVXJsfS9taXNzaW5nL0Zha2VJT1NBcHAuYXBwLnppcGAsICcuYXBwJylcbiAgICAgICAgICAgIC5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgaGFuZGxlIGludmFsaWQgcHJvdG9jb2wnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXdhaXQgY29uZmlndXJlQXBwKCdmaWxlOi8vQzovbWlzc2luZy9GYWtlSU9TQXBwLmFwcC56aXAnLCAnLmFwcCcpXG4gICAgICAgICAgICAuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC9pcyBub3Qgc3VwcG9ydGVkLyk7XG4gICAgICAgICAgYXdhaXQgY29uZmlndXJlQXBwKCdmdHA6Ly9sb2NhbGhvc3Q6ODAwMC9taXNzaW5nL0Zha2VJT1NBcHAuYXBwLnppcCcsICcuYXBwJylcbiAgICAgICAgICAgIC5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZFdpdGgoL2lzIG5vdCBzdXBwb3J0ZWQvKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgaGFuZGxlIG1pc3NpbmcgZmlsZSBpbiBXaW5kb3dzIHBhdGggZm9ybWF0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGF3YWl0IGNvbmZpZ3VyZUFwcCgnQzpcXFxcbWlzc2luZ1xcXFxGYWtlSU9TQXBwLmFwcC56aXAnLCAnLmFwcCcpXG4gICAgICAgICAgICAuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC9kb2VzIG5vdCBleGlzdCBvciBpcyBub3QgYWNjZXNzaWJsZS8pO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCByZWNvZ25pemUgemlwIG1pbWUgdHlwZXMgYW5kIHVuemlwIHRoZSBkb3dubG9hZGVkIGZpbGUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgbGV0IG5ld0FwcFBhdGggPSBhd2FpdCBjb25maWd1cmVBcHAoYCR7c2VydmVyVXJsfS9GYWtlQW5kcm9pZEFwcC5hc2Q/Y29udGVudC10eXBlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdhcHBsaWNhdGlvbi96aXAnKX1gLCAnLmFwaycpO1xuICAgICAgICAgIG5ld0FwcFBhdGguc2hvdWxkLmNvbnRhaW4oJ0Zha2VBbmRyb2lkQXBwLmFwaycpO1xuICAgICAgICAgIG5ld0FwcFBhdGguc2hvdWxkLm5vdC5jb250YWluKCcuYXNkJyk7XG4gICAgICAgICAgbGV0IGNvbnRlbnRzID0gYXdhaXQgZnMucmVhZEZpbGUobmV3QXBwUGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgICBjb250ZW50cy5zaG91bGQuZXFsKCd0aGlzIGlzIG5vdCByZWFsbHkgYW4gYXBrXFxuJyk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHJlY29nbml6ZSB6aXAgbWltZSB0eXBlcyB3aXRoIHBhcmFtZXRlciBhbmQgdW56aXAgdGhlIGRvd25sb2FkZWQgZmlsZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBsZXQgbmV3QXBwUGF0aCA9IGF3YWl0IGNvbmZpZ3VyZUFwcChgJHtzZXJ2ZXJVcmx9L0Zha2VBbmRyb2lkQXBwLmFzZD9jb250ZW50LXR5cGU9JHtlbmNvZGVVUklDb21wb25lbnQoJ2FwcGxpY2F0aW9uL3ppcDsgcGFyYW1ldGVyPXZhbHVlJyl9YCwgJy5hcGsnKTtcbiAgICAgICAgICBuZXdBcHBQYXRoLnNob3VsZC5jb250YWluKCdGYWtlQW5kcm9pZEFwcC5hcGsnKTtcbiAgICAgICAgICBuZXdBcHBQYXRoLnNob3VsZC5ub3QuY29udGFpbignLmFzZCcpO1xuICAgICAgICAgIGxldCBjb250ZW50cyA9IGF3YWl0IGZzLnJlYWRGaWxlKG5ld0FwcFBhdGgsICd1dGY4Jyk7XG4gICAgICAgICAgY29udGVudHMuc2hvdWxkLmVxbCgndGhpcyBpcyBub3QgcmVhbGx5IGFuIGFwa1xcbicpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCByZWNvZ25pemUgemlwIG1pbWUgdHlwZXMgYW5kIHVuemlwIHRoZSBkb3dubG9hZGVkIGZpbGUgd2l0aCBxdWVyeSBzdHJpbmcnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgbGV0IG5ld0FwcFBhdGggPSBhd2FpdCBjb25maWd1cmVBcHAoYCR7c2VydmVyVXJsfS9GYWtlQW5kcm9pZEFwcC5hc2Q/Y29udGVudC10eXBlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdhcHBsaWNhdGlvbi96aXAnKX0mc3Y9YWJjJnNyPWRlZmAsICcuYXBrJyk7XG4gICAgICAgICAgbmV3QXBwUGF0aC5zaG91bGQuY29udGFpbignRmFrZUFuZHJvaWRBcHAuYXBrJyk7XG4gICAgICAgICAgbmV3QXBwUGF0aC5zaG91bGQubm90LmNvbnRhaW4oJy5hc2QnKTtcbiAgICAgICAgICBsZXQgY29udGVudHMgPSBhd2FpdCBmcy5yZWFkRmlsZShuZXdBcHBQYXRoLCAndXRmOCcpO1xuICAgICAgICAgIGNvbnRlbnRzLnNob3VsZC5lcWwoJ3RoaXMgaXMgbm90IHJlYWxseSBhbiBhcGtcXG4nKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgdHJlYXQgYW4gdW5rbm93biBtaW1lIHR5cGUgYXMgYW4gYXBwJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGxldCBuZXdBcHBQYXRoID0gYXdhaXQgY29uZmlndXJlQXBwKGAke3NlcnZlclVybH0vRmFrZUFuZHJvaWRBcHAuYXBrP2NvbnRlbnQtdHlwZT0ke2VuY29kZVVSSUNvbXBvbmVudCgnYXBwbGljYXRpb24vYmlwJyl9YCwgJy5hcGsnKTtcbiAgICAgICAgICBuZXdBcHBQYXRoLnNob3VsZC5jb250YWluKCcuYXBrJyk7XG4gICAgICAgICAgbGV0IGNvbnRlbnRzID0gYXdhaXQgZnMucmVhZEZpbGUobmV3QXBwUGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgICBjb250ZW50cy5zaG91bGQuZXFsKCd0aGlzIGlzIG5vdCByZWFsbHkgYW4gYXBrXFxuJyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxJQUFBQSxLQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxLQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxJQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxlQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxhQUFBLEdBQUFKLE9BQUE7QUFDQSxJQUFBSyxRQUFBLEdBQUFMLE9BQUE7QUFDQSxJQUFBTSxLQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxhQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUSxZQUFBLEdBQUFULHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUyxtQkFBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUsU0FBQSxHQUFBWCxzQkFBQSxDQUFBQyxPQUFBO0FBR0FXLGFBQUksQ0FBQ0MsTUFBTSxDQUFDLENBQUM7QUFDYkQsYUFBSSxDQUFDRSxHQUFHLENBQUNDLHVCQUFjLENBQUM7QUFFeEIsU0FBU0MsVUFBVUEsQ0FBRUMsSUFBSSxFQUFFO0VBQ3pCLE9BQU9DLGFBQUksQ0FBQ0MsT0FBTyxDQUFDQyxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUVILElBQUksQ0FBQztBQUMxRjtBQUVBSSxRQUFRLENBQUMsZ0NBQWdDLEVBQUUsWUFBWTtFQUNyREEsUUFBUSxDQUFDLGNBQWMsRUFBRSxZQUFZO0lBQ25DQyxFQUFFLENBQUMsc0NBQXNDLEVBQUUsa0JBQWtCO01BQzNELElBQUlDLFVBQVUsR0FBRyxNQUFNLElBQUFDLHFCQUFZLEVBQUNSLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQztNQUN6RU8sVUFBVSxDQUFDVixNQUFNLENBQUNZLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztNQUMzQyxJQUFJQyxRQUFRLEdBQUcsTUFBTUMsZ0JBQUUsQ0FBQ0MsUUFBUSxDQUFDTCxVQUFVLEVBQUUsTUFBTSxDQUFDO01BQ3BERyxRQUFRLENBQUNiLE1BQU0sQ0FBQ2dCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztJQUNwRCxDQUFDLENBQUM7SUFDRlAsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLGtCQUFrQjtNQUMzRCxJQUFJQyxVQUFVLEdBQUcsTUFBTSxJQUFBQyxxQkFBWSxFQUFDUixVQUFVLENBQUMsb0JBQW9CLENBQUMsRUFBRSxNQUFNLENBQUM7TUFDN0VPLFVBQVUsQ0FBQ1YsTUFBTSxDQUFDWSxPQUFPLENBQUMsb0JBQW9CLENBQUM7TUFDL0MsSUFBSUMsUUFBUSxHQUFHLE1BQU1DLGdCQUFFLENBQUNDLFFBQVEsQ0FBQ0wsVUFBVSxFQUFFLE1BQU0sQ0FBQztNQUNwREcsUUFBUSxDQUFDYixNQUFNLENBQUNnQixHQUFHLENBQUMsNkJBQTZCLENBQUM7SUFDcEQsQ0FBQyxDQUFDO0lBQ0ZQLEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxrQkFBa0I7TUFDekUsSUFBSUMsVUFBVSxHQUFHLE1BQU0sSUFBQUMscUJBQVksRUFBQ1IsVUFBVSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsTUFBTSxDQUFDO01BQzdFTyxVQUFVLENBQUNWLE1BQU0sQ0FBQ1ksT0FBTyxDQUFDLGdCQUFnQixDQUFDO01BQzNDLElBQUlDLFFBQVEsR0FBRyxNQUFNQyxnQkFBRSxDQUFDQyxRQUFRLENBQUNMLFVBQVUsRUFBRSxNQUFNLENBQUM7TUFDcERHLFFBQVEsQ0FBQ2IsTUFBTSxDQUFDZ0IsR0FBRyxDQUFDLDZCQUE2QixDQUFDO0lBQ3BELENBQUMsQ0FBQztJQUNGUCxFQUFFLENBQUMsZ0RBQWdELEVBQUUsa0JBQWtCO01BQ3JFLElBQUlDLFVBQVUsR0FBRyxNQUFNLElBQUFDLHFCQUFZLEVBQUNSLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQztNQUN6RU8sVUFBVSxDQUFDVixNQUFNLENBQUNZLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztNQUMzQyxJQUFJQyxRQUFRLEdBQUcsTUFBTUMsZ0JBQUUsQ0FBQ0MsUUFBUSxDQUFDTCxVQUFVLEVBQUUsTUFBTSxDQUFDO01BQ3BERyxRQUFRLENBQUNiLE1BQU0sQ0FBQ2dCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztJQUNwRCxDQUFDLENBQUM7SUFDRlAsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLGtCQUFrQjtNQUNyRCxNQUFNLElBQUFFLHFCQUFZLEVBQUNSLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUN2REgsTUFBTSxDQUFDaUIsRUFBRSxDQUFDQyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQ2pDLENBQUMsQ0FBQztJQUNGVCxFQUFFLENBQUMsd0NBQXdDLEVBQUUsa0JBQWtCO01BQzdELE1BQU0sSUFBQUUscUJBQVksRUFBQ1IsVUFBVSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQ3ZESCxNQUFNLENBQUNpQixFQUFFLENBQUNDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQztJQUNyRCxDQUFDLENBQUM7SUFDRlQsRUFBRSxDQUFDLHlFQUF5RSxFQUFFLGtCQUFrQjtNQUM5RixNQUFNLElBQUFFLHFCQUFZLEVBQUNSLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUMzREgsTUFBTSxDQUFDaUIsRUFBRSxDQUFDQyxZQUFZLENBQUMsd0JBQXdCLENBQUM7SUFDckQsQ0FBQyxDQUFDO0lBQ0ZWLFFBQVEsQ0FBQyxxQ0FBcUMsRUFBRSxZQUFZO01BQzFELE1BQU1XLElBQUksR0FBRyxJQUFJO01BQ2pCLE1BQU1DLFNBQVMsR0FBSSxvQkFBbUJELElBQUssRUFBQztNQUU1Q1gsUUFBUSxDQUFDLHNCQUFzQixFQUFFLFlBQVk7UUFDM0NDLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxrQkFBa0I7VUFDekQsTUFBTSxJQUFBRSxxQkFBWSxFQUFFLEdBQUVTLFNBQVUscUJBQW9CLEVBQUUsTUFBTSxDQUFDLENBQzFEcEIsTUFBTSxDQUFDcUIsVUFBVSxDQUFDSixFQUFFLENBQUNDLFlBQVksQ0FBQyxjQUFjLENBQUM7UUFDdEQsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO01BQ0ZWLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxZQUFZO1FBRXZDLElBQUljLE1BQU07UUFDVkMsTUFBTSxDQUFDLFlBQVk7VUFDakIsTUFBTUMsR0FBRyxHQUFHbkIsYUFBSSxDQUFDQyxPQUFPLENBQUNDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQztVQUN2RixNQUFNa0IsS0FBSyxHQUFHLElBQUFDLG9CQUFXLEVBQUNGLEdBQUcsRUFBRTtZQUM3QkcsS0FBSyxFQUFFLEtBQUs7WUFDWkMsVUFBVSxFQUFFQSxDQUFDQyxHQUFHLEVBQUV4QixJQUFJLEtBQUs7Y0FDekJ3QixHQUFHLENBQUNDLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxJQUFBQywyQkFBa0IsRUFBQzFCLElBQUksQ0FBQyxDQUFDO1lBQ2hFO1VBQ0YsQ0FBQyxDQUFDO1VBRUZpQixNQUFNLEdBQUdVLGFBQUksQ0FBQ0MsWUFBWSxDQUFDLFVBQVVDLEdBQUcsRUFBRUwsR0FBRyxFQUFFO1lBQzdDLElBQUlLLEdBQUcsQ0FBQ0MsR0FBRyxDQUFDQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Y0FDckNQLEdBQUcsQ0FBQ1EsU0FBUyxDQUFDLEdBQUcsQ0FBQztjQUNsQlIsR0FBRyxDQUFDUyxHQUFHLENBQUMsQ0FBQztjQUNUO1lBQ0Y7WUFFQSxNQUFNQyxXQUFXLEdBQUcsSUFBSUMsZUFBZSxDQUFDTCxZQUFHLENBQUNNLEtBQUssQ0FBQ1AsR0FBRyxDQUFDQyxHQUFHLENBQUMsQ0FBQ08sTUFBTSxDQUFDLENBQUNDLEdBQUcsQ0FBQyxjQUFjLENBQUM7WUFDdEYsSUFBSUosV0FBVyxLQUFLLElBQUksRUFBRTtjQUN4QlYsR0FBRyxDQUFDQyxTQUFTLENBQUMsY0FBYyxFQUFFUyxXQUFXLENBQUM7WUFDNUM7WUFDQWQsS0FBSyxDQUFDUyxHQUFHLEVBQUVMLEdBQUcsRUFBRSxJQUFBZSxxQkFBWSxFQUFDVixHQUFHLEVBQUVMLEdBQUcsQ0FBQyxDQUFDO1VBQ3pDLENBQUMsQ0FBQztVQUNGLE1BQU1nQixLQUFLLEdBQUd2QixNQUFNLENBQUN1QixLQUFLLENBQUNDLElBQUksQ0FBQ3hCLE1BQU0sQ0FBQztVQUN2Q0EsTUFBTSxDQUFDdUIsS0FBSyxHQUFHLGtCQUFrQjtZQUUvQixNQUFNRSxpQkFBQyxDQUFDQyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQ25CLE9BQU8sTUFBTSxJQUFJRCxpQkFBQyxDQUFDLENBQUN6QyxPQUFPLEVBQUUyQyxNQUFNLEtBQUs7Y0FDdEMzQixNQUFNLENBQUM0QixFQUFFLENBQUMsT0FBTyxFQUFFNUMsT0FBTyxDQUFDO2NBQzNCdUMsS0FBSyxDQUFFTSxHQUFHLElBQUs7Z0JBQ2IsSUFBSUEsR0FBRyxFQUFFRixNQUFNLENBQUNFLEdBQUcsQ0FBQztjQUN0QixDQUFDLENBQUM7WUFDSixDQUFDLENBQUM7VUFDSixDQUFDO1VBQ0Q3QixNQUFNLENBQUM4QixNQUFNLENBQUNqQyxJQUFJLENBQUM7UUFDckIsQ0FBQyxDQUFDO1FBQ0ZrQyxLQUFLLENBQUMsa0JBQWtCO1VBQ3RCLE1BQU0vQixNQUFNLENBQUN1QixLQUFLLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUM7UUFFRnBDLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSxrQkFBa0I7VUFDL0MsSUFBSUMsVUFBVSxHQUFHLE1BQU0sSUFBQUMscUJBQVksRUFBRSxHQUFFUyxTQUFVLHFCQUFvQixFQUFFLE1BQU0sQ0FBQztVQUM5RVYsVUFBVSxDQUFDVixNQUFNLENBQUNZLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztVQUMzQyxJQUFJQyxRQUFRLEdBQUcsTUFBTUMsZ0JBQUUsQ0FBQ0MsUUFBUSxDQUFDTCxVQUFVLEVBQUUsTUFBTSxDQUFDO1VBQ3BERyxRQUFRLENBQUNiLE1BQU0sQ0FBQ2dCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztRQUNwRCxDQUFDLENBQUM7UUFDRlAsRUFBRSxDQUFDLDRDQUE0QyxFQUFFLGtCQUFrQjtVQUNqRSxJQUFJQyxVQUFVLEdBQUcsTUFBTSxJQUFBQyxxQkFBWSxFQUFFLEdBQUVTLFNBQVUsbUNBQWtDLEVBQUUsTUFBTSxDQUFDO1VBQzVGVixVQUFVLENBQUNWLE1BQU0sQ0FBQ1ksT0FBTyxDQUFDLE1BQU0sQ0FBQztVQUNqQyxJQUFJQyxRQUFRLEdBQUcsTUFBTUMsZ0JBQUUsQ0FBQ0MsUUFBUSxDQUFDTCxVQUFVLEVBQUUsTUFBTSxDQUFDO1VBQ3BERyxRQUFRLENBQUNiLE1BQU0sQ0FBQ2dCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztRQUNwRCxDQUFDLENBQUM7UUFDRlAsRUFBRSxDQUFDLDZCQUE2QixFQUFFLGtCQUFrQjtVQUNsRCxJQUFJQyxVQUFVLEdBQUcsTUFBTSxJQUFBQyxxQkFBWSxFQUFFLEdBQUVTLFNBQVUsaUJBQWdCLEVBQUUsTUFBTSxDQUFDO1VBQzFFVixVQUFVLENBQUNWLE1BQU0sQ0FBQ1ksT0FBTyxDQUFDLE1BQU0sQ0FBQztVQUNqQyxJQUFJQyxRQUFRLEdBQUcsTUFBTUMsZ0JBQUUsQ0FBQ0MsUUFBUSxDQUFDTCxVQUFVLEVBQUUsTUFBTSxDQUFDO1VBQ3BERyxRQUFRLENBQUNiLE1BQU0sQ0FBQ2dCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztRQUNwRCxDQUFDLENBQUM7UUFDRlAsRUFBRSxDQUFDLG1DQUFtQyxFQUFFLGtCQUFrQjtVQUN4RCxJQUFJQyxVQUFVLEdBQUcsTUFBTSxJQUFBQyxxQkFBWSxFQUFFLEdBQUVTLFNBQVUscUJBQW9CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7VUFDeEZWLFVBQVUsQ0FBQ1YsTUFBTSxDQUFDWSxPQUFPLENBQUMsZ0JBQWdCLENBQUM7VUFDM0MsSUFBSUMsUUFBUSxHQUFHLE1BQU1DLGdCQUFFLENBQUNDLFFBQVEsQ0FBQ0wsVUFBVSxFQUFFLE1BQU0sQ0FBQztVQUNwREcsUUFBUSxDQUFDYixNQUFNLENBQUNnQixHQUFHLENBQUMsNkJBQTZCLENBQUM7UUFDcEQsQ0FBQyxDQUFDO1FBQ0ZQLEVBQUUsQ0FBQyw2QkFBNkIsRUFBRSxrQkFBa0I7VUFDbEQsSUFBSUMsVUFBVSxHQUFHLE1BQU0sSUFBQUMscUJBQVksRUFBRSxHQUFFUyxTQUFVLHFCQUFvQixFQUFFLE1BQU0sQ0FBQztVQUM5RVYsVUFBVSxDQUFDVixNQUFNLENBQUNZLE9BQU8sQ0FBQyxNQUFNLENBQUM7VUFDakMsSUFBSUMsUUFBUSxHQUFHLE1BQU1DLGdCQUFFLENBQUNDLFFBQVEsQ0FBQ0wsVUFBVSxFQUFFLE1BQU0sQ0FBQztVQUNwREcsUUFBUSxDQUFDYixNQUFNLENBQUNnQixHQUFHLENBQUMsNkJBQTZCLENBQUM7UUFDcEQsQ0FBQyxDQUFDO1FBQ0ZQLEVBQUUsQ0FBQyxrREFBa0QsRUFBRSxrQkFBa0I7VUFDdkUsTUFBTSxJQUFBRSxxQkFBWSxFQUFFLEdBQUVTLFNBQVUsNkJBQTRCLEVBQUUsTUFBTSxDQUFDLENBQ2xFcEIsTUFBTSxDQUFDcUIsVUFBVSxDQUFDSixFQUFFLENBQUNxQyxRQUFRO1FBQ2xDLENBQUMsQ0FBQztRQUNGN0MsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLGtCQUFrQjtVQUNyRCxNQUFNLElBQUFFLHFCQUFZLEVBQUMsc0NBQXNDLEVBQUUsTUFBTSxDQUFDLENBQy9EWCxNQUFNLENBQUNxQixVQUFVLENBQUNKLEVBQUUsQ0FBQ0MsWUFBWSxDQUFDLGtCQUFrQixDQUFDO1VBQ3hELE1BQU0sSUFBQVAscUJBQVksRUFBQyxpREFBaUQsRUFBRSxNQUFNLENBQUMsQ0FDMUVYLE1BQU0sQ0FBQ3FCLFVBQVUsQ0FBQ0osRUFBRSxDQUFDQyxZQUFZLENBQUMsa0JBQWtCLENBQUM7UUFDMUQsQ0FBQyxDQUFDO1FBQ0ZULEVBQUUsQ0FBQyxtREFBbUQsRUFBRSxrQkFBa0I7VUFDeEUsTUFBTSxJQUFBRSxxQkFBWSxFQUFDLGlDQUFpQyxFQUFFLE1BQU0sQ0FBQyxDQUMxRFgsTUFBTSxDQUFDcUIsVUFBVSxDQUFDSixFQUFFLENBQUNDLFlBQVksQ0FBQyxxQ0FBcUMsQ0FBQztRQUM3RSxDQUFDLENBQUM7UUFDRlQsRUFBRSxDQUFDLCtEQUErRCxFQUFFLGtCQUFrQjtVQUNwRixJQUFJQyxVQUFVLEdBQUcsTUFBTSxJQUFBQyxxQkFBWSxFQUFFLEdBQUVTLFNBQVUsb0NBQW1DbUMsa0JBQWtCLENBQUMsaUJBQWlCLENBQUUsRUFBQyxFQUFFLE1BQU0sQ0FBQztVQUNwSTdDLFVBQVUsQ0FBQ1YsTUFBTSxDQUFDWSxPQUFPLENBQUMsb0JBQW9CLENBQUM7VUFDL0NGLFVBQVUsQ0FBQ1YsTUFBTSxDQUFDd0QsR0FBRyxDQUFDNUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztVQUNyQyxJQUFJQyxRQUFRLEdBQUcsTUFBTUMsZ0JBQUUsQ0FBQ0MsUUFBUSxDQUFDTCxVQUFVLEVBQUUsTUFBTSxDQUFDO1VBQ3BERyxRQUFRLENBQUNiLE1BQU0sQ0FBQ2dCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztRQUNwRCxDQUFDLENBQUM7UUFDRlAsRUFBRSxDQUFDLDhFQUE4RSxFQUFFLGtCQUFrQjtVQUNuRyxJQUFJQyxVQUFVLEdBQUcsTUFBTSxJQUFBQyxxQkFBWSxFQUFFLEdBQUVTLFNBQVUsb0NBQW1DbUMsa0JBQWtCLENBQUMsa0NBQWtDLENBQUUsRUFBQyxFQUFFLE1BQU0sQ0FBQztVQUNySjdDLFVBQVUsQ0FBQ1YsTUFBTSxDQUFDWSxPQUFPLENBQUMsb0JBQW9CLENBQUM7VUFDL0NGLFVBQVUsQ0FBQ1YsTUFBTSxDQUFDd0QsR0FBRyxDQUFDNUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztVQUNyQyxJQUFJQyxRQUFRLEdBQUcsTUFBTUMsZ0JBQUUsQ0FBQ0MsUUFBUSxDQUFDTCxVQUFVLEVBQUUsTUFBTSxDQUFDO1VBQ3BERyxRQUFRLENBQUNiLE1BQU0sQ0FBQ2dCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztRQUNwRCxDQUFDLENBQUM7UUFDRlAsRUFBRSxDQUFDLGlGQUFpRixFQUFFLGtCQUFrQjtVQUN0RyxJQUFJQyxVQUFVLEdBQUcsTUFBTSxJQUFBQyxxQkFBWSxFQUFFLEdBQUVTLFNBQVUsb0NBQW1DbUMsa0JBQWtCLENBQUMsaUJBQWlCLENBQUUsZ0JBQWUsRUFBRSxNQUFNLENBQUM7VUFDbEo3QyxVQUFVLENBQUNWLE1BQU0sQ0FBQ1ksT0FBTyxDQUFDLG9CQUFvQixDQUFDO1VBQy9DRixVQUFVLENBQUNWLE1BQU0sQ0FBQ3dELEdBQUcsQ0FBQzVDLE9BQU8sQ0FBQyxNQUFNLENBQUM7VUFDckMsSUFBSUMsUUFBUSxHQUFHLE1BQU1DLGdCQUFFLENBQUNDLFFBQVEsQ0FBQ0wsVUFBVSxFQUFFLE1BQU0sQ0FBQztVQUNwREcsUUFBUSxDQUFDYixNQUFNLENBQUNnQixHQUFHLENBQUMsNkJBQTZCLENBQUM7UUFDcEQsQ0FBQyxDQUFDO1FBQ0ZQLEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRSxrQkFBa0I7VUFDbEUsSUFBSUMsVUFBVSxHQUFHLE1BQU0sSUFBQUMscUJBQVksRUFBRSxHQUFFUyxTQUFVLG9DQUFtQ21DLGtCQUFrQixDQUFDLGlCQUFpQixDQUFFLEVBQUMsRUFBRSxNQUFNLENBQUM7VUFDcEk3QyxVQUFVLENBQUNWLE1BQU0sQ0FBQ1ksT0FBTyxDQUFDLE1BQU0sQ0FBQztVQUNqQyxJQUFJQyxRQUFRLEdBQUcsTUFBTUMsZ0JBQUUsQ0FBQ0MsUUFBUSxDQUFDTCxVQUFVLEVBQUUsTUFBTSxDQUFDO1VBQ3BERyxRQUFRLENBQUNiLE1BQU0sQ0FBQ2dCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztRQUNwRCxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSixDQUFDLENBQUM7QUFDSixDQUFDLENBQUMifQ==
