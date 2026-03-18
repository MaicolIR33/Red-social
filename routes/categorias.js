const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  let query = "SELECT * FROM categorias WHERE 1=1";
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
    const row = db.prepare("SELECT * FROM categorias WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Categoría no encontrada" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ success: false, message: "nombre es obligatorio" });
  try {
    const result = db.prepare("INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)").run(nombre, descripcion);
    res.status(201).json({ success: true, message: "Categoría creada", data: { id: result.lastInsertRowid } });
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ success: false, message: "La categoría ya existe" });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { nombre, descripcion } = req.body;
  try {
    const row = db.prepare("SELECT id FROM categorias WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Categoría no encontrada" });
    db.prepare("UPDATE categorias SET nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion) WHERE id = ?").run(nombre, descripcion, req.params.id);
    res.json({ success: true, message: "Categoría actualizada" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT id FROM categorias WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Categoría no encontrada" });
    db.prepare("DELETE FROM categorias WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: "Categoría eliminada" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;