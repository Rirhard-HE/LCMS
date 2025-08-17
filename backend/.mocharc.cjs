// backend/.mocharc.cjs
module.exports = {
  require: ['./test/setup.cjs'],   // 预加载你的测试初始化
  recursive: true,
  timeout: 30000,
  exit: true,
};
