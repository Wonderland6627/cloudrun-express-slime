const test = require('node:test');
const assert = require('node:assert/strict');

const { isBlockedPath, normalizeUrlPath } = require('../middlewares/botFilter');
const { errorHandler } = require('../middlewares/errorHandler');

function createRequest(options = {}) {
  return {
    method: options.method || 'GET',
    url: options.url || '/',
    originalUrl: options.url || '/',
    rawPath: options.rawPath || options.url || '/',
    normalizedPath: options.normalizedPath,
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    body: options.body || {},
    query: {},
    params: {},
    get(headerName) {
      if (String(headerName).toLowerCase() === 'user-agent') {
        return options.userAgent || 'Mozilla/5.0 Test Browser';
      }

      return undefined;
    }
  };
}

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };
}

test('normalizeUrlPath collapses repeated slashes', () => {
  assert.equal(
    normalizeUrlPath('//wp-includes///wlwmanifest.xml'),
    '/wp-includes/wlwmanifest.xml'
  );
});

test('isBlockedPath catches normalized secret and config probes', () => {
  assert.equal(isBlockedPath('//.aws/credentials'), true);
  assert.equal(isBlockedPath('/config/aws.yml'), true);
  assert.equal(isBlockedPath('/www/.env.production'), true);
});

test('errorHandler downgrades leaked probe exceptions to 404', () => {
  const req = createRequest({
    url: '//wp-includes/wlwmanifest.xml',
    normalizedPath: normalizeUrlPath('//wp-includes/wlwmanifest.xml')
  });
  const res = createResponse();

  errorHandler(new Error('unexpected probe error'), req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.msg, 'Not Found');
});

test('errorHandler preserves 500 for real api exceptions', () => {
  const req = createRequest({
    method: 'POST',
    url: '/api/minigame/getUserGameInfoV2',
    normalizedPath: '/api/minigame/getUserGameInfoV2'
  });
  const res = createResponse();

  errorHandler(new Error('database unavailable'), req, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.equal(typeof res.payload.msg, 'string');
});
