const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  let query = "SELECT * FROM seguidores WHERE 1=1";
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
  db.get("SELECT * FROM seguidores WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Seguidor no encontrado" });
    res.json({ success: true, data: row });
  });
});

router.post("/", (req, res) => {
  const { seguidor_id, seguido_id } = req.body;
  if (!seguidor_id || !seguido_id) {
    return res.status(400).json({ success: false, message: "seguidor_id y seguido_id son obligatorios" });
  }
  if (seguidor_id === seguido_id) {
    return res.status(400).json({ success: false, message: "No puedes seguirte a ti mismo" });
  }

  db.get("SELECT id FROM usuarios WHERE id = ?", [seguidor_id], (err, user1) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!user1) return res.status(404).json({ success: false, message: "El seguidor no existe" });

    db.get("SELECT id FROM usuarios WHERE id = ?", [seguido_id], (err, user2) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!user2) return res.status(404).json({ success: false, message: "El usuario a seguir no existe" });

      db.run("INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)",
        [seguidor_id, seguido_id], function (err) {
          if (err) {
            if (err.message.includes("UNIQUE")) return res.status(400).json({ success: false, message: "Ya sigues a este usuario" });
            return res.status(500).json({ success: false, message: err.message });
          }
          res.status(201).json({ success: true, message: "Ahora sigues a este usuario", data: { id: this.lastID } });
        });
    });
  });
});

router.put("/:id", (req, res) => {
  const { seguidor_id, seguido_id } = req.body;
  db.get("SELECT id FROM seguidores WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Seguidor no encontrado" });
    db.run("UPDATE seguidores SET seguidor_id = COALESCE(?, seguidor_id), seguido_id = COALESCE(?, seguido_id) WHERE id = ?",
      [seguidor_id, seguido_id, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Seguidor actualizado" });
      });
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT id FROM seguidores WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Seguidor no encontrado" });
    db.run("DELETE FROM seguidores WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Dejaste de seguir a este usuario" });
    });
  });
});

module.exports = router;