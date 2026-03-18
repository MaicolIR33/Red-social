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
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get("/:id", (req, res) => {
  db.get("SELECT * FROM comentarios WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Comentario no encontrado" });
    res.json({ success: true, data: row });
  });
});

router.post("/", (req, res) => {
  const { post_id, usuario_id, contenido } = req.body;
  if (!post_id || !usuario_id || !contenido) {
    return res.status(400).json({ success: false, message: "post_id, usuario_id y contenido son obligatorios" });
  }

  db.get("SELECT id FROM posts WHERE id = ?", [post_id], (err, post) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!post) return res.status(404).json({ success: false, message: "El post no existe" });

    db.get("SELECT id FROM usuarios WHERE id = ?", [usuario_id], (err, user) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!user) return res.status(404).json({ success: false, message: "El usuario no existe" });

      db.run("INSERT INTO comentarios (post_id, usuario_id, contenido) VALUES (?, ?, ?)",
        [post_id, usuario_id, contenido], function (err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.status(201).json({ success: true, message: "Comentario creado", data: { id: this.lastID } });
        });
    });
  });
});

router.put("/:id", (req, res) => {
  const { contenido } = req.body;
  db.get("SELECT id FROM comentarios WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Comentario no encontrado" });
    db.run("UPDATE comentarios SET contenido = COALESCE(?, contenido) WHERE id = ?",
      [contenido, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Comentario actualizado" });
      });
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT id FROM comentarios WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Comentario no encontrado" });
    db.run("DELETE FROM comentarios WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Comentario eliminado" });
    });
  });
});

module.exports = router;