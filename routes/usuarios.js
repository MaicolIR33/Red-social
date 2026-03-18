const express = require("express");
const router = express.Router();
const db = require("../db");

// GET todos
router.get("/", (req, res) => {
  let query = "SELECT id, username, email, created_at FROM usuarios WHERE 1=1";
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

// GET por ID
router.get("/:id", (req, res) => {
  db.get("SELECT id, username, email, created_at FROM usuarios WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    res.json({ success: true, data: row });
  });
});

// POST crear
router.post("/", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "username, email y password son obligatorios" });
  }

  db.run(
    "INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)",
    [username, email, password],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ success: false, message: "El username o email ya existe" });
        }
        return res.status(500).json({ success: false, message: err.message });
      }
      res.status(201).json({ success: true, message: "Usuario creado", data: { id: this.lastID } });
    }
  );
});

// PUT actualizar
router.put("/:id", (req, res) => {
  const { username, email, password } = req.body;

  db.get("SELECT id FROM usuarios WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    db.run(
      "UPDATE usuarios SET username = COALESCE(?, username), email = COALESCE(?, email), password = COALESCE(?, password) WHERE id = ?",
      [username, email, password, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Usuario actualizado" });
      }
    );
  });
});

// DELETE eliminar
router.delete("/:id", (req, res) => {
  db.get("SELECT id FROM usuarios WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    db.run("DELETE FROM usuarios WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Usuario eliminado" });
    });
  });
});

module.exports = router;