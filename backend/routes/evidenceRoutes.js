const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadEvidence,
  getEvidenceList,
  getEvidenceById,
  updateEvidence,
  deleteEvidence,
  downloadEvidence,
} = require('../controllers/evidenceController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
  .get(protect, getEvidenceList)                       // 列表 ?caseId=&q=
  .post(protect, upload.single('file'), uploadEvidence);

router.route('/:id')
  .get(protect, getEvidenceById)                       // 详情
  .put(protect, updateEvidence)                        // 更新元数据
  .delete(protect, deleteEvidence);                    // 删除（含 GridFS）

router.get('/:id/download', protect, downloadEvidence);

module.exports = router;
