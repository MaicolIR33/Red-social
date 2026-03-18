const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  let query = "SELECT * FROM comentarios WHERE 1=1";
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
    const row = db.prepare("SELECT * FROM comentarios WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Comentario no encontrado" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", (req, res) => {
  const { post_id, usuario_id, contenido } = req.body;
  if (!post_id || !usuario_id || !contenido) {
    return res.status(400).json({ success: false, message: "post_id, usuario_id y contenido son obligatorios" });
  }
  try {
    const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(post_id);
    if (!post) return res.status(404).json({ success: false, message: "El post no existe" });
    const user = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(usuario_id);
    if (!user) return res.status(404).json({ success: false, message: "El usuario no existe" });
    const result = db.prepare("INSERT INTO comentarios (post_id, usuario_id, contenido) VALUES (?, ?, ?)").run(post_id, usuario_id, contenido);
    res.status(201).json({ success: true, message: "Comentario creado", data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { contenido } = req.body;
  try {
    const row = db.prepare("SELECT id FROM comentarios WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Comentario no encontrado" });
    db.prepare("UPDATE comentarios SET contenido = COALESCE(?, contenido) WHERE id = ?").run(contenido, req.params.id);
    res.json({ success: true, message: "Comentario actualizado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT id FROM comentarios WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Comentario no encontrado" });
    db.prepare("DELETE FROM comentarios WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: "Comentario eliminado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;