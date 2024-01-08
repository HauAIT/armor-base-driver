import B from 'bluebird';

B.config({
  cancellation: true,
});

// BaseDriver exports
// eslint-disable-next-line
import {BaseDriver} from './basedriver/driver';
// eslint-disable-next-line
export {DriverCore} from './basedriver/core';
export {DeviceSettings} from './basedriver/device-settings';

export {BaseDriver};
export default BaseDriver;

// MJSONWP exports
export * from './protocol';
export {errorFromMJSONWPStatusCode as errorFromCode} from './protocol';
// eslint-disable-next-line
export {DEFAULT_BASE_PATH, PROTOCOLS, W3C_ELEMENT_KEY} from './constants';

// Express exports
export {STATIC_DIR} from './express/static';
export {server, normalizeBasePath} from './express/server';

// jsonwp-proxy exports
export {JWProxy} from './jsonwp-proxy/proxy';

// jsonwp-status exports
export {getSummaryByCode, codes as statusCodes} from './jsonwp-status/status';

// W3C capabilities parser
export {
  PREFIXED_ARMOR_OPTS_CAP,
  STANDARD_CAPS,
  processCapabilities,
  isStandardCap,
  validateCaps,
  promoteArmorOptions,
  promoteArmorOptionsForObject,
} from './basedriver/capabilities';

// Web socket helpers
export {DEFAULT_WS_PATHNAME_PREFIX} from './express/websocket';

/**
 * @typedef {import('./express/server').ServerOpts} ServerOpts
 */
