const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  let query = "SELECT * FROM perfiles WHERE 1=1";
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
    const row = db.prepare("SELECT * FROM perfiles WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Perfil no encontrado" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", (req, res) => {
  const { usuario_id, nombre_completo, bio, foto_url, sitio_web } = req.body;
  if (!usuario_id) return res.status(400).json({ success: false, message: "usuario_id es obligatorio" });
  try {
    const user = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(usuario_id);
    if (!user) return res.status(404).json({ success: false, message: "El usuario no existe" });
    const result = db.prepare("INSERT INTO perfiles (usuario_id, nombre_completo, bio, foto_url, sitio_web) VALUES (?, ?, ?, ?, ?)").run(usuario_id, nombre_completo, bio, foto_url, sitio_web);
    res.status(201).json({ success: true, message: "Perfil creado", data: { id: result.lastInsertRowid } });
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ success: false, message: "Este usuario ya tiene perfil" });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { nombre_completo, bio, foto_url, sitio_web } = req.body;
  try {
    const row = db.prepare("SELECT id FROM perfiles WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Perfil no encontrado" });
    db.prepare("UPDATE perfiles SET nombre_completo = COALESCE(?, nombre_completo), bio = COALESCE(?, bio), foto_url = COALESCE(?, foto_url), sitio_web = COALESCE(?, sitio_web) WHERE id = ?").run(nombre_completo, bio, foto_url, sitio_web, req.params.id);
    res.json({ success: true, message: "Perfil actualizado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT id FROM perfiles WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Perfil no encontrado" });
    db.prepare("DELETE FROM perfiles WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: "Perfil eliminado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;