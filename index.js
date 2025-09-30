const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Carpeta para guardar recuerdos
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Ruta de prueba (ping)
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Guardar recuerdo
app.post("/api/memoria/:gpt", (req, res) => {
  const gpt = req.params.gpt;
  const { key, value, author } = req.body;

  if (!key || !value) {
    return res.status(400).json({ error: "Faltan key y value" });
  }

  const filePath = path.join(DATA_DIR, `${gpt}.json`);
  let recuerdos = [];

  if (fs.existsSync(filePath)) {
    recuerdos = JSON.parse(fs.readFileSync(filePath));
  }

  const nuevoRecuerdo = {
    key,
    value,
    author: author || "anon",
    date: new Date().toISOString()
  };
  recuerdos.push(nuevoRecuerdo);

  fs.writeFileSync(filePath, JSON.stringify(recuerdos, null, 2));

  res.status(201).json({ message: "Recuerdo guardado", data: nuevoRecuerdo });
});

// Listar recuerdos
app.get("/api/memoria/:gpt", (req, res) => {
  const gpt = req.params.gpt;
  const filePath = path.join(DATA_DIR, `${gpt}.json`);

  if (!fs.existsSync(filePath)) {
    return res.json({ recuerdos: [] });
  }

  const recuerdos = JSON.parse(fs.readFileSync(filePath));
  res.json({ recuerdos });
});

// Estado del servidor
app.get("/api/estado", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.send("🚀 Memoria GPT está viva en Render");
});

// Puerto dinámico de Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
