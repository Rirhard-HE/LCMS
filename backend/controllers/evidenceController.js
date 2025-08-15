const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const Evidence = require('../models/Evidence');

const getBucket = () =>
  new GridFSBucket(mongoose.connection.db, { bucketName: 'evidence' });

/** POST /api/evidence  上传（已实现，保留） */
const uploadEvidence = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  const { caseId } = req.body;
  if (!caseId) {
    res.status(400);
    throw new Error('caseId is required');
  }

  // 计算 SHA-256
  const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

  // 存 GridFS
  const bucket = getBucket();
  const uploadStream = bucket.openUploadStream(req.file.originalname, {
    metadata: {
      caseId,
      uploadedBy: req.user._id.toString(),
      hash,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
    contentType: req.file.mimetype,
  });

  await new Promise((resolve, reject) => {
    uploadStream.on('finish', resolve);
    uploadStream.on('error', reject);
    uploadStream.end(req.file.buffer);
  });

  const fileId = uploadStream.id;

  // 存元数据
  const evidence = await Evidence.create({
    caseId,
    fileId,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    hash,
    uploadedBy: req.user._id,
    metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
    tags: [],
  });

  res.status(201).json(evidence);
});

/** GET /api/evidence  列表（支持 ?caseId= & ?q= 模糊匹配名称） */
const getEvidenceList = asyncHandler(async (req, res) => {
  const { caseId, q } = req.query;
  const filter = caseId ? { caseId } : { uploadedBy: req.user._id };
  if (q && q.trim()) {
    filter.originalName = { $regex: q.trim(), $options: 'i' };
  }
  const list = await Evidence.find(filter).sort({ createdAt: -1 }).lean();
  res.json(list);
});

/** GET /api/evidence/:id  获取单条元数据 */
const getEvidenceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ev = await Evidence.findById(id).lean();
  if (!ev) {
    res.status(404);
    throw new Error('Evidence not found');
  }
  if (ev.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden');
  }
  res.json(ev);
});

/** PUT /api/evidence/:id  更新元数据（名称、metadata、tags），不改二进制 */
const updateEvidence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { originalName, metadata, tags } = req.body;

  const ev = await Evidence.findById(id);
  if (!ev) {
    res.status(404);
    throw new Error('Evidence not found');
  }
  if (ev.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden');
  }

  // 解析入参
  if (typeof originalName === 'string' && originalName.trim()) {
    ev.originalName = originalName.trim();

    // 可选：同步更新 GridFS files 的 filename 字段（不改 chunks）
    try {
      await mongoose.connection.db
        .collection('evidence.files')
        .updateOne({ _id: new ObjectId(ev.fileId) }, { $set: { filename: ev.originalName } });
    } catch (e) {
      // 忽略同步失败，不影响主流程
    }
  }

  if (typeof metadata !== 'undefined') {
    let obj = metadata;
    if (typeof metadata === 'string') {
      try { obj = JSON.parse(metadata); } catch { obj = {}; }
    }
    if (obj && typeof obj === 'object') ev.metadata = obj;
  }

  if (typeof tags !== 'undefined') {
    if (Array.isArray(tags)) {
      ev.tags = tags.map(String).map(s => s.trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      ev.tags = tags.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  await ev.save();
  res.json(ev.toObject());
});

/** DELETE /api/evidence/:id  删除元数据 + 对应 GridFS 文件 */
const deleteEvidence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ev = await Evidence.findById(id);
  if (!ev) {
    res.status(404);
    throw new Error('Evidence not found');
  }
  if (ev.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden');
  }

  // 先删 GridFS 文件
  const bucket = getBucket();
  try {
    await bucket.delete(new ObjectId(ev.fileId));
  } catch (e) {
    // 若文件已不存在，继续删除文档
  }

  await ev.deleteOne();
  res.json({ message: 'Deleted', id });
});

/** GET /api/evidence/:id/download  下载 */
const downloadEvidence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ev = await Evidence.findById(id).lean();
  if (!ev) {
    res.status(404);
    throw new Error('Evidence not found');
  }
  if (ev.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden');
  }

  res.setHeader('Content-Type', ev.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(ev.originalName)}"`);

  const bucket = getBucket();
  bucket
    .openDownloadStream(new ObjectId(ev.fileId))
    .on('error', () => res.status(500).end('Download error'))
    .pipe(res);
});

module.exports = {
  uploadEvidence,
  getEvidenceList,
  getEvidenceById,
  updateEvidence,
  deleteEvidence,
  downloadEvidence,
};
