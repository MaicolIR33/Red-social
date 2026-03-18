const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  let query = "SELECT * FROM likes WHERE 1=1";
  const params = [];
  Object.entries(req.query).forEach(([key, value]) => {
    query += ` AND ${key} LIKE ?`;
    params.push(`%${value}%`);
  });
  try {
    const rows = db.prepare(query).all(params);
    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM likes WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Like no encontrado" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", (req, res) => {
  const { post_id, usuario_id } = req.body;
  if (!post_id || !usuario_id) {
    return res.status(400).json({ success: false, message: "post_id y usuario_id son obligatorios" });
  }
  try {
    const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(post_id);
    if (!post) return res.status(404).json({ success: false, message: "El post no existe" });
    const user = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(usuario_id);
    if (!user) return res.status(404).json({ success: false, message: "El usuario no existe" });
    const result = db.prepare("INSERT INTO likes (post_id, usuario_id) VALUES (?, ?)").run(post_id, usuario_id);
    res.status(201).json({ success: true, message: "Like agregado", data: { id: result.lastInsertRowid } });
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ success: false, message: "Ya diste like a este post" });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { post_id, usuario_id } = req.body;
  try {
    const row = db.prepare("SELECT id FROM likes WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Like no encontrado" });
    db.prepare("UPDATE likes SET post_id = COALESCE(?, post_id), usuario_id = COALESCE(?, usuario_id) WHERE id = ?").run(post_id, usuario_id, req.params.id);
    res.json({ success: true, message: "Like actualizado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT id FROM likes WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Like no encontrado" });
    db.prepare("DELETE FROM likes WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: "Like eliminado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;