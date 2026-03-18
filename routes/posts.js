const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  let query = "SELECT * FROM posts WHERE 1=1";
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
    const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Post no encontrado" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", (req, res) => {
  const { usuario_id, categoria_id, titulo, contenido, imagen_url } = req.body;
  if (!usuario_id || !categoria_id || !titulo || !contenido) {
    return res.status(400).json({ success: false, message: "usuario_id, categoria_id, titulo y contenido son obligatorios" });
  }
  if (titulo.length < 3) {
    return res.status(400).json({ success: false, message: "El titulo debe tener al menos 3 caracteres" });
  }
  try {
    const user = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(usuario_id);
    if (!user) return res.status(404).json({ success: false, message: "El usuario no existe" });
    const cat = db.prepare("SELECT id FROM categorias WHERE id = ?").get(categoria_id);
    if (!cat) return res.status(404).json({ success: false, message: "La categoría no existe" });
    const result = db.prepare("INSERT INTO posts (usuario_id, categoria_id, titulo, contenido, imagen_url) VALUES (?, ?, ?, ?, ?)").run(usuario_id, categoria_id, titulo, contenido, imagen_url);
    res.status(201).json({ success: true, message: "Post creado", data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { titulo, contenido, imagen_url } = req.body;
  try {
    const row = db.prepare("SELECT id FROM posts WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Post no encontrado" });
    db.prepare("UPDATE posts SET titulo = COALESCE(?, titulo), contenido = COALESCE(?, contenido), imagen_url = COALESCE(?, imagen_url) WHERE id = ?").run(titulo, contenido, imagen_url, req.params.id);
    res.json({ success: true, message: "Post actualizado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT id FROM posts WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Post no encontrado" });
    db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: "Post eliminado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;