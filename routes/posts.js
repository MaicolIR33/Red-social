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
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get("/:id", (req, res) => {
  db.get("SELECT * FROM posts WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Post no encontrado" });
    res.json({ success: true, data: row });
  });
});

router.post("/", (req, res) => {
  const { usuario_id, categoria_id, titulo, contenido, imagen_url } = req.body;
  if (!usuario_id || !categoria_id || !titulo || !contenido) {
    return res.status(400).json({ success: false, message: "usuario_id, categoria_id, titulo y contenido son obligatorios" });
  }
  if (titulo.length < 3) {
    return res.status(400).json({ success: false, message: "El titulo debe tener al menos 3 caracteres" });
  }

  db.get("SELECT id FROM usuarios WHERE id = ?", [usuario_id], (err, user) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!user) return res.status(404).json({ success: false, message: "El usuario no existe" });

    db.get("SELECT id FROM categorias WHERE id = ?", [categoria_id], (err, cat) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!cat) return res.status(404).json({ success: false, message: "La categoría no existe" });

      db.run("INSERT INTO posts (usuario_id, categoria_id, titulo, contenido, imagen_url) VALUES (?, ?, ?, ?, ?)",
        [usuario_id, categoria_id, titulo, contenido, imagen_url], function (err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.status(201).json({ success: true, message: "Post creado", data: { id: this.lastID } });
        });
    });
  });
});

router.put("/:id", (req, res) => {
  const { titulo, contenido, imagen_url } = req.body;
  db.get("SELECT id FROM posts WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Post no encontrado" });
    db.run("UPDATE posts SET titulo = COALESCE(?, titulo), contenido = COALESCE(?, contenido), imagen_url = COALESCE(?, imagen_url) WHERE id = ?",
      [titulo, contenido, imagen_url, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Post actualizado" });
      });
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT id FROM posts WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Post no encontrado" });
    db.run("DELETE FROM posts WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Post eliminado" });
    });
  });
});

module.exports = router;