"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
require("source-map-support/register");
var _chai = _interopRequireDefault(require("chai"));
var _path = _interopRequireDefault(require("path"));
var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));
var _sinon = _interopRequireDefault(require("sinon"));
var _ = require("../../..");
var _find = require("../../../lib/basedriver/commands/find");
var _armorSupport = require("armor-support");
const should = _chai.default.should();
_chai.default.use(_chaiAsPromised.default);
class TestDriver extends _.BaseDriver {
  async getWindowSize() {}
  async getScreenshot() {}
}
const CUSTOM_FIND_MODULE = _path.default.resolve(__dirname, '..', '..', '..', '..', 'test', 'basedriver', 'fixtures', 'custom-element-finder');
const BAD_CUSTOM_FIND_MODULE = _path.default.resolve(__dirname, '..', '..', '..', '..', 'test', 'basedriver', 'fixtures', 'custom-element-finder-bad');
const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDQ1MSwgMjAxNy8wNS8wNi0wMTowODoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6N0NDMDM4MDM4N0U2MTFFOEEzMzhGMTRFNUUwNzIwNUIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6N0NDMDM4MDQ4N0U2MTFFOEEzMzhGMTRFNUUwNzIwNUIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3Q0MwMzgwMTg3RTYxMUU4QTMzOEYxNEU1RTA3MjA1QiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3Q0MwMzgwMjg3RTYxMUU4QTMzOEYxNEU1RTA3MjA1QiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PpdvJjQAAAAlSURBVHjaJInBEQAACIKw/Xe2Ul5wYBtwmJqkk4+zfvUQVoABAEg0EfrZwc0hAAAAAElFTkSuQmCC';
const TINY_PNG_DIMS = [4, 4];
describe('finding elements by image', function () {
  describe('findElement', function () {
    it('should use a different special method to find element by image', async function () {
      const d = new TestDriver();
      _sinon.default.stub(d, 'findByImage').returns(true);
      _sinon.default.stub(d, 'findElOrElsWithProcessing').returns(false);
      await d.findElement(_find.IMAGE_STRATEGY, 'foo').should.eventually.be.true;
      await d.findElements(_find.IMAGE_STRATEGY, 'foo').should.eventually.be.true;
    });
    it('should not be able to find image element from any other element', async function () {
      const d = new TestDriver();
      await d.findElementFromElement(_find.IMAGE_STRATEGY, 'foo', 'elId').should.eventually.be.rejectedWith(/Locator Strategy.+is not supported/);
      await d.findElementsFromElement(_find.IMAGE_STRATEGY, 'foo', 'elId').should.eventually.be.rejectedWith(/Locator Strategy.+is not supported/);
    });
  });
  describe('findByImage', function () {
    const rect = {
      x: 10,
      y: 20,
      width: 30,
      height: 40
    };
    const score = 0.9;
    const size = {
      width: 100,
      height: 200
    };
    const screenshot = 'iVBORfoo';
    const template = 'iVBORbar';
    function basicStub(driver) {
      const sizeStub = _sinon.default.stub(driver, 'getWindowSize').returns(size);
      const screenStub = _sinon.default.stub(driver, 'getScreenshotForImageFind').returns(screenshot);
      const compareStub = _sinon.default.stub(driver, 'compareImages').returns({
        rect,
        score
      });
      return {
        sizeStub,
        screenStub,
        compareStub
      };
    }
    function basicImgElVerify(imgElProto, driver) {
      const imgElId = imgElProto.ELEMENT;
      driver._imgElCache.has(imgElId).should.be.true;
      const imgEl = driver._imgElCache.get(imgElId);
      (imgEl instanceof _.ImageElement).should.be.true;
      imgEl.rect.should.eql(rect);
      imgEl.score.should.eql(score);
      return imgEl;
    }
    it('should find an image element happypath', async function () {
      const d = new TestDriver();
      basicStub(d);
      const imgElProto = await d.findByImage(template, {
        multiple: false
      });
      basicImgElVerify(imgElProto, d);
    });
    it('should find image elements happypath', async function () {
      const d = new TestDriver();
      const {
        compareStub
      } = basicStub(d);
      compareStub.returns([{
        rect,
        score
      }]);
      const els = await d.findByImage(template, {
        multiple: true
      });
      els.should.have.length(1);
      basicImgElVerify(els[0], d);
    });
    it('should fail if driver does not support getWindowSize', async function () {
      const d = new _.BaseDriver();
      await d.findByImage(template, {
        multiple: false
      }).should.eventually.be.rejectedWith(/driver does not support/);
    });
    it('should fix template size if requested', async function () {
      const d = new TestDriver();
      const newTemplate = 'iVBORbaz';
      const {
        compareStub
      } = basicStub(d);
      await d.settings.update({
        fixImageTemplateSize: true
      });
      _sinon.default.stub(d, 'ensureTemplateSize').returns(newTemplate);
      const imgElProto = await d.findByImage(template, {
        multiple: false
      });
      const imgEl = basicImgElVerify(imgElProto, d);
      imgEl.template.should.eql(newTemplate);
      compareStub.args[0][2].should.eql(newTemplate);
    });
    it('should fix template size scale if requested', async function () {
      const d = new TestDriver();
      const newTemplate = 'iVBORbaz';
      const {
        compareStub
      } = basicStub(d);
      await d.settings.update({
        fixImageTemplateScale: true
      });
      _sinon.default.stub(d, 'fixImageTemplateScale').returns(newTemplate);
      const imgElProto = await d.findByImage(template, {
        multiple: false
      });
      const imgEl = basicImgElVerify(imgElProto, d);
      imgEl.template.should.eql(newTemplate);
      compareStub.args[0][2].should.eql(newTemplate);
    });
    it('should not fix template size scale if it is not requested', async function () {
      const d = new TestDriver();
      const newTemplate = 'iVBORbaz';
      basicStub(d);
      await d.settings.update({});
      _sinon.default.stub(d, 'fixImageTemplateScale').returns(newTemplate);
      d.fixImageTemplateScale.callCount.should.eql(0);
    });
    it('should throw an error if template match fails', async function () {
      const d = new TestDriver();
      const {
        compareStub
      } = basicStub(d);
      compareStub.throws(new Error('Cannot find any occurrences'));
      await d.findByImage(template, {
        multiple: false
      }).should.eventually.be.rejectedWith(/element could not be located/);
    });
    it('should return empty array for multiple elements if template match fails', async function () {
      const d = new TestDriver();
      const {
        compareStub
      } = basicStub(d);
      compareStub.throws(new Error('Cannot find any occurrences'));
      await d.findByImage(template, {
        multiple: true
      }).should.eventually.eql([]);
    });
    it('should respect implicit wait', async function () {
      const d = new TestDriver();
      d.setImplicitWait(10);
      const {
        compareStub
      } = basicStub(d);
      compareStub.onCall(0).throws(new Error('Cannot find any occurrences'));
      const imgElProto = await d.findByImage(template, {
        multiple: false
      });
      basicImgElVerify(imgElProto, d);
      compareStub.callCount.should.eql(2);
    });
    it('should not add element to cache and return it directly when checking staleness', async function () {
      const d = new TestDriver();
      basicStub(d);
      const imgEl = await d.findByImage(template, {
        multiple: false,
        shouldCheckStaleness: true
      });
      (imgEl instanceof _.ImageElement).should.be.true;
      d._imgElCache.has(imgEl.id).should.be.false;
      imgEl.rect.should.eql(rect);
    });
  });
  describe('fixImageTemplateScale', function () {
    it('should not fix template size scale if no scale value', async function () {
      const newTemplate = 'iVBORbaz';
      await _find.helpers.fixImageTemplateScale(newTemplate, {
        fixImageTemplateScale: true
      }).should.eventually.eql(newTemplate);
    });
    it('should not fix template size scale if it is null', async function () {
      const newTemplate = 'iVBORbaz';
      await _find.helpers.fixImageTemplateScale(newTemplate, null).should.eventually.eql(newTemplate);
    });
    it('should not fix template size scale if it is not number', async function () {
      const newTemplate = 'iVBORbaz';
      await _find.helpers.fixImageTemplateScale(newTemplate, 'wrong-scale').should.eventually.eql(newTemplate);
    });
    it('should fix template size scale', async function () {
      const actual = 'iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAWElEQVR4AU3BQRWAQAhAwa/PGBsEgrC16AFBKEIPXW7OXO+Rmey9iQjMjHFzrLUwM7qbqmLcHKpKRFBVuDvj4agq3B1VRUQYT2bS3QwRQVUZF/CaGRHB3wc1vSZbHO5+BgAAAABJRU5ErkJggg==';
      await _find.helpers.fixImageTemplateScale(TINY_PNG, {
        fixImageTemplateScale: true,
        xScale: 1.5,
        yScale: 1.5
      }).should.eventually.eql(actual);
    });
    it('should not fix template size scale because of fixImageTemplateScale is false', async function () {
      await _find.helpers.fixImageTemplateScale(TINY_PNG, {
        fixImageTemplateScale: false,
        xScale: 1.5,
        yScale: 1.5
      }).should.eventually.eql(TINY_PNG);
    });
    it('should fix template size scale with default scale', async function () {
      const actual = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABwUlEQVR4AaXBPUsrQQCG0SeX+cBdkTjwTpG1NPgLpjY/fW1stt4UYmm2cJqwMCsaw70uJJ3CBc9Z/P3Cl+12S9u2tG1L27bEGLm/v2ez2bDZbJDEd/7wS4YT7z3X19fc3Nxwd3dHXdd47xnHkefnZ8ZxpKoq6rqmqiqMMcwMJ1VV0TQN0zThnOPj44O6rsk503UdkmiahqZpWK1WGGOYGU7quqZpGqy1SCLnTM6Z19dXcs5IYpomrLVI4uLigpnhpKoqVqsVkjgcDjw9PdF1HTlnuq5DEs45JHE4HDgznByPR97e3pimiVIK4zhyPB7x3hNCIITA5eUl3nsWiwVnhpNSCsMwsNvtGIaB/X5PKQVJpJSQxHq9RhLOOc4MJ9M0sdvt2G639H3PTBIxRiQhCUnEGLHWcmY4KaUwDAN93/P4+MhyuSSlhCRSSkjCOYe1FmstZ6bve2YvLy/s93tmy+USSUhCEpIIIfAd8/DwwOz9/Z1SCpJIKSGJ9XqNJJxz/MS0bcvs6uoKScQYkYQkJBFjxFrLT0zbtsxub29JKSGJlBKScM5hrcVay09MzplZjJHPz0+894QQCCHwP/7wS/8A4e6nAg+R8LwAAAAASUVORK5CYII=';
      await _find.helpers.fixImageTemplateScale(TINY_PNG, {
        defaultImageTemplateScale: 4.0
      }).should.eventually.eql(actual);
    });
    it('should fix template size scale with default scale and image scale', async function () {
      const actual = 'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACaUlEQVR4AbXBMWvrWBSF0c9BsFPtW91UR1U6+///FKlKKt8qqnyqnMozggkI8xgMj6x1uv+L/6zryrIsrOvKsiys68qyLFwuF87nM5fLhfP5zOVy4Xw+84wXftkLv2ziQBK26b0TEVQVu4jANrvM5Hq9spOEJCQhCUlI4mjiQBK26b1TVewkYRvb7DKTMQaZiW1s01rDNraRxNHEgSRaa1QVO0m01jjKTDKTXe+d3jtVxU4SjyYOJGGbnSRs03snM8lMMpPb7UZmkplEBFXFThK2eTRxIAnbSMI2VcX39zdjDMYYZCaZyRiDMQZVxU4StqkqHk0cSEISf5KZ7DKTMQbLsrCTRGuN3jtVxaOJg6qiqqgqqoqqoqoYY5CZ7GwTEdzvd97f34kIeu/YRhKPJg6qiswkM7ndbmQmmUlmkpnsbBMR2CYimOeZ3ju2kcSjiYOqIjP5+vpi2za2bWPbNo5aa7TW2PXe6b3Te6e1hiQeTRxUFbfbjW3bGGNwvV4ZY2Ab27TWsI1tbGMb27TWsI0kHk0cVBWZybZtXK9XPj8/+fj4YJ5nIoLWGraJCOZ5RhKSkIQkJPFo4qCqyEy2bWOMwefnJ+u6cjqdsM3ONvM8cz6feca0ris/rtcrmcnONhHB/X7n/f2diKD3jm0k8axpWRZ+ZCaZyc42EYFtIoJ5num9YxtJPGta15U/sY1tdm9vb/Te6b1jG0k8a1qWhR+2sU1rjdYatrGNbWxjm9YaknjWtK4rPyKCiKC1hm0igojg9fUVSUhCEpJ41rQsC0e22dkmIrhcLvyNF/7H6XTib73wy174Zf8AJEsePtlPj10AAAAASUVORK5CYII=';
      await _find.helpers.fixImageTemplateScale(TINY_PNG, {
        defaultImageTemplateScale: 4.0,
        fixImageTemplateScale: true,
        xScale: 1.5,
        yScale: 1.5
      }).should.eventually.eql(actual);
    });
    it('should not fix template size scale with default scale and image scale', async function () {
      const actual = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABwUlEQVR4AaXBPUsrQQCG0SeX+cBdkTjwTpG1NPgLpjY/fW1stt4UYmm2cJqwMCsaw70uJJ3CBc9Z/P3Cl+12S9u2tG1L27bEGLm/v2ez2bDZbJDEd/7wS4YT7z3X19fc3Nxwd3dHXdd47xnHkefnZ8ZxpKoq6rqmqiqMMcwMJ1VV0TQN0zThnOPj44O6rsk503UdkmiahqZpWK1WGGOYGU7quqZpGqy1SCLnTM6Z19dXcs5IYpomrLVI4uLigpnhpKoqVqsVkjgcDjw9PdF1HTlnuq5DEs45JHE4HDgznByPR97e3pimiVIK4zhyPB7x3hNCIITA5eUl3nsWiwVnhpNSCsMwsNvtGIaB/X5PKQVJpJSQxHq9RhLOOc4MJ9M0sdvt2G639H3PTBIxRiQhCUnEGLHWcmY4KaUwDAN93/P4+MhyuSSlhCRSSkjCOYe1FmstZ6bve2YvLy/s93tmy+USSUhCEpIIIfAd8/DwwOz9/Z1SCpJIKSGJ9XqNJJxz/MS0bcvs6uoKScQYkYQkJBFjxFrLT0zbtsxub29JKSGJlBKScM5hrcVay09MzplZjJHPz0+894QQCCHwP/7wS/8A4e6nAg+R8LwAAAAASUVORK5CYII=';
      await _find.helpers.fixImageTemplateScale(TINY_PNG, {
        defaultImageTemplateScale: 4.0,
        fixImageTemplateScale: false,
        xScale: 1.5,
        yScale: 1.5
      }).should.eventually.eql(actual);
    });
    it('should not fix template size scale because of ignoreDefaultImageTemplateScale', async function () {
      await _find.helpers.fixImageTemplateScale(TINY_PNG, {
        defaultImageTemplateScale: 4.0,
        ignoreDefaultImageTemplateScale: true
      }).should.eventually.eql(TINY_PNG);
    });
    it('should ignore defaultImageTemplateScale to fix template size scale because of ignoreDefaultImageTemplateScale', async function () {
      const actual = 'iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAWElEQVR4AU3BQRWAQAhAwa/PGBsEgrC16AFBKEIPXW7OXO+Rmey9iQjMjHFzrLUwM7qbqmLcHKpKRFBVuDvj4agq3B1VRUQYT2bS3QwRQVUZF/CaGRHB3wc1vSZbHO5+BgAAAABJRU5ErkJggg==';
      await _find.helpers.fixImageTemplateScale(TINY_PNG, {
        defaultImageTemplateScale: 4.0,
        ignoreDefaultImageTemplateScale: true,
        fixImageTemplateScale: true,
        xScale: 1.5,
        yScale: 1.5
      }).should.eventually.eql(actual);
    });
  });
  describe('ensureTemplateSize', function () {
    it('should not resize the template if it is smaller than the screen', async function () {
      const screen = TINY_PNG_DIMS.map(n => n * 2);
      const d = new TestDriver();
      await d.ensureTemplateSize(TINY_PNG, ...screen).should.eventually.eql(TINY_PNG);
    });
    it('should not resize the template if it is the same size as the screen', async function () {
      const d = new TestDriver();
      await d.ensureTemplateSize(TINY_PNG, ...TINY_PNG_DIMS).should.eventually.eql(TINY_PNG);
    });
    it('should resize the template if it is bigger than the screen', async function () {
      const d = new TestDriver();
      const screen = TINY_PNG_DIMS.map(n => n / 2);
      const newTemplate = await d.ensureTemplateSize(TINY_PNG, ...screen);
      newTemplate.should.not.eql(TINY_PNG);
      newTemplate.length.should.be.below(TINY_PNG.length);
    });
  });
  describe('getScreenshotForImageFind', function () {
    it('should fail if driver does not support getScreenshot', async function () {
      const d = new _.BaseDriver();
      await d.getScreenshotForImageFind().should.eventually.be.rejectedWith(/driver does not support/);
    });
    it('should not adjust or verify screenshot if asked not to by settings', async function () {
      const d = new TestDriver();
      _sinon.default.stub(d, 'getScreenshot').returns(TINY_PNG);
      d.settings.update({
        fixImageFindScreenshotDims: false
      });
      const screen = TINY_PNG_DIMS.map(n => n + 1);
      const {
        b64Screenshot,
        scale
      } = await d.getScreenshotForImageFind(...screen);
      b64Screenshot.should.eql(TINY_PNG);
      should.equal(scale, undefined);
    });
    it('should return screenshot without adjustment if it matches screen size', async function () {
      const d = new TestDriver();
      _sinon.default.stub(d, 'getScreenshot').returns(TINY_PNG);
      const {
        b64Screenshot,
        scale
      } = await d.getScreenshotForImageFind(...TINY_PNG_DIMS);
      b64Screenshot.should.eql(TINY_PNG);
      should.equal(scale, undefined);
    });
    it('should return scaled screenshot with same aspect ratio if matching screen aspect ratio', async function () {
      const d = new TestDriver();
      _sinon.default.stub(d, 'getScreenshot').returns(TINY_PNG);
      const screen = TINY_PNG_DIMS.map(n => n * 1.5);
      const {
        b64Screenshot,
        scale
      } = await d.getScreenshotForImageFind(...screen);
      b64Screenshot.should.not.eql(TINY_PNG);
      const screenshotObj = await _armorSupport.imageUtil.getJimpImage(b64Screenshot);
      screenshotObj.bitmap.width.should.eql(screen[0]);
      screenshotObj.bitmap.height.should.eql(screen[1]);
      scale.should.eql({
        xScale: 1.5,
        yScale: 1.5
      });
    });
    it('should return scaled screenshot with different aspect ratio if not matching screen aspect ratio', async function () {
      const d = new TestDriver();
      _sinon.default.stub(d, 'getScreenshot').returns(TINY_PNG);
      let screen = [TINY_PNG_DIMS[0] * 2, TINY_PNG_DIMS[1] * 3];
      let expectedScale = {
        xScale: 2.67,
        yScale: 4
      };
      const {
        b64Screenshot,
        scale
      } = await d.getScreenshotForImageFind(...screen);
      b64Screenshot.should.not.eql(TINY_PNG);
      let screenshotObj = await _armorSupport.imageUtil.getJimpImage(b64Screenshot);
      screenshotObj.bitmap.width.should.eql(screen[0]);
      screenshotObj.bitmap.height.should.eql(screen[1]);
      scale.xScale.toFixed(2).should.eql(expectedScale.xScale.toString());
      scale.yScale.should.eql(expectedScale.yScale);
      screen = [TINY_PNG_DIMS[0] * 3, TINY_PNG_DIMS[1] * 2];
      expectedScale = {
        xScale: 4,
        yScale: 2.67
      };
      const {
        b64Screenshot: newScreen,
        scale: newScale
      } = await d.getScreenshotForImageFind(...screen);
      newScreen.should.not.eql(TINY_PNG);
      screenshotObj = await _armorSupport.imageUtil.getJimpImage(newScreen);
      screenshotObj.bitmap.width.should.eql(screen[0]);
      screenshotObj.bitmap.height.should.eql(screen[1]);
      newScale.xScale.should.eql(expectedScale.xScale);
      newScale.yScale.toFixed(2).should.eql(expectedScale.yScale.toString());
    });
    it('should return scaled screenshot with different aspect ratio if not matching screen aspect ratio with fixImageTemplateScale', async function () {
      const d = new TestDriver();
      _sinon.default.stub(d, 'getScreenshot').returns(TINY_PNG);
      let screen = [TINY_PNG_DIMS[0] * 2, TINY_PNG_DIMS[1] * 3];
      let expectedScale = {
        xScale: 2.67,
        yScale: 4
      };
      const {
        b64Screenshot,
        scale
      } = await d.getScreenshotForImageFind(...screen);
      b64Screenshot.should.not.eql(TINY_PNG);
      let screenshotObj = await _armorSupport.imageUtil.getJimpImage(b64Screenshot);
      screenshotObj.bitmap.width.should.eql(screen[0]);
      screenshotObj.bitmap.height.should.eql(screen[1]);
      scale.xScale.toFixed(2).should.eql(expectedScale.xScale.toString());
      scale.yScale.should.eql(expectedScale.yScale);
      await _find.helpers.fixImageTemplateScale(b64Screenshot, {
        fixImageTemplateScale: true,
        scale
      }).should.eventually.eql('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAMCAYAAABfnvydAAAAJ0lEQVR4AYXBAQEAIACDMKR/p0fTBrKdbZcPCRIkSJAgQYIECRIkPAzBA1TpeNwZAAAAAElFTkSuQmCC');
      screen = [TINY_PNG_DIMS[0] * 3, TINY_PNG_DIMS[1] * 2];
      expectedScale = {
        xScale: 4,
        yScale: 2.67
      };
      const {
        b64Screenshot: newScreen,
        scale: newScale
      } = await d.getScreenshotForImageFind(...screen);
      newScreen.should.not.eql(TINY_PNG);
      screenshotObj = await _armorSupport.imageUtil.getJimpImage(newScreen);
      screenshotObj.bitmap.width.should.eql(screen[0]);
      screenshotObj.bitmap.height.should.eql(screen[1]);
      newScale.xScale.should.eql(expectedScale.xScale);
      newScale.yScale.toFixed(2).should.eql(expectedScale.yScale.toString());
      await _find.helpers.fixImageTemplateScale(newScreen, {
        fixImageTemplateScale: true,
        scale
      }).should.eventually.eql('iVBORw0KGgoAAAANSUhEUgAAAAwAAAAICAYAAADN5B7xAAAAI0lEQVR4AZXBAQEAMAyDMI5/T5W2ayB5245AIokkkkgiiST6+W4DTLyo5PUAAAAASUVORK5CYII=');
    });
  });
});
describe('custom element finding plugins', function () {
  it('should find a single element using a custom finder', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: CUSTOM_FIND_MODULE
    };
    await d.findElement(_find.CUSTOM_STRATEGY, 'f:foo').should.eventually.eql('bar');
  });
  it('should not require selector prefix if only one find plugin is registered', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: CUSTOM_FIND_MODULE
    };
    await d.findElement(_find.CUSTOM_STRATEGY, 'foo').should.eventually.eql('bar');
  });
  it('should find multiple elements using a custom finder', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: CUSTOM_FIND_MODULE
    };
    await d.findElements(_find.CUSTOM_STRATEGY, 'f:foos').should.eventually.eql(['baz1', 'baz2']);
  });
  it('should give a hint to the plugin about whether multiple are requested', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: CUSTOM_FIND_MODULE
    };
    await d.findElement(_find.CUSTOM_STRATEGY, 'f:foos').should.eventually.eql('bar1');
  });
  it('should be able to use multiple find modules', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: CUSTOM_FIND_MODULE,
      g: CUSTOM_FIND_MODULE
    };
    await d.findElement(_find.CUSTOM_STRATEGY, 'f:foo').should.eventually.eql('bar');
    await d.findElement(_find.CUSTOM_STRATEGY, 'g:foo').should.eventually.eql('bar');
  });
  it('should throw an error if customFindModules is not set', async function () {
    const d = new _.BaseDriver();
    await d.findElement(_find.CUSTOM_STRATEGY, 'f:foo').should.eventually.be.rejectedWith(/customFindModules/);
  });
  it('should throw an error if customFindModules is the wrong shape', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = CUSTOM_FIND_MODULE;
    await d.findElement(_find.CUSTOM_STRATEGY, 'f:foo').should.eventually.be.rejectedWith(/customFindModules/);
  });
  it('should throw an error if customFindModules is size > 1 and no selector prefix is used', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: CUSTOM_FIND_MODULE,
      g: CUSTOM_FIND_MODULE
    };
    await d.findElement(_find.CUSTOM_STRATEGY, 'foo').should.eventually.be.rejectedWith(/multiple element finding/i);
  });
  it('should throw an error in attempt to use unregistered plugin', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: CUSTOM_FIND_MODULE,
      g: CUSTOM_FIND_MODULE
    };
    await d.findElement(_find.CUSTOM_STRATEGY, 'z:foo').should.eventually.be.rejectedWith(/was not registered/);
  });
  it('should throw an error if plugin cannot be loaded', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: './foo.js'
    };
    await d.findElement(_find.CUSTOM_STRATEGY, 'f:foo').should.eventually.be.rejectedWith(/could not load/i);
  });
  it('should throw an error if plugin is not the right shape', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: BAD_CUSTOM_FIND_MODULE
    };
    await d.findElement(_find.CUSTOM_STRATEGY, 'f:foo').should.eventually.be.rejectedWith(/constructed correctly/i);
  });
  it('should pass on an error thrown by the finder itself', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: CUSTOM_FIND_MODULE
    };
    await d.findElement(_find.CUSTOM_STRATEGY, 'f:error').should.eventually.be.rejectedWith(/plugin error/i);
  });
  it('should throw no such element error if element not found', async function () {
    const d = new _.BaseDriver();
    d.opts.customFindModules = {
      f: CUSTOM_FIND_MODULE
    };
    await d.findElement(_find.CUSTOM_STRATEGY, 'f:nope').should.eventually.be.rejectedWith(/could not be located/);
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC9iYXNlZHJpdmVyL2NvbW1hbmRzL2ZpbmQtc3BlY3MuanMiLCJuYW1lcyI6WyJfY2hhaSIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX3BhdGgiLCJfY2hhaUFzUHJvbWlzZWQiLCJfc2lub24iLCJfIiwiX2ZpbmQiLCJfYXJtb3JTdXBwb3J0Iiwic2hvdWxkIiwiY2hhaSIsInVzZSIsImNoYWlBc1Byb21pc2VkIiwiVGVzdERyaXZlciIsIkJhc2VEcml2ZXIiLCJnZXRXaW5kb3dTaXplIiwiZ2V0U2NyZWVuc2hvdCIsIkNVU1RPTV9GSU5EX01PRFVMRSIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwiQkFEX0NVU1RPTV9GSU5EX01PRFVMRSIsIlRJTllfUE5HIiwiVElOWV9QTkdfRElNUyIsImRlc2NyaWJlIiwiaXQiLCJkIiwic2lub24iLCJzdHViIiwicmV0dXJucyIsImZpbmRFbGVtZW50IiwiSU1BR0VfU1RSQVRFR1kiLCJldmVudHVhbGx5IiwiYmUiLCJ0cnVlIiwiZmluZEVsZW1lbnRzIiwiZmluZEVsZW1lbnRGcm9tRWxlbWVudCIsInJlamVjdGVkV2l0aCIsImZpbmRFbGVtZW50c0Zyb21FbGVtZW50IiwicmVjdCIsIngiLCJ5Iiwid2lkdGgiLCJoZWlnaHQiLCJzY29yZSIsInNpemUiLCJzY3JlZW5zaG90IiwidGVtcGxhdGUiLCJiYXNpY1N0dWIiLCJkcml2ZXIiLCJzaXplU3R1YiIsInNjcmVlblN0dWIiLCJjb21wYXJlU3R1YiIsImJhc2ljSW1nRWxWZXJpZnkiLCJpbWdFbFByb3RvIiwiaW1nRWxJZCIsIkVMRU1FTlQiLCJfaW1nRWxDYWNoZSIsImhhcyIsImltZ0VsIiwiZ2V0IiwiSW1hZ2VFbGVtZW50IiwiZXFsIiwiZmluZEJ5SW1hZ2UiLCJtdWx0aXBsZSIsImVscyIsImhhdmUiLCJsZW5ndGgiLCJuZXdUZW1wbGF0ZSIsInNldHRpbmdzIiwidXBkYXRlIiwiZml4SW1hZ2VUZW1wbGF0ZVNpemUiLCJhcmdzIiwiZml4SW1hZ2VUZW1wbGF0ZVNjYWxlIiwiY2FsbENvdW50IiwidGhyb3dzIiwiRXJyb3IiLCJzZXRJbXBsaWNpdFdhaXQiLCJvbkNhbGwiLCJzaG91bGRDaGVja1N0YWxlbmVzcyIsImlkIiwiZmFsc2UiLCJoZWxwZXJzIiwiYWN0dWFsIiwieFNjYWxlIiwieVNjYWxlIiwiZGVmYXVsdEltYWdlVGVtcGxhdGVTY2FsZSIsImlnbm9yZURlZmF1bHRJbWFnZVRlbXBsYXRlU2NhbGUiLCJzY3JlZW4iLCJtYXAiLCJuIiwiZW5zdXJlVGVtcGxhdGVTaXplIiwibm90IiwiYmVsb3ciLCJnZXRTY3JlZW5zaG90Rm9ySW1hZ2VGaW5kIiwiZml4SW1hZ2VGaW5kU2NyZWVuc2hvdERpbXMiLCJiNjRTY3JlZW5zaG90Iiwic2NhbGUiLCJlcXVhbCIsInVuZGVmaW5lZCIsInNjcmVlbnNob3RPYmoiLCJpbWFnZVV0aWwiLCJnZXRKaW1wSW1hZ2UiLCJiaXRtYXAiLCJleHBlY3RlZFNjYWxlIiwidG9GaXhlZCIsInRvU3RyaW5nIiwibmV3U2NyZWVuIiwibmV3U2NhbGUiLCJvcHRzIiwiY3VzdG9tRmluZE1vZHVsZXMiLCJmIiwiQ1VTVE9NX1NUUkFURUdZIiwiZyJdLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vLi4iLCJzb3VyY2VzIjpbInRlc3QvYmFzZWRyaXZlci9jb21tYW5kcy9maW5kLXNwZWNzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgc2lub24gZnJvbSAnc2lub24nO1xuaW1wb3J0IHsgQmFzZURyaXZlciwgSW1hZ2VFbGVtZW50IH0gZnJvbSAnLi4vLi4vLi4nO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG5pbXBvcnQgeyBJTUFHRV9TVFJBVEVHWSwgQ1VTVE9NX1NUUkFURUdZLCBoZWxwZXJzIH0gZnJvbSAnLi4vLi4vLi4vbGliL2Jhc2Vkcml2ZXIvY29tbWFuZHMvZmluZCc7XG5pbXBvcnQgeyBpbWFnZVV0aWwgfSBmcm9tICdhcm1vci1zdXBwb3J0JztcblxuXG5jb25zdCBzaG91bGQgPSBjaGFpLnNob3VsZCgpO1xuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuXG5cbmNsYXNzIFRlc3REcml2ZXIgZXh0ZW5kcyBCYXNlRHJpdmVyIHtcbiAgYXN5bmMgZ2V0V2luZG93U2l6ZSAoKSB7fVxuICBhc3luYyBnZXRTY3JlZW5zaG90ICgpIHt9XG59XG5cbmNvbnN0IENVU1RPTV9GSU5EX01PRFVMRSA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsICcuLicsICcuLicsXG4gICd0ZXN0JywgJ2Jhc2Vkcml2ZXInLCAnZml4dHVyZXMnLCAnY3VzdG9tLWVsZW1lbnQtZmluZGVyJyk7XG5jb25zdCBCQURfQ1VTVE9NX0ZJTkRfTU9EVUxFID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJy4uJywgJy4uJyxcbiAgJ3Rlc3QnLCAnYmFzZWRyaXZlcicsICdmaXh0dXJlcycsICdjdXN0b20tZWxlbWVudC1maW5kZXItYmFkJyk7XG5cbmNvbnN0IFRJTllfUE5HID0gJ2lWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBUUFBQUFFQ0FJQUFBQW1rd2twQUFBQUdYUkZXSFJUYjJaMGQyRnlaUUJCWkc5aVpTQkpiV0ZuWlZKbFlXUjVjY2xsUEFBQUF5aHBWRmgwV0UxTU9tTnZiUzVoWkc5aVpTNTRiWEFBQUFBQUFEdy9lSEJoWTJ0bGRDQmlaV2RwYmowaTc3dS9JaUJwWkQwaVZ6Vk5NRTF3UTJWb2FVaDZjbVZUZWs1VVkzcHJZemxrSWo4K0lEeDRPbmh0Y0cxbGRHRWdlRzFzYm5NNmVEMGlZV1J2WW1VNmJuTTZiV1YwWVM4aUlIZzZlRzF3ZEdzOUlrRmtiMkpsSUZoTlVDQkRiM0psSURVdU5pMWpNVFF3SURjNUxqRTJNRFExTVN3Z01qQXhOeTh3TlM4d05pMHdNVG93T0RveU1TQWdJQ0FnSUNBZ0lqNGdQSEprWmpwU1JFWWdlRzFzYm5NNmNtUm1QU0pvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh4T1RrNUx6QXlMekl5TFhKa1ppMXplVzUwWVhndGJuTWpJajRnUEhKa1pqcEVaWE5qY21sd2RHbHZiaUJ5WkdZNllXSnZkWFE5SWlJZ2VHMXNibk02ZUcxd1BTSm9kSFJ3T2k4dmJuTXVZV1J2WW1VdVkyOXRMM2hoY0M4eExqQXZJaUI0Yld4dWN6cDRiWEJOVFQwaWFIUjBjRG92TDI1ekxtRmtiMkpsTG1OdmJTOTRZWEF2TVM0d0wyMXRMeUlnZUcxc2JuTTZjM1JTWldZOUltaDBkSEE2THk5dWN5NWhaRzlpWlM1amIyMHZlR0Z3THpFdU1DOXpWSGx3WlM5U1pYTnZkWEpqWlZKbFppTWlJSGh0Y0RwRGNtVmhkRzl5Vkc5dmJEMGlRV1J2WW1VZ1VHaHZkRzl6YUc5d0lFTkRJREl3TVRnZ0tFMWhZMmx1ZEc5emFDa2lJSGh0Y0UxTk9rbHVjM1JoYm1ObFNVUTlJbmh0Y0M1cGFXUTZOME5ETURNNE1ETTROMFUyTVRGRk9FRXpNemhHTVRSRk5VVXdOekl3TlVJaUlIaHRjRTFOT2tSdlkzVnRaVzUwU1VROUluaHRjQzVrYVdRNk4wTkRNRE00TURRNE4wVTJNVEZGT0VFek16aEdNVFJGTlVVd056SXdOVUlpUGlBOGVHMXdUVTA2UkdWeWFYWmxaRVp5YjIwZ2MzUlNaV1k2YVc1emRHRnVZMlZKUkQwaWVHMXdMbWxwWkRvM1EwTXdNemd3TVRnM1JUWXhNVVU0UVRNek9FWXhORVUxUlRBM01qQTFRaUlnYzNSU1pXWTZaRzlqZFcxbGJuUkpSRDBpZUcxd0xtUnBaRG8zUTBNd016Z3dNamczUlRZeE1VVTRRVE16T0VZeE5FVTFSVEEzTWpBMVFpSXZQaUE4TDNKa1pqcEVaWE5qY21sd2RHbHZiajRnUEM5eVpHWTZVa1JHUGlBOEwzZzZlRzF3YldWMFlUNGdQRDk0Y0dGamEyVjBJR1Z1WkQwaWNpSS9QcGR2SmpRQUFBQWxTVVJCVkhqYUpJbkJFUUFBQ0lLdy9YZTJVbDV3WUJ0d21KcWtrNCt6ZnZVUVZvQUJBRWcwRWZyWndjMGhBQUFBQUVsRlRrU3VRbUNDJztcbmNvbnN0IFRJTllfUE5HX0RJTVMgPSBbNCwgNF07XG5cbmRlc2NyaWJlKCdmaW5kaW5nIGVsZW1lbnRzIGJ5IGltYWdlJywgZnVuY3Rpb24gKCkge1xuICBkZXNjcmliZSgnZmluZEVsZW1lbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCB1c2UgYSBkaWZmZXJlbnQgc3BlY2lhbCBtZXRob2QgdG8gZmluZCBlbGVtZW50IGJ5IGltYWdlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgZCA9IG5ldyBUZXN0RHJpdmVyKCk7XG4gICAgICBzaW5vbi5zdHViKGQsICdmaW5kQnlJbWFnZScpLnJldHVybnModHJ1ZSk7XG4gICAgICBzaW5vbi5zdHViKGQsICdmaW5kRWxPckVsc1dpdGhQcm9jZXNzaW5nJykucmV0dXJucyhmYWxzZSk7XG4gICAgICBhd2FpdCBkLmZpbmRFbGVtZW50KElNQUdFX1NUUkFURUdZLCAnZm9vJykuc2hvdWxkLmV2ZW50dWFsbHkuYmUudHJ1ZTtcbiAgICAgIGF3YWl0IGQuZmluZEVsZW1lbnRzKElNQUdFX1NUUkFURUdZLCAnZm9vJykuc2hvdWxkLmV2ZW50dWFsbHkuYmUudHJ1ZTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGZpbmQgaW1hZ2UgZWxlbWVudCBmcm9tIGFueSBvdGhlciBlbGVtZW50JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgZCA9IG5ldyBUZXN0RHJpdmVyKCk7XG4gICAgICBhd2FpdCBkLmZpbmRFbGVtZW50RnJvbUVsZW1lbnQoSU1BR0VfU1RSQVRFR1ksICdmb28nLCAnZWxJZCcpXG4gICAgICAgIC5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZFdpdGgoL0xvY2F0b3IgU3RyYXRlZ3kuK2lzIG5vdCBzdXBwb3J0ZWQvKTtcbiAgICAgIGF3YWl0IGQuZmluZEVsZW1lbnRzRnJvbUVsZW1lbnQoSU1BR0VfU1RSQVRFR1ksICdmb28nLCAnZWxJZCcpXG4gICAgICAgIC5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZFdpdGgoL0xvY2F0b3IgU3RyYXRlZ3kuK2lzIG5vdCBzdXBwb3J0ZWQvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2ZpbmRCeUltYWdlJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHJlY3QgPSB7eDogMTAsIHk6IDIwLCB3aWR0aDogMzAsIGhlaWdodDogNDB9O1xuICAgIGNvbnN0IHNjb3JlID0gMC45O1xuICAgIGNvbnN0IHNpemUgPSB7d2lkdGg6IDEwMCwgaGVpZ2h0OiAyMDB9O1xuICAgIGNvbnN0IHNjcmVlbnNob3QgPSAnaVZCT1Jmb28nO1xuICAgIGNvbnN0IHRlbXBsYXRlID0gJ2lWQk9SYmFyJztcblxuICAgIGZ1bmN0aW9uIGJhc2ljU3R1YiAoZHJpdmVyKSB7XG4gICAgICBjb25zdCBzaXplU3R1YiA9IHNpbm9uLnN0dWIoZHJpdmVyLCAnZ2V0V2luZG93U2l6ZScpLnJldHVybnMoc2l6ZSk7XG4gICAgICBjb25zdCBzY3JlZW5TdHViID0gc2lub24uc3R1Yihkcml2ZXIsICdnZXRTY3JlZW5zaG90Rm9ySW1hZ2VGaW5kJykucmV0dXJucyhzY3JlZW5zaG90KTtcbiAgICAgIGNvbnN0IGNvbXBhcmVTdHViID0gc2lub24uc3R1Yihkcml2ZXIsICdjb21wYXJlSW1hZ2VzJykucmV0dXJucyh7cmVjdCwgc2NvcmV9KTtcbiAgICAgIHJldHVybiB7c2l6ZVN0dWIsIHNjcmVlblN0dWIsIGNvbXBhcmVTdHVifTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiYXNpY0ltZ0VsVmVyaWZ5IChpbWdFbFByb3RvLCBkcml2ZXIpIHtcbiAgICAgIGNvbnN0IGltZ0VsSWQgPSBpbWdFbFByb3RvLkVMRU1FTlQ7XG4gICAgICBkcml2ZXIuX2ltZ0VsQ2FjaGUuaGFzKGltZ0VsSWQpLnNob3VsZC5iZS50cnVlO1xuICAgICAgY29uc3QgaW1nRWwgPSBkcml2ZXIuX2ltZ0VsQ2FjaGUuZ2V0KGltZ0VsSWQpO1xuICAgICAgKGltZ0VsIGluc3RhbmNlb2YgSW1hZ2VFbGVtZW50KS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIGltZ0VsLnJlY3Quc2hvdWxkLmVxbChyZWN0KTtcbiAgICAgIGltZ0VsLnNjb3JlLnNob3VsZC5lcWwoc2NvcmUpO1xuICAgICAgcmV0dXJuIGltZ0VsO1xuICAgIH1cblxuICAgIGl0KCdzaG91bGQgZmluZCBhbiBpbWFnZSBlbGVtZW50IGhhcHB5cGF0aCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGQgPSBuZXcgVGVzdERyaXZlcigpO1xuICAgICAgYmFzaWNTdHViKGQpO1xuICAgICAgY29uc3QgaW1nRWxQcm90byA9IGF3YWl0IGQuZmluZEJ5SW1hZ2UodGVtcGxhdGUsIHttdWx0aXBsZTogZmFsc2V9KTtcbiAgICAgIGJhc2ljSW1nRWxWZXJpZnkoaW1nRWxQcm90bywgZCk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBmaW5kIGltYWdlIGVsZW1lbnRzIGhhcHB5cGF0aCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGQgPSBuZXcgVGVzdERyaXZlcigpO1xuICAgICAgY29uc3Qge2NvbXBhcmVTdHVifSA9IGJhc2ljU3R1YihkKTtcbiAgICAgIGNvbXBhcmVTdHViLnJldHVybnMoW3tyZWN0LCBzY29yZX1dKTtcblxuICAgICAgY29uc3QgZWxzID0gYXdhaXQgZC5maW5kQnlJbWFnZSh0ZW1wbGF0ZSwge211bHRpcGxlOiB0cnVlfSk7XG4gICAgICBlbHMuc2hvdWxkLmhhdmUubGVuZ3RoKDEpO1xuICAgICAgYmFzaWNJbWdFbFZlcmlmeShlbHNbMF0sIGQpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgZmFpbCBpZiBkcml2ZXIgZG9lcyBub3Qgc3VwcG9ydCBnZXRXaW5kb3dTaXplJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgZCA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gICAgICBhd2FpdCBkLmZpbmRCeUltYWdlKHRlbXBsYXRlLCB7bXVsdGlwbGU6IGZhbHNlfSlcbiAgICAgICAgLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgvZHJpdmVyIGRvZXMgbm90IHN1cHBvcnQvKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGZpeCB0ZW1wbGF0ZSBzaXplIGlmIHJlcXVlc3RlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGQgPSBuZXcgVGVzdERyaXZlcigpO1xuICAgICAgY29uc3QgbmV3VGVtcGxhdGUgPSAnaVZCT1JiYXonO1xuICAgICAgY29uc3Qge2NvbXBhcmVTdHVifSA9IGJhc2ljU3R1YihkKTtcbiAgICAgIGF3YWl0IGQuc2V0dGluZ3MudXBkYXRlKHtmaXhJbWFnZVRlbXBsYXRlU2l6ZTogdHJ1ZX0pO1xuICAgICAgc2lub24uc3R1YihkLCAnZW5zdXJlVGVtcGxhdGVTaXplJykucmV0dXJucyhuZXdUZW1wbGF0ZSk7XG4gICAgICBjb25zdCBpbWdFbFByb3RvID0gYXdhaXQgZC5maW5kQnlJbWFnZSh0ZW1wbGF0ZSwge211bHRpcGxlOiBmYWxzZX0pO1xuICAgICAgY29uc3QgaW1nRWwgPSBiYXNpY0ltZ0VsVmVyaWZ5KGltZ0VsUHJvdG8sIGQpO1xuICAgICAgaW1nRWwudGVtcGxhdGUuc2hvdWxkLmVxbChuZXdUZW1wbGF0ZSk7XG4gICAgICBjb21wYXJlU3R1Yi5hcmdzWzBdWzJdLnNob3VsZC5lcWwobmV3VGVtcGxhdGUpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBmaXggdGVtcGxhdGUgc2l6ZSBzY2FsZSBpZiByZXF1ZXN0ZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBkID0gbmV3IFRlc3REcml2ZXIoKTtcbiAgICAgIGNvbnN0IG5ld1RlbXBsYXRlID0gJ2lWQk9SYmF6JztcbiAgICAgIGNvbnN0IHtjb21wYXJlU3R1Yn0gPSBiYXNpY1N0dWIoZCk7XG4gICAgICBhd2FpdCBkLnNldHRpbmdzLnVwZGF0ZSh7Zml4SW1hZ2VUZW1wbGF0ZVNjYWxlOiB0cnVlfSk7XG4gICAgICBzaW5vbi5zdHViKGQsICdmaXhJbWFnZVRlbXBsYXRlU2NhbGUnKS5yZXR1cm5zKG5ld1RlbXBsYXRlKTtcbiAgICAgIGNvbnN0IGltZ0VsUHJvdG8gPSBhd2FpdCBkLmZpbmRCeUltYWdlKHRlbXBsYXRlLCB7bXVsdGlwbGU6IGZhbHNlfSk7XG4gICAgICBjb25zdCBpbWdFbCA9IGJhc2ljSW1nRWxWZXJpZnkoaW1nRWxQcm90bywgZCk7XG4gICAgICBpbWdFbC50ZW1wbGF0ZS5zaG91bGQuZXFsKG5ld1RlbXBsYXRlKTtcbiAgICAgIGNvbXBhcmVTdHViLmFyZ3NbMF1bMl0uc2hvdWxkLmVxbChuZXdUZW1wbGF0ZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBub3QgZml4IHRlbXBsYXRlIHNpemUgc2NhbGUgaWYgaXQgaXMgbm90IHJlcXVlc3RlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGQgPSBuZXcgVGVzdERyaXZlcigpO1xuICAgICAgY29uc3QgbmV3VGVtcGxhdGUgPSAnaVZCT1JiYXonO1xuICAgICAgYmFzaWNTdHViKGQpO1xuICAgICAgYXdhaXQgZC5zZXR0aW5ncy51cGRhdGUoe30pO1xuICAgICAgc2lub24uc3R1YihkLCAnZml4SW1hZ2VUZW1wbGF0ZVNjYWxlJykucmV0dXJucyhuZXdUZW1wbGF0ZSk7XG4gICAgICBkLmZpeEltYWdlVGVtcGxhdGVTY2FsZS5jYWxsQ291bnQuc2hvdWxkLmVxbCgwKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgdGVtcGxhdGUgbWF0Y2ggZmFpbHMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBkID0gbmV3IFRlc3REcml2ZXIoKTtcbiAgICAgIGNvbnN0IHtjb21wYXJlU3R1Yn0gPSBiYXNpY1N0dWIoZCk7XG4gICAgICBjb21wYXJlU3R1Yi50aHJvd3MobmV3IEVycm9yKCdDYW5ub3QgZmluZCBhbnkgb2NjdXJyZW5jZXMnKSk7XG4gICAgICBhd2FpdCBkLmZpbmRCeUltYWdlKHRlbXBsYXRlLCB7bXVsdGlwbGU6IGZhbHNlfSlcbiAgICAgICAgLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgvZWxlbWVudCBjb3VsZCBub3QgYmUgbG9jYXRlZC8pO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIGVtcHR5IGFycmF5IGZvciBtdWx0aXBsZSBlbGVtZW50cyBpZiB0ZW1wbGF0ZSBtYXRjaCBmYWlscycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGQgPSBuZXcgVGVzdERyaXZlcigpO1xuICAgICAgY29uc3Qge2NvbXBhcmVTdHVifSA9IGJhc2ljU3R1YihkKTtcbiAgICAgIGNvbXBhcmVTdHViLnRocm93cyhuZXcgRXJyb3IoJ0Nhbm5vdCBmaW5kIGFueSBvY2N1cnJlbmNlcycpKTtcbiAgICAgIGF3YWl0IGQuZmluZEJ5SW1hZ2UodGVtcGxhdGUsIHttdWx0aXBsZTogdHJ1ZX0pLnNob3VsZC5ldmVudHVhbGx5LmVxbChbXSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCByZXNwZWN0IGltcGxpY2l0IHdhaXQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBkID0gbmV3IFRlc3REcml2ZXIoKTtcbiAgICAgIGQuc2V0SW1wbGljaXRXYWl0KDEwKTtcbiAgICAgIGNvbnN0IHtjb21wYXJlU3R1Yn0gPSBiYXNpY1N0dWIoZCk7XG4gICAgICBjb21wYXJlU3R1Yi5vbkNhbGwoMCkudGhyb3dzKG5ldyBFcnJvcignQ2Fubm90IGZpbmQgYW55IG9jY3VycmVuY2VzJykpO1xuICAgICAgY29uc3QgaW1nRWxQcm90byA9IGF3YWl0IGQuZmluZEJ5SW1hZ2UodGVtcGxhdGUsIHttdWx0aXBsZTogZmFsc2V9KTtcbiAgICAgIGJhc2ljSW1nRWxWZXJpZnkoaW1nRWxQcm90bywgZCk7XG4gICAgICBjb21wYXJlU3R1Yi5jYWxsQ291bnQuc2hvdWxkLmVxbCgyKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG5vdCBhZGQgZWxlbWVudCB0byBjYWNoZSBhbmQgcmV0dXJuIGl0IGRpcmVjdGx5IHdoZW4gY2hlY2tpbmcgc3RhbGVuZXNzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgZCA9IG5ldyBUZXN0RHJpdmVyKCk7XG4gICAgICBiYXNpY1N0dWIoZCk7XG4gICAgICBjb25zdCBpbWdFbCA9IGF3YWl0IGQuZmluZEJ5SW1hZ2UodGVtcGxhdGUsIHttdWx0aXBsZTogZmFsc2UsIHNob3VsZENoZWNrU3RhbGVuZXNzOiB0cnVlfSk7XG4gICAgICAoaW1nRWwgaW5zdGFuY2VvZiBJbWFnZUVsZW1lbnQpLnNob3VsZC5iZS50cnVlO1xuICAgICAgZC5faW1nRWxDYWNoZS5oYXMoaW1nRWwuaWQpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgIGltZ0VsLnJlY3Quc2hvdWxkLmVxbChyZWN0KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2ZpeEltYWdlVGVtcGxhdGVTY2FsZScsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIG5vdCBmaXggdGVtcGxhdGUgc2l6ZSBzY2FsZSBpZiBubyBzY2FsZSB2YWx1ZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IG5ld1RlbXBsYXRlID0gJ2lWQk9SYmF6JztcbiAgICAgIGF3YWl0IGhlbHBlcnMuZml4SW1hZ2VUZW1wbGF0ZVNjYWxlKG5ld1RlbXBsYXRlLCB7Zml4SW1hZ2VUZW1wbGF0ZVNjYWxlOiB0cnVlfSlcbiAgICAgICAgLnNob3VsZC5ldmVudHVhbGx5LmVxbChuZXdUZW1wbGF0ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG5vdCBmaXggdGVtcGxhdGUgc2l6ZSBzY2FsZSBpZiBpdCBpcyBudWxsJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgbmV3VGVtcGxhdGUgPSAnaVZCT1JiYXonO1xuICAgICAgYXdhaXQgaGVscGVycy5maXhJbWFnZVRlbXBsYXRlU2NhbGUobmV3VGVtcGxhdGUsIG51bGwpXG4gICAgICAgIC5zaG91bGQuZXZlbnR1YWxseS5lcWwobmV3VGVtcGxhdGUpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgZml4IHRlbXBsYXRlIHNpemUgc2NhbGUgaWYgaXQgaXMgbm90IG51bWJlcicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IG5ld1RlbXBsYXRlID0gJ2lWQk9SYmF6JztcbiAgICAgIGF3YWl0IGhlbHBlcnMuZml4SW1hZ2VUZW1wbGF0ZVNjYWxlKG5ld1RlbXBsYXRlLCAnd3Jvbmctc2NhbGUnKVxuICAgICAgICAuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKG5ld1RlbXBsYXRlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZml4IHRlbXBsYXRlIHNpemUgc2NhbGUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBhY3R1YWwgPSAnaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFZQUFBQUdDQVlBQUFEZ3pPOUlBQUFBV0VsRVFWUjRBVTNCUVJXQVFBaEF3YS9QR0JzRWdyQzE2QUZCS0VJUFhXN09YTytSbWV5OWlRak1qSEZ6ckxVd003cWJxbUxjSEtwS1JGQlZ1RHZqNGFncTNCMVZSVVFZVDJiUzNRd1JRVlVaRi9DYUdSSEIzd2MxdlNaYkhPNStCZ0FBQUFCSlJVNUVya0pnZ2c9PSc7XG4gICAgICBhd2FpdCBoZWxwZXJzLmZpeEltYWdlVGVtcGxhdGVTY2FsZShUSU5ZX1BORywge1xuICAgICAgICBmaXhJbWFnZVRlbXBsYXRlU2NhbGU6IHRydWUsIHhTY2FsZTogMS41LCB5U2NhbGU6IDEuNVxuICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKGFjdHVhbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG5vdCBmaXggdGVtcGxhdGUgc2l6ZSBzY2FsZSBiZWNhdXNlIG9mIGZpeEltYWdlVGVtcGxhdGVTY2FsZSBpcyBmYWxzZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGF3YWl0IGhlbHBlcnMuZml4SW1hZ2VUZW1wbGF0ZVNjYWxlKFRJTllfUE5HLCB7XG4gICAgICAgIGZpeEltYWdlVGVtcGxhdGVTY2FsZTogZmFsc2UsIHhTY2FsZTogMS41LCB5U2NhbGU6IDEuNVxuICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKFRJTllfUE5HKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZml4IHRlbXBsYXRlIHNpemUgc2NhbGUgd2l0aCBkZWZhdWx0IHNjYWxlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgYWN0dWFsID0gJ2lWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCQUFBQUFRQ0FZQUFBQWY4LzloQUFBQndVbEVRVlI0QWFYQlBVc3JRUUNHMFNlWCtjQmRrVGp3VHBHMU5QZ0xwalkvZlcxc3R0NFVZbW0yY0pxd01Dc2F3NzB1SkozQ0JjOVovUDNDbCsxMlM5dTJ0RzFMMjdiRUdMbS92MmV6MmJEWmJKREVkLzd3UzRZVDd6M1gxOWZjM054d2QzZEhYZGQ0N3huSGtlZm5aOFp4cEtvcTZycW1xaXFNTWN3TUoxVlYwVFFOMHpUaG5PUGo0NE82cnNrNTAzVWRrbWlhaHFacFdLMVdHR09ZR1U3cXVxWnBHcXkxU0NMblRNNloxOWRYY3M1SVlwb21yTFZJNHVMaWdwbmhwS29xVnFzVmtqZ2NEanc5UGRGMUhUbG51cTVERXM0NUpIRTRIRGd6bkJ5UFI5N2UzcGltaVZJSzR6aHlQQjd4M2hOQ0lJVEE1ZVVsM25zV2l3Vm5ocE5TQ3NNd3NOdnRHSWFCL1g1UEtRVkpwSlNReEhxOVJoTE9PYzRNSjlNMHNkdnQyRzYzOUgzUFRCSXhSaVFoQ1VuRUdMSFdjbVk0S2FVd0RBTjkzL1A0K01oeXVTU2xoQ1JTU2tqQ09ZZTFGbXN0WjZidmUyWXZMeS9zOTN0bXkrVVNTVWhDRXBJSUlmQWQ4L0R3d096OS9aMVNDcEpJS1NHSjlYcU5KSnh6L01TMGJjdnM2dW9LU2NRWWtZUWtKQkZqeEZyTFQwemJ0c3h1YjI5SktTR0psQktTY001aHJjVmF5MDlNenBsWmpKSFB6MCs4OTRRUUNDSHdQLzd3Uy84QTRlNm5BZytSOEx3QUFBQUFTVVZPUks1Q1lJST0nO1xuICAgICAgYXdhaXQgaGVscGVycy5maXhJbWFnZVRlbXBsYXRlU2NhbGUoVElOWV9QTkcsIHtcbiAgICAgICAgZGVmYXVsdEltYWdlVGVtcGxhdGVTY2FsZTogNC4wXG4gICAgICB9KS5zaG91bGQuZXZlbnR1YWxseS5lcWwoYWN0dWFsKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZml4IHRlbXBsYXRlIHNpemUgc2NhbGUgd2l0aCBkZWZhdWx0IHNjYWxlIGFuZCBpbWFnZSBzY2FsZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGFjdHVhbCA9ICdpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQmdBQUFBWUNBWUFBQURnZHozNEFBQUNhVWxFUVZSNEFiWEJNV3ZyV0JTRjBjOUJzRlB0VzkxVVIxVTYrLy8vRktsS0t0OHFxbnlxbk1vemdna0k4eGdNajZ4MXV2K0wvNnpyeXJJc3JPdktzaXlzNjhxeUxGd3VGODduTTVmTGhmUDV6T1Z5NFh3Kzg0d1hmdGtMdjJ6aVFCSzI2YjBURVZRVnU0akFOcnZNNUhxOXNwT0VKQ1FoQ1VsSTRtamlRQksyNmIxVFZld2tZUnZiN0RLVE1RYVppVzFzMDFyRE5yYVJ4TkhFZ1NSYWExUVZPMG0wMWpqS1RES1RYZStkM2p0VnhVNFNqeVlPSkdHYm5TUnMwM3NuTThsTU1wUGI3VVpta3BsRUJGWEZUaEsyZVRSeElBbmJTTUkyVmNYMzl6ZGpETVlZWkNhWnlSaURNUVpWeFU0U3Rxa3FIazBjU0VJU2Y1S1o3REtUTVFiTHNyQ1RSR3VOM2p0VnhhT0pnNnFpcXFncXFvcXFvcW9ZWTVDWjdHd1RFZHp2ZDk3ZjM0a0lldS9ZUmhLUEpnNnFpc3drTTduZGJtUW1tVWxta3Buc2JCTVIyQ1lpbU9lWjNqdTJrY1NqaVlPcUlqUDUrdnBpMnphMmJXUGJObzVhYTdUVzJQWGU2YjNUZTZlMWhpUWVUUnhVRmJmYmpXM2JHR053dlY0WlkyQWIyN1RXc0kxdGJHTWIyN1RXc0kwa0hrMGNWQldaeWJadFhLOVhQajgvK2ZqNFlKNW5Jb0xXR3JhSkNPWjVSaEtTa0lRa0pQRm80cUNxeUV5MmJXT013ZWZuSit1NmNqcWRzTTNPTnZNOGN6NmZlY2EwcmlzL3J0Y3JtY25PTmhIQi9YN24vZjJkaUtEM2ptMGs4YXhwV1JaK1pDYVp5YzQyRVlGdElvSjVudW05WXh0SlBHdGExNVUvc1kxdGRtOXZiL1RlNmIxakcwazhhMXFXaFIrMnNVMXJqZFlhdHJHTmJXeGptOVlha25qV3RLNHJQeUtDaUtDMWhtMGlnb2pnOWZVVlNVaENFcEo0MXJRc0MwZTIyZGttSXJoY0x2eU5GLzdINlhUaWI3M3d5MTc0WmY4QUpFc2VQdGxQajEwQUFBQUFTVVZPUks1Q1lJST0nO1xuICAgICAgYXdhaXQgaGVscGVycy5maXhJbWFnZVRlbXBsYXRlU2NhbGUoVElOWV9QTkcsIHtcbiAgICAgICAgZGVmYXVsdEltYWdlVGVtcGxhdGVTY2FsZTogNC4wLFxuICAgICAgICBmaXhJbWFnZVRlbXBsYXRlU2NhbGU6IHRydWUsXG4gICAgICAgIHhTY2FsZTogMS41LCB5U2NhbGU6IDEuNVxuICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKGFjdHVhbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG5vdCBmaXggdGVtcGxhdGUgc2l6ZSBzY2FsZSB3aXRoIGRlZmF1bHQgc2NhbGUgYW5kIGltYWdlIHNjYWxlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgYWN0dWFsID0gJ2lWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCQUFBQUFRQ0FZQUFBQWY4LzloQUFBQndVbEVRVlI0QWFYQlBVc3JRUUNHMFNlWCtjQmRrVGp3VHBHMU5QZ0xwalkvZlcxc3R0NFVZbW0yY0pxd01Dc2F3NzB1SkozQ0JjOVovUDNDbCsxMlM5dTJ0RzFMMjdiRUdMbS92MmV6MmJEWmJKREVkLzd3UzRZVDd6M1gxOWZjM054d2QzZEhYZGQ0N3huSGtlZm5aOFp4cEtvcTZycW1xaXFNTWN3TUoxVlYwVFFOMHpUaG5PUGo0NE82cnNrNTAzVWRrbWlhaHFacFdLMVdHR09ZR1U3cXVxWnBHcXkxU0NMblRNNloxOWRYY3M1SVlwb21yTFZJNHVMaWdwbmhwS29xVnFzVmtqZ2NEanc5UGRGMUhUbG51cTVERXM0NUpIRTRIRGd6bkJ5UFI5N2UzcGltaVZJSzR6aHlQQjd4M2hOQ0lJVEE1ZVVsM25zV2l3Vm5ocE5TQ3NNd3NOdnRHSWFCL1g1UEtRVkpwSlNReEhxOVJoTE9PYzRNSjlNMHNkdnQyRzYzOUgzUFRCSXhSaVFoQ1VuRUdMSFdjbVk0S2FVd0RBTjkzL1A0K01oeXVTU2xoQ1JTU2tqQ09ZZTFGbXN0WjZidmUyWXZMeS9zOTN0bXkrVVNTVWhDRXBJSUlmQWQ4L0R3d096OS9aMVNDcEpJS1NHSjlYcU5KSnh6L01TMGJjdnM2dW9LU2NRWWtZUWtKQkZqeEZyTFQwemJ0c3h1YjI5SktTR0psQktTY001aHJjVmF5MDlNenBsWmpKSFB6MCs4OTRRUUNDSHdQLzd3Uy84QTRlNm5BZytSOEx3QUFBQUFTVVZPUks1Q1lJST0nO1xuICAgICAgYXdhaXQgaGVscGVycy5maXhJbWFnZVRlbXBsYXRlU2NhbGUoVElOWV9QTkcsIHtcbiAgICAgICAgZGVmYXVsdEltYWdlVGVtcGxhdGVTY2FsZTogNC4wLFxuICAgICAgICBmaXhJbWFnZVRlbXBsYXRlU2NhbGU6IGZhbHNlLFxuICAgICAgICB4U2NhbGU6IDEuNSwgeVNjYWxlOiAxLjVcbiAgICAgIH0pLnNob3VsZC5ldmVudHVhbGx5LmVxbChhY3R1YWwpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgZml4IHRlbXBsYXRlIHNpemUgc2NhbGUgYmVjYXVzZSBvZiBpZ25vcmVEZWZhdWx0SW1hZ2VUZW1wbGF0ZVNjYWxlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgaGVscGVycy5maXhJbWFnZVRlbXBsYXRlU2NhbGUoVElOWV9QTkcsIHtcbiAgICAgICAgZGVmYXVsdEltYWdlVGVtcGxhdGVTY2FsZTogNC4wLFxuICAgICAgICBpZ25vcmVEZWZhdWx0SW1hZ2VUZW1wbGF0ZVNjYWxlOiB0cnVlLFxuICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKFRJTllfUE5HKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaWdub3JlIGRlZmF1bHRJbWFnZVRlbXBsYXRlU2NhbGUgdG8gZml4IHRlbXBsYXRlIHNpemUgc2NhbGUgYmVjYXVzZSBvZiBpZ25vcmVEZWZhdWx0SW1hZ2VUZW1wbGF0ZVNjYWxlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgYWN0dWFsID0gJ2lWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBWUFBQUFHQ0FZQUFBRGd6TzlJQUFBQVdFbEVRVlI0QVUzQlFSV0FRQWhBd2EvUEdCc0VnckMxNkFGQktFSVBYVzdPWE8rUm1leTlpUWpNakhGenJMVXdNN3FicW1MY0hLcEtSRkJWdUR2ajRhZ3EzQjFWUlVRWVQyYlMzUXdSUVZVWkYvQ2FHUkhCM3djMXZTWmJITzUrQmdBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuICAgICAgYXdhaXQgaGVscGVycy5maXhJbWFnZVRlbXBsYXRlU2NhbGUoVElOWV9QTkcsIHtcbiAgICAgICAgZGVmYXVsdEltYWdlVGVtcGxhdGVTY2FsZTogNC4wLFxuICAgICAgICBpZ25vcmVEZWZhdWx0SW1hZ2VUZW1wbGF0ZVNjYWxlOiB0cnVlLFxuICAgICAgICBmaXhJbWFnZVRlbXBsYXRlU2NhbGU6IHRydWUsXG4gICAgICAgIHhTY2FsZTogMS41LCB5U2NhbGU6IDEuNVxuICAgICAgfSkuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKGFjdHVhbCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdlbnN1cmVUZW1wbGF0ZVNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBub3QgcmVzaXplIHRoZSB0ZW1wbGF0ZSBpZiBpdCBpcyBzbWFsbGVyIHRoYW4gdGhlIHNjcmVlbicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHNjcmVlbiA9IFRJTllfUE5HX0RJTVMubWFwKChuKSA9PiBuICogMik7XG4gICAgICBjb25zdCBkID0gbmV3IFRlc3REcml2ZXIoKTtcbiAgICAgIGF3YWl0IGQuZW5zdXJlVGVtcGxhdGVTaXplKFRJTllfUE5HLCAuLi5zY3JlZW4pXG4gICAgICAgIC5zaG91bGQuZXZlbnR1YWxseS5lcWwoVElOWV9QTkcpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgbm90IHJlc2l6ZSB0aGUgdGVtcGxhdGUgaWYgaXQgaXMgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgc2NyZWVuJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgZCA9IG5ldyBUZXN0RHJpdmVyKCk7XG4gICAgICBhd2FpdCBkLmVuc3VyZVRlbXBsYXRlU2l6ZShUSU5ZX1BORywgLi4uVElOWV9QTkdfRElNUylcbiAgICAgICAgLnNob3VsZC5ldmVudHVhbGx5LmVxbChUSU5ZX1BORyk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCByZXNpemUgdGhlIHRlbXBsYXRlIGlmIGl0IGlzIGJpZ2dlciB0aGFuIHRoZSBzY3JlZW4nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBkID0gbmV3IFRlc3REcml2ZXIoKTtcbiAgICAgIGNvbnN0IHNjcmVlbiA9IFRJTllfUE5HX0RJTVMubWFwKChuKSA9PiBuIC8gMik7XG4gICAgICBjb25zdCBuZXdUZW1wbGF0ZSA9IGF3YWl0IGQuZW5zdXJlVGVtcGxhdGVTaXplKFRJTllfUE5HLCAuLi5zY3JlZW4pO1xuICAgICAgbmV3VGVtcGxhdGUuc2hvdWxkLm5vdC5lcWwoVElOWV9QTkcpO1xuICAgICAgbmV3VGVtcGxhdGUubGVuZ3RoLnNob3VsZC5iZS5iZWxvdyhUSU5ZX1BORy5sZW5ndGgpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0U2NyZWVuc2hvdEZvckltYWdlRmluZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGZhaWwgaWYgZHJpdmVyIGRvZXMgbm90IHN1cHBvcnQgZ2V0U2NyZWVuc2hvdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGQgPSBuZXcgQmFzZURyaXZlcigpO1xuICAgICAgYXdhaXQgZC5nZXRTY3JlZW5zaG90Rm9ySW1hZ2VGaW5kKClcbiAgICAgICAgLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgvZHJpdmVyIGRvZXMgbm90IHN1cHBvcnQvKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG5vdCBhZGp1c3Qgb3IgdmVyaWZ5IHNjcmVlbnNob3QgaWYgYXNrZWQgbm90IHRvIGJ5IHNldHRpbmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgZCA9IG5ldyBUZXN0RHJpdmVyKCk7XG4gICAgICBzaW5vbi5zdHViKGQsICdnZXRTY3JlZW5zaG90JykucmV0dXJucyhUSU5ZX1BORyk7XG4gICAgICBkLnNldHRpbmdzLnVwZGF0ZSh7Zml4SW1hZ2VGaW5kU2NyZWVuc2hvdERpbXM6IGZhbHNlfSk7XG4gICAgICBjb25zdCBzY3JlZW4gPSBUSU5ZX1BOR19ESU1TLm1hcCgobikgPT4gbiArIDEpO1xuICAgICAgY29uc3Qge2I2NFNjcmVlbnNob3QsIHNjYWxlfSA9IGF3YWl0IGQuZ2V0U2NyZWVuc2hvdEZvckltYWdlRmluZCguLi5zY3JlZW4pO1xuICAgICAgYjY0U2NyZWVuc2hvdC5zaG91bGQuZXFsKFRJTllfUE5HKTtcbiAgICAgIHNob3VsZC5lcXVhbChzY2FsZSwgdW5kZWZpbmVkKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBzY3JlZW5zaG90IHdpdGhvdXQgYWRqdXN0bWVudCBpZiBpdCBtYXRjaGVzIHNjcmVlbiBzaXplJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgZCA9IG5ldyBUZXN0RHJpdmVyKCk7XG4gICAgICBzaW5vbi5zdHViKGQsICdnZXRTY3JlZW5zaG90JykucmV0dXJucyhUSU5ZX1BORyk7XG4gICAgICBjb25zdCB7YjY0U2NyZWVuc2hvdCwgc2NhbGV9ID0gYXdhaXQgZC5nZXRTY3JlZW5zaG90Rm9ySW1hZ2VGaW5kKC4uLlRJTllfUE5HX0RJTVMpO1xuICAgICAgYjY0U2NyZWVuc2hvdC5zaG91bGQuZXFsKFRJTllfUE5HKTtcbiAgICAgIHNob3VsZC5lcXVhbChzY2FsZSwgdW5kZWZpbmVkKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBzY2FsZWQgc2NyZWVuc2hvdCB3aXRoIHNhbWUgYXNwZWN0IHJhdGlvIGlmIG1hdGNoaW5nIHNjcmVlbiBhc3BlY3QgcmF0aW8nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBkID0gbmV3IFRlc3REcml2ZXIoKTtcbiAgICAgIHNpbm9uLnN0dWIoZCwgJ2dldFNjcmVlbnNob3QnKS5yZXR1cm5zKFRJTllfUE5HKTtcbiAgICAgIGNvbnN0IHNjcmVlbiA9IFRJTllfUE5HX0RJTVMubWFwKChuKSA9PiBuICogMS41KTtcbiAgICAgIGNvbnN0IHtiNjRTY3JlZW5zaG90LCBzY2FsZX0gPSBhd2FpdCBkLmdldFNjcmVlbnNob3RGb3JJbWFnZUZpbmQoLi4uc2NyZWVuKTtcbiAgICAgIGI2NFNjcmVlbnNob3Quc2hvdWxkLm5vdC5lcWwoVElOWV9QTkcpO1xuICAgICAgY29uc3Qgc2NyZWVuc2hvdE9iaiA9IGF3YWl0IGltYWdlVXRpbC5nZXRKaW1wSW1hZ2UoYjY0U2NyZWVuc2hvdCk7XG4gICAgICBzY3JlZW5zaG90T2JqLmJpdG1hcC53aWR0aC5zaG91bGQuZXFsKHNjcmVlblswXSk7XG4gICAgICBzY3JlZW5zaG90T2JqLmJpdG1hcC5oZWlnaHQuc2hvdWxkLmVxbChzY3JlZW5bMV0pO1xuICAgICAgc2NhbGUuc2hvdWxkLmVxbCh7IHhTY2FsZTogMS41LCB5U2NhbGU6IDEuNSB9KTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBzY2FsZWQgc2NyZWVuc2hvdCB3aXRoIGRpZmZlcmVudCBhc3BlY3QgcmF0aW8gaWYgbm90IG1hdGNoaW5nIHNjcmVlbiBhc3BlY3QgcmF0aW8nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBkID0gbmV3IFRlc3REcml2ZXIoKTtcbiAgICAgIHNpbm9uLnN0dWIoZCwgJ2dldFNjcmVlbnNob3QnKS5yZXR1cm5zKFRJTllfUE5HKTtcblxuICAgICAgLy8gdHJ5IGZpcnN0IHdpdGggcG9ydHJhaXQgc2NyZWVuLCBzY3JlZW4gPSA4IHggMTJcbiAgICAgIGxldCBzY3JlZW4gPSBbVElOWV9QTkdfRElNU1swXSAqIDIsIFRJTllfUE5HX0RJTVNbMV0gKiAzXTtcbiAgICAgIGxldCBleHBlY3RlZFNjYWxlID0geyB4U2NhbGU6IDIuNjcsIHlTY2FsZTogNCB9O1xuXG4gICAgICBjb25zdCB7YjY0U2NyZWVuc2hvdCwgc2NhbGV9ID0gYXdhaXQgZC5nZXRTY3JlZW5zaG90Rm9ySW1hZ2VGaW5kKC4uLnNjcmVlbik7XG4gICAgICBiNjRTY3JlZW5zaG90LnNob3VsZC5ub3QuZXFsKFRJTllfUE5HKTtcbiAgICAgIGxldCBzY3JlZW5zaG90T2JqID0gYXdhaXQgaW1hZ2VVdGlsLmdldEppbXBJbWFnZShiNjRTY3JlZW5zaG90KTtcbiAgICAgIHNjcmVlbnNob3RPYmouYml0bWFwLndpZHRoLnNob3VsZC5lcWwoc2NyZWVuWzBdKTtcbiAgICAgIHNjcmVlbnNob3RPYmouYml0bWFwLmhlaWdodC5zaG91bGQuZXFsKHNjcmVlblsxXSk7XG4gICAgICBzY2FsZS54U2NhbGUudG9GaXhlZCgyKS5zaG91bGQuZXFsKGV4cGVjdGVkU2NhbGUueFNjYWxlLnRvU3RyaW5nKCkpO1xuICAgICAgc2NhbGUueVNjYWxlLnNob3VsZC5lcWwoZXhwZWN0ZWRTY2FsZS55U2NhbGUpO1xuXG4gICAgICAvLyB0aGVuIHdpdGggbGFuZHNjYXBlIHNjcmVlbiwgc2NyZWVuID0gMTIgeCA4XG4gICAgICBzY3JlZW4gPSBbVElOWV9QTkdfRElNU1swXSAqIDMsIFRJTllfUE5HX0RJTVNbMV0gKiAyXTtcbiAgICAgIGV4cGVjdGVkU2NhbGUgPSB7IHhTY2FsZTogNCwgeVNjYWxlOiAyLjY3IH07XG5cbiAgICAgIGNvbnN0IHtiNjRTY3JlZW5zaG90OiBuZXdTY3JlZW4sIHNjYWxlOiBuZXdTY2FsZX0gPSBhd2FpdCBkLmdldFNjcmVlbnNob3RGb3JJbWFnZUZpbmQoLi4uc2NyZWVuKTtcbiAgICAgIG5ld1NjcmVlbi5zaG91bGQubm90LmVxbChUSU5ZX1BORyk7XG4gICAgICBzY3JlZW5zaG90T2JqID0gYXdhaXQgaW1hZ2VVdGlsLmdldEppbXBJbWFnZShuZXdTY3JlZW4pO1xuICAgICAgc2NyZWVuc2hvdE9iai5iaXRtYXAud2lkdGguc2hvdWxkLmVxbChzY3JlZW5bMF0pO1xuICAgICAgc2NyZWVuc2hvdE9iai5iaXRtYXAuaGVpZ2h0LnNob3VsZC5lcWwoc2NyZWVuWzFdKTtcbiAgICAgIG5ld1NjYWxlLnhTY2FsZS5zaG91bGQuZXFsKGV4cGVjdGVkU2NhbGUueFNjYWxlKTtcbiAgICAgIG5ld1NjYWxlLnlTY2FsZS50b0ZpeGVkKDIpLnNob3VsZC5lcWwoZXhwZWN0ZWRTY2FsZS55U2NhbGUudG9TdHJpbmcoKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBzY2FsZWQgc2NyZWVuc2hvdCB3aXRoIGRpZmZlcmVudCBhc3BlY3QgcmF0aW8gaWYgbm90IG1hdGNoaW5nIHNjcmVlbiBhc3BlY3QgcmF0aW8gd2l0aCBmaXhJbWFnZVRlbXBsYXRlU2NhbGUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBkID0gbmV3IFRlc3REcml2ZXIoKTtcbiAgICAgIHNpbm9uLnN0dWIoZCwgJ2dldFNjcmVlbnNob3QnKS5yZXR1cm5zKFRJTllfUE5HKTtcblxuICAgICAgLy8gdHJ5IGZpcnN0IHdpdGggcG9ydHJhaXQgc2NyZWVuLCBzY3JlZW4gPSA4IHggMTJcbiAgICAgIGxldCBzY3JlZW4gPSBbVElOWV9QTkdfRElNU1swXSAqIDIsIFRJTllfUE5HX0RJTVNbMV0gKiAzXTtcbiAgICAgIGxldCBleHBlY3RlZFNjYWxlID0geyB4U2NhbGU6IDIuNjcsIHlTY2FsZTogNCB9O1xuXG4gICAgICBjb25zdCB7YjY0U2NyZWVuc2hvdCwgc2NhbGV9ID0gYXdhaXQgZC5nZXRTY3JlZW5zaG90Rm9ySW1hZ2VGaW5kKC4uLnNjcmVlbik7XG4gICAgICBiNjRTY3JlZW5zaG90LnNob3VsZC5ub3QuZXFsKFRJTllfUE5HKTtcbiAgICAgIGxldCBzY3JlZW5zaG90T2JqID0gYXdhaXQgaW1hZ2VVdGlsLmdldEppbXBJbWFnZShiNjRTY3JlZW5zaG90KTtcbiAgICAgIHNjcmVlbnNob3RPYmouYml0bWFwLndpZHRoLnNob3VsZC5lcWwoc2NyZWVuWzBdKTtcbiAgICAgIHNjcmVlbnNob3RPYmouYml0bWFwLmhlaWdodC5zaG91bGQuZXFsKHNjcmVlblsxXSk7XG4gICAgICBzY2FsZS54U2NhbGUudG9GaXhlZCgyKS5zaG91bGQuZXFsKGV4cGVjdGVkU2NhbGUueFNjYWxlLnRvU3RyaW5nKCkpO1xuICAgICAgc2NhbGUueVNjYWxlLnNob3VsZC5lcWwoZXhwZWN0ZWRTY2FsZS55U2NhbGUpO1xuICAgICAgLy8gOCB4IDEyIHN0cmV0Y2hlZCBUSU5ZX1BOR1xuICAgICAgYXdhaXQgaGVscGVycy5maXhJbWFnZVRlbXBsYXRlU2NhbGUoYjY0U2NyZWVuc2hvdCwge2ZpeEltYWdlVGVtcGxhdGVTY2FsZTogdHJ1ZSwgc2NhbGV9KVxuICAgICAgICAuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKCdpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQWdBQUFBTUNBWUFBQUJmbnZ5ZEFBQUFKMGxFUVZSNEFZWEJBUUVBSUFDRE1LUi9wMGZUQnJLZGJaY1BDUklrU0pBZ1FZSUVDUklrUEF6QkExVHBlTndaQUFBQUFFbEZUa1N1UW1DQycpO1xuXG4gICAgICAvLyB0aGVuIHdpdGggbGFuZHNjYXBlIHNjcmVlbiwgc2NyZWVuID0gMTIgeCA4XG4gICAgICBzY3JlZW4gPSBbVElOWV9QTkdfRElNU1swXSAqIDMsIFRJTllfUE5HX0RJTVNbMV0gKiAyXTtcbiAgICAgIGV4cGVjdGVkU2NhbGUgPSB7IHhTY2FsZTogNCwgeVNjYWxlOiAyLjY3IH07XG5cbiAgICAgIGNvbnN0IHtiNjRTY3JlZW5zaG90OiBuZXdTY3JlZW4sIHNjYWxlOiBuZXdTY2FsZX0gPSBhd2FpdCBkLmdldFNjcmVlbnNob3RGb3JJbWFnZUZpbmQoLi4uc2NyZWVuKTtcbiAgICAgIG5ld1NjcmVlbi5zaG91bGQubm90LmVxbChUSU5ZX1BORyk7XG4gICAgICBzY3JlZW5zaG90T2JqID0gYXdhaXQgaW1hZ2VVdGlsLmdldEppbXBJbWFnZShuZXdTY3JlZW4pO1xuICAgICAgc2NyZWVuc2hvdE9iai5iaXRtYXAud2lkdGguc2hvdWxkLmVxbChzY3JlZW5bMF0pO1xuICAgICAgc2NyZWVuc2hvdE9iai5iaXRtYXAuaGVpZ2h0LnNob3VsZC5lcWwoc2NyZWVuWzFdKTtcbiAgICAgIG5ld1NjYWxlLnhTY2FsZS5zaG91bGQuZXFsKGV4cGVjdGVkU2NhbGUueFNjYWxlKTtcbiAgICAgIG5ld1NjYWxlLnlTY2FsZS50b0ZpeGVkKDIpLnNob3VsZC5lcWwoZXhwZWN0ZWRTY2FsZS55U2NhbGUudG9TdHJpbmcoKSk7XG4gICAgICAvLyAxMiB4IDggc3RyZXRjaGVkIFRJTllfUE5HXG4gICAgICBhd2FpdCBoZWxwZXJzLmZpeEltYWdlVGVtcGxhdGVTY2FsZShuZXdTY3JlZW4sIHtmaXhJbWFnZVRlbXBsYXRlU2NhbGU6IHRydWUsIHNjYWxlfSlcbiAgICAgICAgLnNob3VsZC5ldmVudHVhbGx5LmVxbCgnaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUF3QUFBQUlDQVlBQUFETjVCN3hBQUFBSTBsRVFWUjRBWlhCQVFFQU1BeURNSTUvVDVXMmF5QjUyNDVBSW9ra2trZ2lpU1Q2K1c0RFRMeW81UFVBQUFBQVNVVk9SSzVDWUlJPScpO1xuICAgIH0pO1xuXG4gIH0pO1xufSk7XG5cbmRlc2NyaWJlKCdjdXN0b20gZWxlbWVudCBmaW5kaW5nIHBsdWdpbnMnLCBmdW5jdGlvbiAoKSB7XG4gIC8vIGhhcHB5c1xuICBpdCgnc2hvdWxkIGZpbmQgYSBzaW5nbGUgZWxlbWVudCB1c2luZyBhIGN1c3RvbSBmaW5kZXInLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZCA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gICAgZC5vcHRzLmN1c3RvbUZpbmRNb2R1bGVzID0ge2Y6IENVU1RPTV9GSU5EX01PRFVMRX07XG4gICAgYXdhaXQgZC5maW5kRWxlbWVudChDVVNUT01fU1RSQVRFR1ksICdmOmZvbycpLnNob3VsZC5ldmVudHVhbGx5LmVxbCgnYmFyJyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIG5vdCByZXF1aXJlIHNlbGVjdG9yIHByZWZpeCBpZiBvbmx5IG9uZSBmaW5kIHBsdWdpbiBpcyByZWdpc3RlcmVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IGQgPSBuZXcgQmFzZURyaXZlcigpO1xuICAgIGQub3B0cy5jdXN0b21GaW5kTW9kdWxlcyA9IHtmOiBDVVNUT01fRklORF9NT0RVTEV9O1xuICAgIGF3YWl0IGQuZmluZEVsZW1lbnQoQ1VTVE9NX1NUUkFURUdZLCAnZm9vJykuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKCdiYXInKTtcbiAgfSk7XG4gIGl0KCdzaG91bGQgZmluZCBtdWx0aXBsZSBlbGVtZW50cyB1c2luZyBhIGN1c3RvbSBmaW5kZXInLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZCA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gICAgZC5vcHRzLmN1c3RvbUZpbmRNb2R1bGVzID0ge2Y6IENVU1RPTV9GSU5EX01PRFVMRX07XG4gICAgYXdhaXQgZC5maW5kRWxlbWVudHMoQ1VTVE9NX1NUUkFURUdZLCAnZjpmb29zJykuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKFsnYmF6MScsICdiYXoyJ10pO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBnaXZlIGEgaGludCB0byB0aGUgcGx1Z2luIGFib3V0IHdoZXRoZXIgbXVsdGlwbGUgYXJlIHJlcXVlc3RlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBkID0gbmV3IEJhc2VEcml2ZXIoKTtcbiAgICBkLm9wdHMuY3VzdG9tRmluZE1vZHVsZXMgPSB7ZjogQ1VTVE9NX0ZJTkRfTU9EVUxFfTtcbiAgICBhd2FpdCBkLmZpbmRFbGVtZW50KENVU1RPTV9TVFJBVEVHWSwgJ2Y6Zm9vcycpLnNob3VsZC5ldmVudHVhbGx5LmVxbCgnYmFyMScpO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIHVzZSBtdWx0aXBsZSBmaW5kIG1vZHVsZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZCA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gICAgZC5vcHRzLmN1c3RvbUZpbmRNb2R1bGVzID0ge2Y6IENVU1RPTV9GSU5EX01PRFVMRSwgZzogQ1VTVE9NX0ZJTkRfTU9EVUxFfTtcbiAgICBhd2FpdCBkLmZpbmRFbGVtZW50KENVU1RPTV9TVFJBVEVHWSwgJ2Y6Zm9vJykuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKCdiYXInKTtcbiAgICBhd2FpdCBkLmZpbmRFbGVtZW50KENVU1RPTV9TVFJBVEVHWSwgJ2c6Zm9vJykuc2hvdWxkLmV2ZW50dWFsbHkuZXFsKCdiYXInKTtcbiAgfSk7XG5cbiAgLy8gZXJyb3JzXG4gIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgY3VzdG9tRmluZE1vZHVsZXMgaXMgbm90IHNldCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBkID0gbmV3IEJhc2VEcml2ZXIoKTtcbiAgICBhd2FpdCBkLmZpbmRFbGVtZW50KENVU1RPTV9TVFJBVEVHWSwgJ2Y6Zm9vJykuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC9jdXN0b21GaW5kTW9kdWxlcy8pO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciBpZiBjdXN0b21GaW5kTW9kdWxlcyBpcyB0aGUgd3Jvbmcgc2hhcGUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZCA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gICAgZC5vcHRzLmN1c3RvbUZpbmRNb2R1bGVzID0gQ1VTVE9NX0ZJTkRfTU9EVUxFO1xuICAgIGF3YWl0IGQuZmluZEVsZW1lbnQoQ1VTVE9NX1NUUkFURUdZLCAnZjpmb28nKS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZFdpdGgoL2N1c3RvbUZpbmRNb2R1bGVzLyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIGlmIGN1c3RvbUZpbmRNb2R1bGVzIGlzIHNpemUgPiAxIGFuZCBubyBzZWxlY3RvciBwcmVmaXggaXMgdXNlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBkID0gbmV3IEJhc2VEcml2ZXIoKTtcbiAgICBkLm9wdHMuY3VzdG9tRmluZE1vZHVsZXMgPSB7ZjogQ1VTVE9NX0ZJTkRfTU9EVUxFLCBnOiBDVVNUT01fRklORF9NT0RVTEV9O1xuICAgIGF3YWl0IGQuZmluZEVsZW1lbnQoQ1VTVE9NX1NUUkFURUdZLCAnZm9vJykuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC9tdWx0aXBsZSBlbGVtZW50IGZpbmRpbmcvaSk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIGluIGF0dGVtcHQgdG8gdXNlIHVucmVnaXN0ZXJlZCBwbHVnaW4nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZCA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gICAgZC5vcHRzLmN1c3RvbUZpbmRNb2R1bGVzID0ge2Y6IENVU1RPTV9GSU5EX01PRFVMRSwgZzogQ1VTVE9NX0ZJTkRfTU9EVUxFfTtcbiAgICBhd2FpdCBkLmZpbmRFbGVtZW50KENVU1RPTV9TVFJBVEVHWSwgJ3o6Zm9vJykuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC93YXMgbm90IHJlZ2lzdGVyZWQvKTtcbiAgfSk7XG4gIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgcGx1Z2luIGNhbm5vdCBiZSBsb2FkZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgZCA9IG5ldyBCYXNlRHJpdmVyKCk7XG4gICAgZC5vcHRzLmN1c3RvbUZpbmRNb2R1bGVzID0ge2Y6ICcuL2Zvby5qcyd9O1xuICAgIGF3YWl0IGQuZmluZEVsZW1lbnQoQ1VTVE9NX1NUUkFURUdZLCAnZjpmb28nKS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZFdpdGgoL2NvdWxkIG5vdCBsb2FkL2kpO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciBpZiBwbHVnaW4gaXMgbm90IHRoZSByaWdodCBzaGFwZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBkID0gbmV3IEJhc2VEcml2ZXIoKTtcbiAgICBkLm9wdHMuY3VzdG9tRmluZE1vZHVsZXMgPSB7ZjogQkFEX0NVU1RPTV9GSU5EX01PRFVMRX07XG4gICAgYXdhaXQgZC5maW5kRWxlbWVudChDVVNUT01fU1RSQVRFR1ksICdmOmZvbycpLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgvY29uc3RydWN0ZWQgY29ycmVjdGx5L2kpO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBwYXNzIG9uIGFuIGVycm9yIHRocm93biBieSB0aGUgZmluZGVyIGl0c2VsZicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBkID0gbmV3IEJhc2VEcml2ZXIoKTtcbiAgICBkLm9wdHMuY3VzdG9tRmluZE1vZHVsZXMgPSB7ZjogQ1VTVE9NX0ZJTkRfTU9EVUxFfTtcbiAgICBhd2FpdCBkLmZpbmRFbGVtZW50KENVU1RPTV9TVFJBVEVHWSwgJ2Y6ZXJyb3InKS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZFdpdGgoL3BsdWdpbiBlcnJvci9pKTtcbiAgfSk7XG4gIGl0KCdzaG91bGQgdGhyb3cgbm8gc3VjaCBlbGVtZW50IGVycm9yIGlmIGVsZW1lbnQgbm90IGZvdW5kJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IGQgPSBuZXcgQmFzZURyaXZlcigpO1xuICAgIGQub3B0cy5jdXN0b21GaW5kTW9kdWxlcyA9IHtmOiBDVVNUT01fRklORF9NT0RVTEV9O1xuICAgIGF3YWl0IGQuZmluZEVsZW1lbnQoQ1VTVE9NX1NUUkFURUdZLCAnZjpub3BlJykuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC9jb3VsZCBub3QgYmUgbG9jYXRlZC8pO1xuICB9KTtcbn0pO1xuIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUEsSUFBQUEsS0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsS0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsZUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsTUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksQ0FBQSxHQUFBSixPQUFBO0FBRUEsSUFBQUssS0FBQSxHQUFBTCxPQUFBO0FBQ0EsSUFBQU0sYUFBQSxHQUFBTixPQUFBO0FBR0EsTUFBTU8sTUFBTSxHQUFHQyxhQUFJLENBQUNELE1BQU0sQ0FBQyxDQUFDO0FBQzVCQyxhQUFJLENBQUNDLEdBQUcsQ0FBQ0MsdUJBQWMsQ0FBQztBQUd4QixNQUFNQyxVQUFVLFNBQVNDLFlBQVUsQ0FBQztFQUNsQyxNQUFNQyxhQUFhQSxDQUFBLEVBQUksQ0FBQztFQUN4QixNQUFNQyxhQUFhQSxDQUFBLEVBQUksQ0FBQztBQUMxQjtBQUVBLE1BQU1DLGtCQUFrQixHQUFHQyxhQUFJLENBQUNDLE9BQU8sQ0FBQ0MsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFDdkUsTUFBTSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsdUJBQXVCLENBQUM7QUFDNUQsTUFBTUMsc0JBQXNCLEdBQUdILGFBQUksQ0FBQ0MsT0FBTyxDQUFDQyxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUMzRSxNQUFNLEVBQUUsWUFB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
