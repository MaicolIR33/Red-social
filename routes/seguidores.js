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
  try {
    const rows = db.prepare(query).all(params);
    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM seguidores WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Seguidor no encontrado" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", (req, res) => {
  const { seguidor_id, seguido_id } = req.body;
  if (!seguidor_id || !seguido_id) {
    return res.status(400).json({ success: false, message: "seguidor_id y seguido_id son obligatorios" });
  }
  if (seguidor_id === seguido_id) {
    return res.status(400).json({ success: false, message: "No puedes seguirte a ti mismo" });
  }
  try {
    const user1 = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(seguidor_id);
    if (!user1) return res.status(404).json({ success: false, message: "El seguidor no existe" });
    const user2 = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(seguido_id);
    if (!user2) return res.status(404).json({ success: false, message: "El usuario a seguir no existe" });
    const result = db.prepare("INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)").run(seguidor_id, seguido_id);
    res.status(201).json({ success: true, message: "Ahora sigues a este usuario", data: { id: result.lastInsertRowid } });
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ success: false, message: "Ya sigues a este usuario" });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { seguidor_id, seguido_id } = req.body;
  try {
    const row = db.prepare("SELECT id FROM seguidores WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Seguidor no encontrado" });
    db.prepare("UPDATE seguidores SET seguidor_id = COALESCE(?, seguidor_id), seguido_id = COALESCE(?, seguido_id) WHERE id = ?").run(seguidor_id, seguido_id, req.params.id);
    res.json({ success: true, message: "Seguidor actualizado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT id FROM seguidores WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Seguidor no encontrado" });
    db.prepare("DELETE FROM seguidores WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: "Dejaste de seguir a este usuario" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;