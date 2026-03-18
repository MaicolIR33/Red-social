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
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get("/:id", (req, res) => {
  db.get("SELECT * FROM perfiles WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Perfil no encontrado" });
    res.json({ success: true, data: row });
  });
});

router.post("/", (req, res) => {
  const { usuario_id, nombre_completo, bio, foto_url, sitio_web } = req.body;
  if (!usuario_id) return res.status(400).json({ success: false, message: "usuario_id es obligatorio" });

  db.get("SELECT id FROM usuarios WHERE id = ?", [usuario_id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "El usuario no existe" });

    db.run("INSERT INTO perfiles (usuario_id, nombre_completo, bio, foto_url, sitio_web) VALUES (?, ?, ?, ?, ?)",
      [usuario_id, nombre_completo, bio, foto_url, sitio_web], function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) return res.status(400).json({ success: false, message: "Este usuario ya tiene perfil" });
          return res.status(500).json({ success: false, message: err.message });
        }
        res.status(201).json({ success: true, message: "Perfil creado", data: { id: this.lastID } });
      });
  });
});

router.put("/:id", (req, res) => {
  const { nombre_completo, bio, foto_url, sitio_web } = req.body;
  db.get("SELECT id FROM perfiles WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Perfil no encontrado" });
    db.run("UPDATE perfiles SET nombre_completo = COALESCE(?, nombre_completo), bio = COALESCE(?, bio), foto_url = COALESCE(?, foto_url), sitio_web = COALESCE(?, sitio_web) WHERE id = ?",
      [nombre_completo, bio, foto_url, sitio_web, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Perfil actualizado" });
      });
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT id FROM perfiles WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Perfil no encontrado" });
    db.run("DELETE FROM perfiles WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Perfil eliminado" });
    });
  });
});

module.exports = router;