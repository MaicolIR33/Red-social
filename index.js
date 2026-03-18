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
app.use("/usuarios", require("./routes/usuarios"));
app.use("/perfiles", require("./routes/perfiles"));
app.use("/categorias", require("./routes/categorias"));
app.use("/posts", require("./routes/posts"));
app.use("/comentarios", require("./routes/comentarios"));
app.use("/likes", require("./routes/likes"));
app.use("/seguidores", require("./routes/seguidores"));

// RUTA DE PRUEBA
app.get("/", (req, res) => {
  res.json({ success: true, message: "🚀 Red Social API funcionando" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});