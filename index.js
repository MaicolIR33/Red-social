const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());

// MIDDLEWARE DE AUTENTICACIÓN GLOBAL
app.use((req, res, next) => {
  const password = req.headers["password"];
  if (!password || password !== process.env.API_PASSWORD) {
    return res.status(401).json({ success: false, message: "No autorizado" });
  }
  next();
});

// RUTAS
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/perfiles", require("./routes/perfiles"));
app.use("/api/categorias", require("./routes/categorias"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/comentarios", require("./routes/comentarios"));
app.use("/api/likes", require("./routes/likes"));
app.use("/api/seguidores", require("./routes/seguidores"));

// RUTA DE PRUEBA
app.get("/", (req, res) => {
  res.json({ success: true, message: "🚀 Red Social API funcionando" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});