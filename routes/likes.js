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
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get("/:id", (req, res) => {
  db.get("SELECT * FROM likes WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Like no encontrado" });
    res.json({ success: true, data: row });
  });
});

router.post("/", (req, res) => {
  const { post_id, usuario_id } = req.body;
  if (!post_id || !usuario_id) {
    return res.status(400).json({ success: false, message: "post_id y usuario_id son obligatorios" });
  }

  db.get("SELECT id FROM posts WHERE id = ?", [post_id], (err, post) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!post) return res.status(404).json({ success: false, message: "El post no existe" });

    db.get("SELECT id FROM usuarios WHERE id = ?", [usuario_id], (err, user) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!user) return res.status(404).json({ success: false, message: "El usuario no existe" });

      db.run("INSERT INTO likes (post_id, usuario_id) VALUES (?, ?)",
        [post_id, usuario_id], function (err) {
          if (err) {
            if (err.message.includes("UNIQUE")) return res.status(400).json({ success: false, message: "Ya diste like a este post" });
            return res.status(500).json({ success: false, message: err.message });
          }
          res.status(201).json({ success: true, message: "Like agregado", data: { id: this.lastID } });
        });
    });
  });
});

router.put("/:id", (req, res) => {
  const { post_id, usuario_id } = req.body;
  db.get("SELECT id FROM likes WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Like no encontrado" });
    db.run("UPDATE likes SET post_id = COALESCE(?, post_id), usuario_id = COALESCE(?, usuario_id) WHERE id = ?",
      [post_id, usuario_id, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Like actualizado" });
      });
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT id FROM likes WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Like no encontrado" });
    db.run("DELETE FROM likes WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Like eliminado" });
    });
  });
});

module.exports = router;