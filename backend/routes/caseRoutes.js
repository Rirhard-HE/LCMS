// routes/caseRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createCase,
  getCases,
  updateCase,
  deleteCase,
} = require('../controllers/caseController');

// 列表 + 创建
router.route('/')
  .get(protect, getCases)
  .post(protect, createCase);

// 更新 + 删除
router.route('/:id')
  .put(protect, updateCase)
  .delete(protect, deleteCase);

module.exports = router; // ✅ 一定要这样导出
