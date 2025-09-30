const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Ruta de prueba
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
