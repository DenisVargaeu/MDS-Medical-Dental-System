const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const upload = require('../middleware/upload');

// POST /api/files/upload/:patientId
router.post('/upload/:patientId', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { record_id, category, description } = req.body;
  const { patientId } = req.params;
  const uuid = req.fileUuid || req.file.filename.split('.')[0];
  try {
    const [result] = await db.query(
      `INSERT INTO mds_files (patient_id, record_id, file_uuid, stored_name, original_name, mime_type, size_bytes, category, description, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientId, record_id || null, uuid, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, category || 'other', description || null, req.user.id]
    );
    const [[created]] = await db.query('SELECT * FROM mds_files WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/files/patient/:patientId
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.*, u.name AS uploader_name 
       FROM mds_files f LEFT JOIN mds_users u ON u.id = f.uploaded_by
       WHERE f.patient_id = ? ORDER BY f.uploaded_at DESC`,
      [req.params.patientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/files/:id/download
router.get('/:id/download', auth, async (req, res) => {
  try {
    const [[file]] = await db.query('SELECT * FROM mds_files WHERE id = ?', [req.params.id]);
    if (!file) return res.status(404).json({ error: 'File not found' });
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, String(file.patient_id), file.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing from storage' });
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.sendFile(path.resolve(filePath));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/files/:id
router.delete('/:id', auth, roles('admin', 'doctor'), async (req, res) => {
  try {
    const [[file]] = await db.query('SELECT * FROM mds_files WHERE id = ?', [req.params.id]);
    if (!file) return res.status(404).json({ error: 'File not found' });
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, String(file.patient_id), file.stored_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await db.query('DELETE FROM mds_files WHERE id = ?', [req.params.id]);
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
