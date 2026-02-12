const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let datos = {
  mensaje: "Servidor funcionando",
  almacen: {},
  registro: []
};

app.get("/", (req, res) => {
  res.json(datos);
});

app.post("/guardar", (req, res) => {
  datos = req.body;
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en http://localhost:" + PORT);
});
