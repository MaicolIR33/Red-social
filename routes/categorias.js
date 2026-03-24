const express = require("express"); // Importa el framework Express para crear el servidor y manejar rutas
const router = express.Router(); // Crea un enrutador modular para definir las rutas de este módulo
const db = require("../db"); // Importa la conexión a la base de datos desde el archivo db.js

// Ruta GET / - Obtiene todas las categorías, con soporte para filtros dinámicos por query params
router.get("/", (req, res) => {
  let query = "SELECT * FROM categorias WHERE 1=1"; // Consulta base; el "1=1" permite encadenar filtros dinámicamente
  const params = []; // Arreglo que almacenará los valores de los parámetros para evitar SQL injection
  Object.entries(req.query).forEach(([key, value]) => { // Itera sobre cada parámetro enviado en la URL (?key=value)
    query += ` AND ${key} LIKE ?`; // Agrega una condición de filtro por cada parámetro recibido
    params.push(`%${value}%`); // Agrega el valor con comodines para búsqueda parcial (LIKE)
  });
  try {
    const rows = db.prepare(query).all(params); // Prepara y ejecuta la consulta, retornando todas las filas coincidentes
    res.json({ success: true, total: rows.length, data: rows }); // Responde con los resultados, incluyendo el total de registros
  } catch (err) {
    res.status(500).json({ success: false, message: err.message }); // Responde con error 500 si falla la consulta
  }
});

// Ruta GET /:id - Obtiene una categoría específica por su ID
router.get("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM categorias WHERE id = ?").get(req.params.id); // Busca la categoría con el ID recibido en la URL
    if (!row) return res.status(404).json({ success: false, message: "Categoría no encontrada" }); // Si no existe, responde con error 404
    res.json({ success: true, data: row }); // Si existe, responde con los datos de la categoría
  } catch (err) {
    res.status(500).json({ success: false, message: err.message }); // Responde con error 500 si falla la consulta
  }
});

// Ruta POST / - Crea una nueva categoría
router.post("/", (req, res) => {
  const { nombre, descripcion } = req.body; // Extrae los campos nombre y descripcion del cuerpo de la petición
  if (!nombre) return res.status(400).json({ success: false, message: "nombre es obligatorio" }); // Valida que el campo nombre esté presente
  try {
    const result = db.prepare("INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)").run(nombre, descripcion); // Inserta la nueva categoría en la base de datos
    res.status(201).json({ success: true, message: "Categoría creada", data: { id: result.lastInsertRowid } }); // Responde con el ID del nuevo registro creado
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ success: false, message: "La categoría ya existe" }); // Si viola la restricción UNIQUE, informa que la categoría ya existe
    res.status(500).json({ success: false, message: err.message }); // Responde con error 500 para cualquier otro fallo
  }
});

// Ruta PUT /:id - Actualiza parcialmente una categoría existente por su ID
router.put("/:id", (req, res) => {
  const { nombre, descripcion } = req.body; // Extrae los campos a actualizar del cuerpo de la petición
  try {
    const row = db.prepare("SELECT id FROM categorias WHERE id = ?").get(req.params.id); // Verifica que la categoría con ese ID exista antes de actualizar
    if (!row) return res.status(404).json({ success: false, message: "Categoría no encontrada" }); // Si no existe, responde con error 404
    db.prepare("UPDATE categorias SET nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion) WHERE id = ?").run(nombre, descripcion, req.params.id); // Actualiza solo los campos enviados; COALESCE conserva el valor actual si el nuevo es null
    res.json({ success: true, message: "Categoría actualizada" }); // Confirma que la actualización fue exitosa
  } catch (err) {
    res.status(500).json({ success: false, message: err.message }); // Responde con error 500 si falla la operación
  }
});

// Ruta DELETE /:id - Elimina una categoría por su ID
router.delete("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT id FROM categorias WHERE id = ?").get(req.params.id); // Verifica que la categoría exista antes de intentar eliminarla
    if (!row) return res.status(404).json({ success: false, message: "Categoría no encontrada" }); // Si no existe, responde con error 404
    db.prepare("DELETE FROM categorias WHERE id = ?").run(req.params.id); // Elimina la categoría con el ID especificado
    res.json({ success: true, message: "Categoría eliminada" }); // Confirma que la eliminación fue exitosa
  } catch (err) {
    res.status(500).json({ success: false, message: err.message }); // Responde con error 500 si falla la operación
  }
});

module.exports = router; // Exporta el enrutador para que pueda ser usado en el archivo principal de la app