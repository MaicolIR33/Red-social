const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  let query = "SELECT id, username, email, created_at FROM usuarios WHERE 1=1";
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
    const row = db.prepare("SELECT id, username, email, created_at FROM usuarios WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "username, email y password son obligatorios" });
  }
  try {
    const result = db.prepare("INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)").run(username, email, password);
    res.status(201).json({ success: true, message: "Usuario creado", data: { id: result.lastInsertRowid } });
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ success: false, message: "El username o email ya existe" });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { username, email, password } = req.body;
  try {
    const row = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    db.prepare("UPDATE usuarios SET username = COALESCE(?, username), email = COALESCE(?, email), password = COALESCE(?, password) WHERE id = ?").run(username, email, password, req.params.id);
    res.json({ success: true, message: "Usuario actualizado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    db.prepare("DELETE FROM usuarios WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;