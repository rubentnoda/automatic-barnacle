const express = require("express");
const app = express();

// Ruta de prueba
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Render asigna el puerto en la variable de entorno PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
