const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Carpeta para los ficheros de memoria
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Helpers
const fileFor = (ns) => path.join(DATA_DIR, `${ns}.json`);
const readMem = (ns) => {
  const f = fileFor(ns);
  if (!fs.existsSync(f)) return [];
  try {
    const raw = fs.readFileSync(f, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
};
const writeMem = (ns, arr) =>
  fs.writeFileSync(fileFor(ns), JSON.stringify(arr, null, 2), "utf8");

// Rutas básicas
app.get("/", (_req, res) => res.json({ ok: true, service: "memoria-gpt" }));
app.get("/api/ping", (_req, res) => res.json({ message: "pong" }));
app.get("/api/estado", (_req, res) =>
  res.json({
    status: "ok",
    uptimeSec: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
  })
);

// Listar todo un espacio
app.get("/api/memoria/:ns", (req, res) => {
  const ns = req.params.ns;
  return res.json(readMem(ns));
});

// Obtener por clave
app.get("/api/memoria/:ns/:key", (req, res) => {
  const { ns, key } = req.params;
  const data = readMem(ns);
  const item = data.find((r) => r.key === key);
  if (!item) return res.status(404).json({ error: "no_encontrado" });
  return res.json(item);
});

// Guardar/actualizar (upsert) por clave
app.post("/api/memoria/:ns", (req, res) => {
  const ns = req.params.ns;
  let { key, value, author, tags, meta } = req.body || {};
  if (!key || typeof value === "undefined")
    return res.status(400).json({ error: "key_y_value_requeridos" });

  tags = Array.isArray(tags) ? tags : [];
  meta = typeof meta === "object" && meta ? meta : {};

  const data = readMem(ns);
  const now = new Date().toISOString();

  const idx = data.findIndex((r) => r.key === key);
  const record = {
    key,
    value,
    author: author || "system",
    tags,
    meta,
    updatedAt: now,
  };
  if (idx >= 0) {
    // actualizar
    data[idx] = { ...data[idx], ...record };
  } else {
    // crear
    data.push({ ...record, createdAt: now });
  }
  writeMem(ns, data);
  return res.json(record);
});

// Borrar por clave
app.delete("/api/memoria/:ns/:key", (req, res) => {
  const { ns, key } = req.params;
  const data = readMem(ns);
  const next = data.filter((r) => r.key !== key);
  if (next.length === data.length)
    return res.status(404).json({ error: "no_encontrado" });
  writeMem(ns, next);
  return res.json({ deleted: key });
});

// Búsqueda sencilla (substring)
app.post("/api/buscar/:ns", (req, res) => {
  const { ns } = req.params;
  const { q } = req.body || {};
  if (!q || typeof q !== "string" || !q.trim())
    return res.status(400).json({ error: "q_requerido" });

  const needle = q.toLowerCase();
  const data = readMem(ns);
  const results = data.filter((r) => {
    const inKey = (r.key || "").toLowerCase().includes(needle);
    const inVal =
      typeof r.value === "string"
        ? r.value.toLowerCase().includes(needle)
        : JSON.stringify(r.value).toLowerCase().includes(needle);
    const inTags = Array.isArray(r.tags)
      ? r.tags.join(" ").toLowerCase().includes(needle)
      : false;
    return inKey || inVal || inTags;
  });
  return res.json({ q, count: results.length, results });
});

// Versión
app.get("/api/version", (_req, res) =>
  res.json({ name: "memoria-gpt", version: "1.0.0" })
);

// Puerto Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});