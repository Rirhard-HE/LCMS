// backend/.mocharc.cjs
module.exports = {
  require: ['./test/setup.js'],
  spec: ['test/**/*.test.js', 'test/**/*.spec.js'],
  recursive: true,
  timeout: 30000,
  exit: true,
  color: true
};
