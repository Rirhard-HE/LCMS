const request = require('supertest');
const { expect } = require('chai');
const app = require('../server'); // 你的 server.js 必须 module.exports = app

describe('LCMS app sanity', function () {
  it('should export an Express app function', function () {
    expect(app).to.be.a('function');
  });

  it('should return 404 or 401 for an unknown route', async function () {
    const res = await request(app).get('/__not_exists__');
    expect([401, 404]).to.include(res.status);
  });
});
