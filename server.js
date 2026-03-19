const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "datos.json");

app.use(cors());
app.use(express.json());

// Cargar datos desde archivo
function cargarDatos() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return {
        mensaje: "Servidor funcionando",
        almacen: parsed.almacen || {},
        registro: parsed.registro || []
      };
    }
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
  
  return {
    mensaje: "Servidor funcionando",
    almacen: {},
    registro: []
  };
}

// Guardar datos en archivo
function guardarDatos(datos) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(datos, null, 2));
    return true;
  } catch (error) {
    console.error("Error guardando datos:", error);
    return false;
  }
}

let datos = cargarDatos();

app.get("/", (req, res) => {
  res.json(datos);
});

app.post("/guardar", (req, res) => {
  datos = req.body;
  
  if (guardarDatos(datos)) {
    res.json({ ok: true, mensaje: "Datos guardados correctamente" });
  } else {
    res.status(500).json({ ok: false, mensaje: "Error al guardar datos" });
  }
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en http://localhost:" + PORT);
  console.log("Datos persistentes en:", DATA_FILE);
});
