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
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get("/:id", (req, res) => {
  db.get("SELECT * FROM categorias WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Categoría no encontrada" });
    res.json({ success: true, data: row });
  });
});

router.post("/", (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ success: false, message: "nombre es obligatorio" });

  db.run("INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)", [nombre, descripcion], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) return res.status(400).json({ success: false, message: "La categoría ya existe" });
      return res.status(500).json({ success: false, message: err.message });
    }
    res.status(201).json({ success: true, message: "Categoría creada", data: { id: this.lastID } });
  });
});

router.put("/:id", (req, res) => {
  const { nombre, descripcion } = req.body;
  db.get("SELECT id FROM categorias WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Categoría no encontrada" });
    db.run("UPDATE categorias SET nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion) WHERE id = ?",
      [nombre, descripcion, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Categoría actualizada" });
      });
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT id FROM categorias WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Categoría no encontrada" });
    db.run("DELETE FROM categorias WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Categoría eliminada" });
    });
  });
});

module.exports = router;