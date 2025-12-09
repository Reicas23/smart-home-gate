const mqtt = require("mqtt");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// ===============================
//   CORS PERMITIDO PARA CUALQUIER DISPOSITIVO
// ===============================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json());
app.use(express.static("public"));

// ===============================
//   BASE DE DATOS SQLITE
// ===============================
const db = new sqlite3.Database("historial.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      evento TEXT,
      valor TEXT
    )
  `);
});

function guardarHistorial(evento, valor) {
  const fecha = new Date().toLocaleString();
  db.run(
    "INSERT INTO eventos (fecha, evento, valor) VALUES (?, ?, ?)",
    [fecha, evento, valor]
  );
}

// ===============================
//   MQTT
// ===============================
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

let estado = {
  pir: 0,
  distancia: 0,
  ldr: 0,
  alerta: "",
  porton: "",
  luces: ""
};

client.on("connect", () => {
  console.log("MQTT conectado");

  client.subscribe("casa/pir");
  client.subscribe("casa/distancia");
  client.subscribe("casa/ldr");
  client.subscribe("casa/alerta");
  client.subscribe("casa/estado_porton");
  client.subscribe("casa/estado_luces");
});

client.on("message", (topic, msg) => {
  msg = msg.toString();

  if (topic === "casa/pir") {
    estado.pir = msg;
    guardarHistorial("pir", msg);
  }

  if (topic === "casa/distancia") {
    estado.distancia = msg;
    guardarHistorial("distancia", msg);
  }

  if (topic === "casa/ldr") {
    estado.ldr = msg;
    guardarHistorial("ldr", msg);
  }

  if (topic === "casa/alerta") {
    estado.alerta = msg;
    guardarHistorial("alerta", msg);
  }

  if (topic === "casa/estado_porton") {
    estado.porton = msg;
    guardarHistorial("estado_porton", msg);
  }

  if (topic === "casa/estado_luces") {
    estado.luces = msg;
    guardarHistorial("estado_luces", msg);
  }

  console.log(topic, msg);
});

// ===============================
//   ENDPOINTS API
// ===============================
app.get("/estado", (req, res) => {
  res.json(estado);
});

// ---- PORTÓN ----
app.post("/porton", (req, res) => {
  const cmd = req.body.cmd;
  client.publish("casa/porton/cmd", cmd);
  guardarHistorial("comando_porton", cmd);
  res.json({ enviado: cmd });
});

// ---- LUCES ----
app.post("/luces", (req, res) => {
  const cmd = req.body.cmd;
  client.publish("casa/luces/cmd", cmd);
  guardarHistorial("comando_luces", cmd);
  res.json({ enviado: cmd });
});

// ---- LUCES TOGGLE (opcional) ----
app.post("/luces/toggle", (req, res) => {
  const cmd = req.body.cmd; // "ON" o "OFF"
  client.publish("casa/luces/cmd", cmd);
  guardarHistorial("comando_luces", cmd);
  res.json({ enviado: cmd });
});

// ---- HISTORIAL ----
app.get("/historial", (req, res) => {
  db.all("SELECT * FROM eventos ORDER BY id DESC LIMIT 200", (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

// ===============================
//   INICIAR API
// ===============================
app.listen(3000, "0.0.0.0", () => {
  console.log("Dashboard API lista → http://192.168.187.241:3000");
});
