// Imports de Firebase (versión moderna)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, addDoc, collection, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const STORAGE_KEY = "taller-pro-admin-v1";
const API_BASE = "http://localhost:3000";
const ORDER_FLOW = ["Recepcion", "Diagnostico", "Reparacion", "Control final", "Listo", "Entregado"];
const PRIORITY_WEIGHT = { Alta: 0, Media: 1, Baja: 2 };
const SECTION_TITLES = {
  dashboard: "Panel general",
  ordenes: "Ordenes de trabajo",
  inventario: "Inventario",
  clientes: "Clientes",
  vehiculos: "Vehiculos",
  historial: "Historial",
  agenda: "Agenda",
  settings: "Configuracion"
};

// Configuración GitHub (se mantiene como estaba)
const GITHUB_CONFIG = {
  token: "ghp_1234567890abcdefABCDEF1234567890abcdef", // ← Token válido
  owner: "tallerborjon", // ← Tu usuario de GitHub
  repo: "almacen-aceites", // ← Tu repositorio
  branch: "main",
  path: "datos.json"
};

// Configuración Firebase (para sincronización entre dispositivos)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD8MSMQvDDr_3XhsJVYeNxW3UDph7yVRAY",
  authDomain: "taller-app-9f020.firebaseapp.com",
  projectId: "taller-app-9f020",
  storageBucket: "taller-app-9f020.firebasestorage.app",
  messagingSenderId: "536716566241",
  appId: "1:536716566241:web:870e52f9686538feffa1a0",
  measurementId: "G-P1TGVFJ26D"
};

// Inicializar Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// Variable global para Firebase
let firestoreDb = db;

let state;
const refs = {};

// Funciones de sincronización con GitHub (se mantienen)
async function saveToGitHub(data) {
  try {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
    
    // Primero obtener el archivo actual para saber su SHA
    const currentFile = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`
      }
    });
    
    let sha = null;
    if (currentFile.ok) {
      const fileData = await currentFile.json();
      sha = fileData.sha;
    }
    
    // Actualizar o crear el archivo
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Actualizar datos del taller - ${new Date().toLocaleString()}`,
        content: btoa(JSON.stringify(data, null, 2)),
        sha: sha,
        branch: GITHUB_CONFIG.branch
      })
    });
    
    if (response.ok) {
      console.log('✅ Datos guardados en GitHub');
      return true;
    } else {
      console.error('Error guardando en GitHub:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error en saveToGitHub:', error);
    return false;
  }
}

async function loadFromGitHub() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`
      }
    });
    
    if (response.ok) {
      const fileData = await response.json();
      const content = atob(fileData.content);
      return JSON.parse(content);
    } else {
      console.log('No hay datos en GitHub, usando estado inicial');
      return null;
    }
  } catch (error) {
    console.error('Error cargando desde GitHub:', error);
    return null;
  }
}

// Funciones de sincronización con Firebase (versión moderna con Firestore)
async function saveToFirebase(data) {
  try {
    // Guardar datos en Firestore
    await setDoc(doc(firestoreDb, "taller-data", "main"), {
      ...data,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Datos guardados en Firebase Firestore');
    return true;
  } catch (error) {
    console.error('❌ Error guardando en Firebase:', error);
    return false;
  }
}

async function loadFromFirebase() {
  try {
    // Cargar datos desde Firestore
    const docRef = doc(firestoreDb, "taller-data", "main");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Datos cargados desde Firebase Firestore');
      return data;
    } else {
      console.log('📝 No hay datos en Firebase Firestore');
      return null;
    }
  } catch (error) {
    console.error('❌ Error cargando desde Firebase:', error);
    return null;
  }
}

// Función global para conectar el formulario HTML con Firebase
window.guardar = async function() {
  try {
    // Obtener los valores del formulario
    const nombre = document.getElementById("clientName")?.value.trim();
    const telefono = document.getElementById("clientPhone")?.value.trim();
    const email = document.getElementById("clientEmail")?.value.trim();
    const vehiculo = document.getElementById("clientVehicle")?.value.trim();
    const notas = document.getElementById("clientNotes")?.value.trim();
    
    // Validación básica
    if (!nombre) {
      alert("El nombre es requerido");
      document.getElementById("clientName")?.focus();
      return;
    }
    
    if (!telefono) {
      alert("El teléfono es requerido");
      document.getElementById("clientPhone")?.focus();
      return;
    }
    
    // Crear objeto cliente
    const cliente = {
      nombre: nombre,
      telefono: telefono,
      email: email,
      vehiculo: vehiculo,
      notas: notas,
      fechaRegistro: new Date().toISOString()
    };
    
    // Guardar en Firebase directamente
    try {
      await addDoc(collection(firestoreDb, "clientes"), cliente);
      
      // Limpiar los inputs
      document.getElementById("clientName").value = "";
      document.getElementById("clientPhone").value = "";
      document.getElementById("clientEmail").value = "";
      document.getElementById("clientVehicle").value = "";
      document.getElementById("clientNotes").value = "";
      
      // Mostrar alerta
      alert("Cliente guardado correctamente");
      
      console.log("✅ Cliente guardado en Firebase:", cliente);
    } catch (error) {
      console.error("❌ Error guardando cliente:", error);
      alert("Error al guardar el cliente. Intenta de nuevo.");
    }
    
  } catch (error) {
    console.error("❌ Error general:", error);
    alert("Ocurrió un error al guardar el cliente");
  }
};

// Función para guardar órdenes - Conectar formulario de órdenes con Firebase
window.guardarOrden = async function() {
  try {
    // Obtener valores del formulario de órdenes
    const cliente = document.getElementById("orderClient")?.value.trim() || "Cliente sin nombre";
    const telefono = document.getElementById("orderPhone")?.value.trim() || "Sin teléfono";
    const marca = document.getElementById("orderMake")?.value.trim();
    const modelo = document.getElementById("orderModel")?.value.trim();
    const color = document.getElementById("orderColor")?.value.trim();
    const año = document.getElementById("orderYear")?.value;
    const placas = document.getElementById("orderPlate")?.value.trim().toUpperCase();
    const mecanico = document.getElementById("orderMechanic")?.value.trim();
    const prioridad = document.getElementById("orderPriority")?.value;
    const diagnostico = document.getElementById("orderDiagnosis")?.value.trim();
    const notas = document.getElementById("orderNotes")?.value.trim();
    const fecha = document.getElementById("orderDate")?.value || new Date().toISOString().split('T')[0];
    
    // Validación básica
    if (!marca || !modelo || !placas) {
      alert("Marca, modelo y placas son requeridos");
      return;
    }
    
    // Crear objeto orden
    const orden = {
      id: `OT-${Date.now().toString().slice(-6)}`,
      cliente: cliente,
      telefono: telefono,
      make: marca,
      model: modelo,
      color: color,
      year: año,
      plate: placas,
      mechanic: mecanico,
      priority: prioridad,
      diagnosis: diagnostico,
      notes: notas,
      createdAt: fecha,
      status: "Recepcion"
    };
    
    // Guardar en Firebase
    const resultado = await guardarOrden(orden);
    
    if (resultado) {
      // Agregar al estado local para mostrar inmediatamente
      if (!state.orders) state.orders = [];
      state.orders.unshift(orden);
      
      // Mostrar solo la nueva orden agregada
      mostrarNuevaOrden(orden);
      
      // Limpiar formulario
      document.getElementById("orderForm")?.reset();
      
      // Mostrar alerta
      alert("Orden guardada correctamente");
      
      console.log("✅ Orden guardada en Firebase:", orden);
    } else {
      alert("Error al guardar la orden. Intenta de nuevo.");
    }
    
  } catch (error) {
    console.error("❌ Error guardando orden:", error);
    alert("Ocurrió un error al guardar la orden");
  }
};

// Función para mostrar solo la nueva orden agregada
function mostrarNuevaOrden(orden) {
  const priorityClass = orden.priority === "Alta" ? "badge--danger" : 
                        orden.priority === "Media" ? "badge--warning" : "badge--info";
  
  refs.ordersCards.innerHTML = `
    <div class="order-card" data-order-id="${safe(orden.id)}">
      <div class="order-header">
        <div class="order-title">
          <strong>${safe(orden.plate)} - ${safe(orden.make)} ${safe(orden.model)}</strong>
          <small>${safe(orden.createdAt)} · ${safe(orden.mechanic || "Sin asignar")}</small>
        </div>
        <div class="order-badges">
          ${badgeHtml(orden.status || "Recepcion", "badge--info")}
          ${badgeHtml(orden.priority, priorityClass)}
        </div>
      </div>
      
      <div class="order-body">
        <div class="order-info">
          <div class="order-info-item">
            <span class="order-info-label">Cliente:</span>
            <span class="order-info-value">${safe(orden.cliente)}</span>
          </div>
          <div class="order-info-item">
            <span class="order-info-label">Teléfono:</span>
            <span class="order-info-value">${safe(orden.telefono)}</span>
          </div>
          <div class="order-info-item">
            <span class="order-info-label">Vehículo:</span>
            <span class="order-info-value">${safe(orden.make)} ${safe(orden.model)} (${orden.year})</span>
          </div>
          <div class="order-info-item">
            <span class="order-info-label">Color:</span>
            <span class="order-info-value">${safe(orden.color)}</span>
          </div>
        </div>
        
        ${orden.diagnosis ? `
        <div class="order-diagnosis">
          <span class="order-diagnosis-label">Diagnóstico:</span>
          <span class="order-diagnosis-text">${safe(orden.diagnosis)}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="order-actions">
        <button class="mini-btn" type="button" onclick="editarOrden('${safe(orden.id)}')">Editar</button>
        <button class="mini-btn" type="button" onclick="actualizarEstadoOrden('${safe(orden.id)}')">Actualizar estado</button>
        <button class="mini-btn danger-btn" type="button" onclick="ordenTerminada('${safe(orden.id)}')">Orden terminada</button>
      </div>
    </div>
  `;
}

// Función para editar orden
function editarOrden(orderId) {
  const orden = state.orders.find(o => o.id === orderId);
  if (!orden) return;
  
  // Llenar formulario con datos de la orden
  document.getElementById("orderClient").value = orden.cliente || "";
  document.getElementById("orderPhone").value = orden.telefono || "";
  document.getElementById("orderMake").value = orden.make || "";
  document.getElementById("orderModel").value = orden.model || "";
  document.getElementById("orderColor").value = orden.color || "";
  document.getElementById("orderYear").value = orden.year || "";
  document.getElementById("orderPlate").value = orden.plate || "";
  document.getElementById("orderMechanic").value = orden.mechanic || "";
  document.getElementById("orderPriority").value = orden.priority || "";
  document.getElementById("orderDiagnosis").value = orden.diagnosis || "";
  document.getElementById("orderNotes").value = orden.notes || "";
  document.getElementById("orderDate").value = orden.createdAt || "";
  
  alert("Orden cargada en el formulario. Edita los datos y guarda.");
}

// Función para actualizar estado de orden
function actualizarEstadoOrden(orderId) {
  const orden = state.orders.find(o => o.id === orderId);
  if (!orden) return;
  
  const estados = ["Recepcion", "Diagnostico", "Reparacion", "Control final", "Listo", "Entregado"];
  const estadoActual = orden.status || "Recepcion";
  const indiceActual = estados.indexOf(estadoActual);
  const nuevoEstado = estados[(indiceActual + 1) % estados.length];
  
  orden.status = nuevoEstado;
  
  // Actualizar en Firebase
  updateDoc(doc(firestoreDb, "ordenes", orderId), { status: nuevoEstado })
    .then(() => {
      alert(`Estado actualizado a: ${nuevoEstado}`);
      mostrarNuevaOrden(orden);
    })
    .catch(error => {
      console.error("Error actualizando estado:", error);
      alert("Error al actualizar el estado");
    });
}

// Función para marcar orden como terminada
function ordenTerminada(orderId) {
  if (confirm("¿Estás seguro de que esta orden está terminada?")) {
    const orden = state.orders.find(o => o.id === orderId);
    if (!orden) return;
    
    orden.status = "Entregado";
    
    // Actualizar en Firebase
    updateDoc(doc(firestoreDb, "ordenes", orderId), { status: "Entregado" })
      .then(() => {
        alert("¡Orden marcada como terminada y entregada!");
        // Limpiar el área de órdenes
        refs.ordersCards.innerHTML = '<div class="empty-state">Agrega una nueva orden para verla aquí.</div>';
      })
      .catch(error => {
        console.error("Error marcando orden como terminada:", error);
        alert("Error al marcar la orden como terminada");
      });
  }
}

// Función para guardar productos - Conectar formulario de inventario con Firebase  
window.guardarProducto = async function() {
  try {
    // Obtener valores del formulario de inventario
    const nombre = document.getElementById("inventoryName")?.value.trim();
    const marca = document.getElementById("inventoryBrand")?.value.trim();
    const sku = document.getElementById("inventorySku")?.value.trim();
    const categoria = document.getElementById("inventoryCategory")?.value;
    const presentacion = document.getElementById("inventoryPresentation")?.value;
    const proveedor = document.getElementById("inventorySupplier")?.value.trim();
    const ubicacion = document.getElementById("inventoryLocation")?.value.trim() || "Almacén";
    const stock = Number(document.getElementById("inventoryStock")?.value) || 0;
    const stockMinimo = Number(document.getElementById("inventoryMinStock")?.value) || 5;
    const costo = Number(document.getElementById("inventoryCost")?.value) || 0;
    const impuesto = Number(document.getElementById("inventoryTax")?.value) || 0;
    const precio = Number(document.getElementById("inventoryPrice")?.value) || 0;
    const notas = document.getElementById("inventoryNotes")?.value.trim();
    
    // Validación básica
    if (!nombre || !marca || !proveedor) {
      alert("Nombre, marca y proveedor son requeridos");
      return;
    }
    
    // Crear objeto producto
    const producto = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      name: nombre,
      brand: marca,
      sku: sku,
      category: categoria,
      presentation: presentacion,
      supplier: proveedor,
      location: ubicacion,
      stock: stock,
      minStock: stockMinimo,
      cost: costo,
      tax: impuesto,
      price: precio,
      notes: notas,
      createdAt: new Date().toISOString()
    };
    
    // Guardar en Firebase
    const resultado = await guardarProducto(producto);
    
    if (resultado) {
      // Agregar al estado local para mostrar inmediatamente
      if (!state.inventory) state.inventory = [];
      state.inventory.unshift(producto);
      
      // Renderizar inventario
      renderInventory();
      
      // Limpiar formulario
      document.getElementById("inventoryForm")?.reset();
      
      // Cerrar formulario desplegable
      toggleInventoryForm();
      
      // Mostrar alerta
      alert("Producto guardado correctamente");
      
      console.log("✅ Producto guardado en Firebase:", producto);
    } else {
      alert("Error al guardar el producto. Intenta de nuevo.");
    }
    
  } catch (error) {
    console.error("❌ Error guardando producto:", error);
    alert("Ocurrió un error al guardar el producto");
  }
};

// Función para cargar clientes desde Firestore en tiempo real
function loadClientsFromFirestore() {
  const clientesRef = collection(firestoreDb, "clientes");
  
  // Usar onSnapshot para actualizaciones en tiempo real
  onSnapshot(clientesRef, (snapshot) => {
    const clientes = [];
    snapshot.forEach((doc) => {
      clientes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Actualizar el estado local
    state.clients = clientes;
    
    // Renderizar los clientes
    renderClients();
    
    console.log('🔄 Clientes actualizados desde Firestore:', clientes.length);
  }, (error) => {
    console.error('❌ Error cargando clientes desde Firestore:', error);
  });
}

// Función para eliminar cliente de Firestore
window.deleteClient = async function(clientId) {
  if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
    return;
  }
  
  try {
    // Eliminar de Firestore
    await deleteDoc(doc(firestoreDb, "clientes", clientId));
    
    // No necesitamos actualizar el estado local porque onSnapshot lo hará automáticamente
    console.log('✅ Cliente eliminado de Firestore:', clientId);
    
  } catch (error) {
    console.error('❌ Error eliminando cliente:', error);
    alert("Error al eliminar el cliente. Intenta de nuevo.");
  }
};

// Función para editar cliente
window.editClient = async function(clientId) {
  const cliente = state.clients.find(c => c.id === clientId);
  if (!cliente) return;
  
  // Llenar el formulario con los datos del cliente
  document.getElementById("clientName").value = cliente.nombre || cliente.name || "";
  document.getElementById("clientPhone").value = cliente.telefono || cliente.phone || "";
  document.getElementById("clientEmail").value = cliente.email || "";
  document.getElementById("clientVehicle").value = cliente.vehiculo || cliente.vehicle || "";
  document.getElementById("clientNotes").value = cliente.notas || cliente.notes || "";
  
  // Cambiar el botón de guardar a "Actualizar"
  const saveBtn = document.querySelector('#clientForm button[type="button"]');
  if (saveBtn) {
    saveBtn.textContent = "Actualizar cliente";
    saveBtn.onclick = function() { updateClient(clientId); };
  }
  
  // Scroll al formulario
  document.getElementById("clientForm")?.scrollIntoView({ behavior: 'smooth' });
};

// Función para actualizar cliente en Firestore
async function updateClient(clientId) {
  try {
    // Obtener valores del formulario
    const nombre = document.getElementById("clientName")?.value.trim();
    const telefono = document.getElementById("clientPhone")?.value.trim();
    const email = document.getElementById("clientEmail")?.value.trim();
    const vehiculo = document.getElementById("clientVehicle")?.value.trim();
    const notas = document.getElementById("clientNotes")?.value.trim();
    
    // Validación básica
    if (!nombre) {
      alert("El nombre es requerido");
      return;
    }
    
    if (!telefono) {
      alert("El teléfono es requerido");
      return;
    }
    
    // Actualizar en Firestore
    await updateDoc(doc(firestoreDb, "clientes", clientId), {
      nombre: nombre,
      telefono: telefono,
      email: email,
      vehiculo: vehiculo,
      notas: notas,
      fechaActualizacion: new Date().toISOString()
    });
    
    // Limpiar formulario y restaurar botón
    document.getElementById("clientForm")?.reset();
    const saveBtn = document.querySelector('#clientForm button[type="button"]');
    if (saveBtn) {
      saveBtn.textContent = "Guardar cliente";
      saveBtn.onclick = window.guardar;
    }
    
    alert("Cliente actualizado correctamente");
    console.log('✅ Cliente actualizado en Firestore:', clientId);
    
  } catch (error) {
    console.error('❌ Error actualizando cliente:', error);
    alert("Error al actualizar el cliente. Intenta de nuevo.");
  }
}

export async function guardarOrden(orden) {
  try {
    await addDoc(collection(firestoreDb, "ordenes"), {
      ...orden,
      createdAt: new Date().toISOString()
    });
    console.log('✅ Orden guardada en Firebase');
    return true;
  } catch (error) {
    console.error('❌ Error guardando orden:', error);
    return false;
  }
}

export async function guardarProducto(producto) {
  try {
    await addDoc(collection(firestoreDb, "productos"), {
      ...producto,
      createdAt: new Date().toISOString()
    });
    console.log('✅ Producto guardado en Firebase');
    return true;
  } catch (error) {
    console.error('❌ Error guardando producto:', error);
    return false;
  }
}

// Funciones de sincronización con backend (mantenimos como respaldo)
async function saveToBackend() {
  try {
    const response = await fetch(`${API_BASE}/guardar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state)
    });
    
    if (response.ok) {
      showToast('Datos guardados en servidor', 'success');
    } else {
      showToast('Error al guardar en servidor', 'danger');
    }
  } catch (error) {
    console.error('Error guardando en backend:', error);
    showToast('Error de conexión con servidor', 'warning');
  }
}

async function loadFromBackend() {
  try {
    const response = await fetch(`${API_BASE}/`);
    const data = await response.json();
    
    if (data.almacen && Object.keys(data.almacen).length > 0) {
      state = { ...state, ...data.almacen };
      saveState();
      renderAll();
      showToast('Datos sincronizados desde servidor', 'info');
    }
  } catch (error) {
    console.error('Error cargando desde backend:', error);
  }
}

// Funciones de estado principales
function loadState() {
  // Cargar desde localStorage primero
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    } else {
      return createInitialState();
    }
  } catch (error) {
    console.error('Error cargando estado:', error);
    return createInitialState();
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Auto-guardar en backend después de cambios locales
  saveToBackend();
}

async function saveState() {
  persistState();
  
  // Guardar en GitHub (como respaldo)
  try {
    await saveToGitHub(state);
  } catch (error) {
    console.warn('No se pudo guardar en GitHub:', error);
  }
  
  // Guardar en Firebase (sincronización entre dispositivos)
  try {
    await saveToFirebase(state);
  } catch (error) {
    console.warn('No se pudo guardar en Firebase:', error);
  }
  
  // Intentar guardar en backend como respaldo (sin bloquear)
  try {
    await saveToBackend();
  } catch (error) {
    console.warn('No se pudo guardar en backend:', error);
  }
}

function toggleInventoryForm() {
  const formPanel = document.getElementById("inventoryFormPanel");
  const toggleBtn = document.getElementById("toggleInventoryForm");
  const btnIcon = toggleBtn.querySelector(".btn-icon");
  const btnText = toggleBtn.querySelector(".btn-text");
  
  if (formPanel.style.display === "none" || !formPanel.classList.contains("show")) {
    // Mostrar formulario
    formPanel.style.display = "block";
    setTimeout(() => {
      formPanel.classList.add("show");
    }, 10);
    
    btnIcon.textContent = "➖";
    btnText.textContent = "Cerrar Formulario";
    toggleBtn.style.background = "linear-gradient(135deg, var(--danger), #ff6b6b)";
  } else {
    // Ocultar formulario
    formPanel.classList.remove("show");
    setTimeout(() => {
      formPanel.style.display = "none";
    }, 400);
    
    btnIcon.textContent = "➕";
    btnText.textContent = "Agregar Nuevo Producto";
    toggleBtn.style.background = "linear-gradient(135deg, var(--brand), var(--brand-strong))";
  }
}

function cacheDom() {
  refs.root = document.documentElement;
  refs.backdrop = document.getElementById("backdrop");
  refs.sectionTitle = document.getElementById("sectionTitle");
  refs.themeToggle = document.getElementById("themeToggle");
  refs.menuToggle = document.getElementById("menuToggle");
  refs.navLinks = Array.from(document.querySelectorAll(".nav-link"));
  refs.sections = Array.from(document.querySelectorAll(".page-section"));

  refs.dashboardOrders = document.getElementById("dashboardOrders");
  refs.dashboardInventory = document.getElementById("dashboardInventory");
  refs.dashboardAgenda = document.getElementById("dashboardAgenda");

  refs.orderForm = document.getElementById("orderForm");
  refs.orderDate = document.getElementById("orderDate");
  refs.orderMechanic = document.getElementById("orderMechanic");
  refs.orderClientSelect = document.getElementById("orderClientSelect");
  refs.orderClient = document.getElementById("orderClient");
  refs.orderPhone = document.getElementById("orderPhone");
  refs.orderMake = document.getElementById("orderMake");
  refs.orderModel = document.getElementById("orderModel");
  refs.orderColor = document.getElementById("orderColor");
  refs.orderYear = document.getElementById("orderYear");
  refs.orderPlate = document.getElementById("orderPlate");
  refs.orderPriority = document.getElementById("orderPriority");
  refs.orderDiagnosis = document.getElementById("orderDiagnosis");
  refs.orderNotes = document.getElementById("orderNotes");
  refs.ordersCards = document.getElementById("ordersCards");
  refs.newClientFields = document.getElementById("newClientFields");
  refs.existingClientInfo = document.getElementById("existingClientInfo");
  refs.selectedClientName = document.getElementById("selectedClientName");
  refs.selectedClientPhone = document.getElementById("selectedClientPhone");
  refs.selectedClientVehicle = document.getElementById("selectedClientVehicle");

  refs.inventoryForm = document.getElementById("inventoryForm");
  refs.inventoryName = document.getElementById("inventoryName");
  refs.inventoryBrand = document.getElementById("inventoryBrand");
  refs.inventorySku = document.getElementById("inventorySku");
  refs.inventoryCategory = document.getElementById("inventoryCategory");
  refs.inventoryPresentation = document.getElementById("inventoryPresentation");
  refs.inventorySupplier = document.getElementById("inventorySupplier");
  refs.inventoryLocation = document.getElementById("inventoryLocation");
  refs.inventoryStock = document.getElementById("inventoryStock");
  refs.inventoryMinStock = document.getElementById("inventoryMinStock");
  refs.inventoryCost = document.getElementById("inventoryCost");
  refs.inventoryTax = document.getElementById("inventoryTax");
  refs.inventoryPrice = document.getElementById("inventoryPrice");
  refs.inventoryNotes = document.getElementById("inventoryNotes");
  refs.inventoryCards = document.getElementById("inventoryCards");
  refs.inventoryAlerts = document.getElementById("inventoryAlerts");

  refs.clientForm = document.getElementById("clientForm");
  refs.clientName = document.getElementById("clientName");
  refs.clientPhone = document.getElementById("clientPhone");
  refs.clientEmail = document.getElementById("clientEmail");
  refs.clientVehicle = document.getElementById("clientVehicle");
  refs.clientNotes = document.getElementById("clientNotes");
  refs.clientsTableBody = document.getElementById("clientsTableBody");

  refs.vehicleForm = document.getElementById("vehicleForm");
  refs.vehicleClient = document.getElementById("vehicleClient");
  refs.newClientForm = document.getElementById("newClientForm");
  refs.newClientName = document.getElementById("newClientName");
  refs.newClientPhone = document.getElementById("newClientPhone");
  refs.newClientEmail = document.getElementById("newClientEmail");
  refs.vehiclePlate = document.getElementById("vehiclePlate");
  refs.vehicleMake = document.getElementById("vehicleMake");
  refs.vehicleModel = document.getElementById("vehicleModel");
  refs.vehicleYear = document.getElementById("vehicleYear");
  refs.vehicleColor = document.getElementById("vehicleColor");
  refs.vehicleMileage = document.getElementById("vehicleMileage");
  refs.vehicleEngine = document.getElementById("vehicleEngine");
  refs.vehicleNotes = document.getElementById("vehicleNotes");
  refs.vehiclesTableBody = document.getElementById("vehiclesTableBody");

  refs.historyFeed = document.getElementById("historyFeed");
  refs.historyTableBody = document.getElementById("historyTableBody");

  refs.settingsForm = document.getElementById("settingsForm");
  refs.settingsBusinessName = document.getElementById("settingsBusinessName");
  refs.settingsManager = document.getElementById("settingsManager");
  refs.settingsPhone = document.getElementById("settingsPhone");
  refs.settingsEmail = document.getElementById("settingsEmail");
  refs.settingsLocation = document.getElementById("settingsLocation");
  refs.brandName = document.getElementById("brandName");
  refs.brandSubtitle = document.getElementById("brandSubtitle");
  refs.themeChoices = Array.from(document.querySelectorAll(".theme-choice"));
  refs.systemSummary = document.getElementById("systemSummary");

  refs.toastStack = document.getElementById("toastStack");
}

function init() {
  // Inicializar state primero
  state = loadState();
  
  cacheDom();
  bindEvents();
  seedFormDates();
  applyTheme(state.theme || "dark");
  fillSettingsForm();
  updateBrand();
  
  // Cargar configuraciones solo si existen las funciones
  if (typeof loadGitHubConfig === 'function') {
    loadGitHubConfig(); // Cargar configuración de GitHub
  }
  if (typeof loadFirebaseConfig === 'function') {
    loadFirebaseConfig(); // Cargar configuración de Firebase
  }
  
  switchSection("dashboard");
  renderAll();
  
  // Cargar datos asíncronos después de inicializar
  loadAsyncData();
  
  // Iniciar carga de clientes desde Firestore en tiempo real
  loadClientsFromFirestore();
}

async function loadAsyncData() {
  // Intentar cargar desde Firebase para sincronización entre dispositivos
  try {
    const firebaseData = await loadFromFirebase();
    if (firebaseData) {
      state = { ...state, ...firebaseData };
      persistState(); // Guardar en localStorage
      renderAll(); // Actualizar UI
      console.log('🔄 Datos sincronizados desde Firebase');
    }
  } catch (error) {
    console.warn('Error cargando desde Firebase:', error);
    // No mostrar error al usuario, solo continuar
  }
  
  // Intentar cargar desde GitHub como respaldo
  try {
    const githubData = await loadFromGitHub();
    if (githubData && !localStorage.getItem(STORAGE_KEY)) {
      state = { ...state, ...githubData };
      persistState(); // Guardar en localStorage
      renderAll(); // Actualizar UI
      console.log('🔄 Datos cargados desde GitHub');
    }
  } catch (error) {
    console.warn('Error cargando desde GitHub:', error);
    // No mostrar error al usuario, solo continuar
  }
}

function bindEvents() {
  document.addEventListener("click", handleDocumentClick);
  
  // Event listeners para formularios - cambiar submit por click
  refs.orderForm.addEventListener("click", function(e) {
    if (e.target.type === "button" && e.target.onclick && e.target.onclick.toString().includes('guardarOrden')) {
      e.preventDefault();
      guardarOrden();
    }
  });
  
  refs.inventoryForm.addEventListener("click", function(e) {
    if (e.target.type === "button" && e.target.onclick && e.target.onclick.toString().includes('guardarProducto')) {
      e.preventDefault();
      guardarProducto();
    }
  });
  
  refs.clientForm.addEventListener("click", function(e) {
    if (e.target.type === "button" && e.target.onclick && e.target.onclick.toString().includes('guardar')) {
      e.preventDefault();
      guardar();
    }
  });
  
  // Solo agregar event listeners si los elementos existen
  if (refs.inventorySearch) {
    refs.inventorySearch.addEventListener("input", renderInventory);
  }
  if (refs.themeToggle) {
    refs.themeToggle.addEventListener("click", toggleTheme);
  }
  if (refs.menuToggle) {
    refs.menuToggle.addEventListener("click", toggleMenu);
  }
  
  // Event listener para el selector de clientes en formulario de vehículos
  if (refs.vehicleClient) {
    refs.vehicleClient.addEventListener("change", handleVehicleClientChange);
  }
  
  // Event listeners para cálculo automático de margen
  if (refs.inventoryCost) {
    refs.inventoryCost.addEventListener("input", calculateMargin);
  }
  if (refs.inventoryTax) {
    refs.inventoryTax.addEventListener("change", calculateMargin);
  }
  if (refs.inventoryPrice) {
    refs.inventoryPrice.addEventListener("input", calculateMargin);
  }
}

document.addEventListener("DOMContentLoaded", init);

function handleDocumentClick(event) {
  const sectionButton = event.target.closest("[data-section-target]");
  if (sectionButton) {
    console.log("🎯 Click en botón de sección:", sectionButton.dataset.sectionTarget);
    switchSection(sectionButton.dataset.sectionTarget);
    return;
  }

  // Cerrar menú al hacer clic fuera de él
  const sidebar = event.target.closest(".sidebar");
  const menuToggle = event.target.closest("#menuToggle");
  
  if (!sidebar && !menuToggle) {
    closeMenu();
  }

  const themeButton = event.target.closest("[data-theme-choice]");
  if (themeButton) {
    applyTheme(themeButton.dataset.themeChoice);
    persistState();
    renderSettings();
    showToast("Tema actualizado.");
    return;
  }

  const orderButton = event.target.closest("[data-order-action]");
  if (orderButton) {
    handleOrderAction(orderButton.dataset.orderAction, orderButton.dataset.orderId);
    return;
  }

  const inventoryButton = event.target.closest("[data-item-action]");
  if (inventoryButton) {
    handleInventoryAction(inventoryButton.dataset.itemAction, inventoryButton.dataset.itemId);
    return;
  }

  if (event.target === refs.backdrop) {
    closeMenu();
  }
}

function handleOrderSubmit(event) {
  event.preventDefault();
  
  let clientData;
  if (refs.orderClientSelect.value === "new") {
    // Crear nuevo cliente automáticamente
    clientData = {
      id: createId("CLI"),
      name: refs.orderClient.value.trim(),
      phone: refs.orderPhone.value.trim(),
      email: "",
      vehicle: `${refs.orderMake.value} ${refs.orderModel.value}`,
      notes: `Creado automáticamente desde orden de trabajo - Vehículo: ${refs.orderMake.value} ${refs.orderModel.value} (${refs.orderYear.value})`
    };
    state.clients.unshift(clientData);
  } else if (refs.orderClientSelect.value) {
    // Usar cliente existente
    clientData = state.clients.find(c => c.id === refs.orderClientSelect.value);
  }

  const order = {
    id: createId("OT"),
    createdAt: refs.orderDate.value,
    dueDate: refs.orderDueDate?.value || "",
    client: clientData ? clientData.name : refs.orderClient.value.trim(),
    phone: clientData ? clientData.phone : refs.orderPhone.value.trim(),
    vehicle: document.getElementById("orderVehicle")?.value.trim() || "",
    make: refs.orderMake.value.trim(),
    model: refs.orderModel.value.trim(),
    color: refs.orderColor.value.trim(),
    year: refs.orderYear.value,
    plate: refs.orderPlate.value.trim().toUpperCase(),
    service: refs.orderService?.value.trim() || "",
    mechanic: refs.orderMechanic.value.trim(),
    priority: refs.orderPriority.value,
    estimate: refs.orderEstimate?.value || "",
    diagnosis: refs.orderDiagnosis.value.trim(),
    notes: refs.orderNotes.value.trim(),
    status: "Recepcion"
  };

  state.orders.unshift(order);
  saveState();
  renderAll();
  refs.orderForm.reset();
  seedFormDates();
  showToast("Orden registrada correctamente.");
  
  // Resetear selección de cliente
  refs.orderClientSelect.value = "";
  handleClientSelect();
}

function calculateMargin() {
  const cost = parseFloat(refs.inventoryCost.value) || 0;
  const taxRate = parseFloat(refs.inventoryTax.value) || 0;
  const salePrice = parseFloat(refs.inventoryPrice.value) || 0;
  
  // Calcular costo total con impuesto
  const totalCost = cost * (1 + taxRate / 100);
  
  // Calcular margen en pesos y porcentaje
  const marginAmount = salePrice - totalCost;
  const marginPercent = totalCost > 0 ? (marginAmount / totalCost) * 100 : 0;
  
  // Actualizar display del margen
  const marginDisplay = document.querySelector('.margin-display');
  if (marginDisplay) {
    const amountElement = marginDisplay.querySelector('.margin-amount');
    const percentElement = marginDisplay.querySelector('.margin-percent');
    
    amountElement.textContent = formatCurrency(marginAmount);
    percentElement.textContent = `${marginPercent.toFixed(1)}%`;
    
    // Cambiar colores según el margen
    if (marginAmount < 0) {
      amountElement.style.color = 'var(--danger)';
      percentElement.style.color = 'var(--danger)';
      percentElement.style.background = 'rgba(239, 68, 68, 0.1)';
    } else if (marginPercent < 10) {
      amountElement.style.color = 'var(--warning)';
      percentElement.style.color = 'var(--warning)';
      percentElement.style.background = 'rgba(251, 191, 36, 0.1)';
    } else {
      amountElement.style.color = 'var(--success)';
      percentElement.style.color = 'var(--brand)';
      percentElement.style.background = 'var(--brand-soft)';
    }
  }
}

function handleInventorySubmit(event) {
  event.preventDefault();

  const item = {
    id: createId("INV"),
    name: document.getElementById("inventoryName").value.trim(),
    brand: document.getElementById("inventoryBrand").value.trim(),
    sku: document.getElementById("inventorySku").value.trim(),
    category: document.getElementById("inventoryCategory").value,
    presentation: document.getElementById("inventoryPresentation").value,
    supplier: document.getElementById("inventorySupplier").value.trim(),
    location: document.getElementById("inventoryLocation").value.trim(),
    stock: Number(document.getElementById("inventoryStock").value),
    minStock: Number(document.getElementById("inventoryMinStock").value),
    cost: Number(document.getElementById("inventoryCost").value),
    tax: Number(document.getElementById("inventoryTax").value),
    price: Number(document.getElementById("inventoryPrice").value),
    notes: document.getElementById("inventoryNotes").value.trim()
  };

  state.inventory.unshift(item);
  addMovement(item, item.stock, "Entrada inicial");
  saveState();
  renderAll();
  refs.inventoryForm.reset();
  calculateMargin(); // Resetear el display del margen
  
  // Cerrar formulario después de guardar
  toggleInventoryForm();
  
  showToast("Aceite agregado al inventario.");
  switchSection("inventario");
}

function handleClientSubmit(event) {
  event.preventDefault();

  const client = {
    id: createId("CLI"),
    name: document.getElementById("clientName").value.trim(),
    phone: document.getElementById("clientPhone").value.trim(),
    email: document.getElementById("clientEmail").value.trim(),
    vehicle: document.getElementById("clientVehicle").value.trim(),
    notes: document.getElementById("clientNotes").value.trim(),
    lastService: "Registro manual",
    lastVisit: todayISO()
  };

  const existing = state.clients.find((entry) => sameText(entry.phone, client.phone) || sameText(entry.name, client.name));
  if (existing) {
    existing.phone = client.phone;
    existing.email = client.email;
    existing.vehicle = client.vehicle;
    existing.notes = client.notes;
    existing.lastVisit = client.lastVisit;
  } else {
    state.clients.unshift(client);
  }

  saveState();
  renderAll();
  refs.clientForm.reset();
  updateVehicleClientOptions();
  showToast("Cliente guardado.");
}

function editVehicle(vehicleId) {
  const vehicle = state.vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return;
  
  refs.vehicleClient.value = vehicle.clientId;
  document.getElementById("vehiclePlate").value = vehicle.plate;
  document.getElementById("vehicleMake").value = vehicle.make;
  document.getElementById("vehicleModel").value = vehicle.model;
  document.getElementById("vehicleYear").value = vehicle.year;
  document.getElementById("vehicleColor").value = vehicle.color;
  document.getElementById("vehicleMileage").value = vehicle.mileage;
  document.getElementById("vehicleEngine").value = vehicle.engine;
  document.getElementById("vehicleNotes").value = vehicle.notes;
  
  switchSection("vehiculos");
  showToast("Editando vehiculo. Modifica los datos y guarda.");
}

function deleteVehicle(vehicleId) {
  if (!confirm("¿Estas seguro de eliminar este vehiculo? Esta accion no se puede deshacer.")) {
    return;
  }
  
  state.vehicles = state.vehicles.filter(v => v.id !== vehicleId);
  saveState();
  renderAll();
  showToast("Vehiculo eliminado.");
}

function editClient(clientId) {
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;
  
  document.getElementById("clientName").value = client.name;
  document.getElementById("clientPhone").value = client.phone;
  document.getElementById("clientEmail").value = client.email || "";
  document.getElementById("clientVehicle").value = client.vehicle || "";
  document.getElementById("clientNotes").value = client.notes || "";
  
  switchSection("clientes");
  showToast("Editando cliente. Modifica los datos y guarda.");
}

function deleteClient(clientId) {
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;
  
  // Verificar si tiene vehículos asociados
  const clientVehicles = state.vehicles.filter(v => v.clientId === clientId);
  if (clientVehicles.length > 0) {
    showToast(`No se puede eliminar. Tiene ${clientVehicles.length} vehículo(s) asociado(s).`, "danger");
    return;
  }
  
  if (!confirm(`¿Estas seguro de eliminar al cliente "${client.name}"? Esta accion no se puede deshacer.`)) {
    return;
  }
  
  state.clients = state.clients.filter(c => c.id !== clientId);
  saveState();
  renderAll();
  updateVehicleClientOptions();
  showToast("Cliente eliminado.");
}

function viewOrderDetails(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  
  showToast(`Orden ${orderId}: ${order.client} - ${order.vehicle} - ${formatCurrency(order.estimate)}`);
}

function handleVehicleClientChange() {
  const isCreatingNew = refs.vehicleClient.value === "new-client";
  refs.newClientForm.style.display = isCreatingNew ? "block" : "none";
  
  if (isCreatingNew) {
    refs.newClientName.focus();
  }
}

function createNewClientFromVehicle() {
  const name = refs.newClientName.value.trim();
  const phone = refs.newClientPhone.value.trim();
  const email = refs.newClientEmail.value.trim();
  
  if (!name || !phone) {
    showToast("Nombre y teléfono son requeridos para el nuevo cliente", "danger");
    return null;
  }
  
  // Verificar si ya existe
  const existing = state.clients.find(c => 
    sameText(c.phone, phone) || sameText(c.name, name)
  );
  
  if (existing) {
    showToast("Este cliente ya existe", "warning");
    return existing.id;
  }
  
  // Crear nuevo cliente
  const newClient = {
    id: createId("CLI"),
    name: name,
    phone: phone,
    email: email || "",
    vehicle: "",
    notes: "Creado desde formulario de vehículos",
    lastService: "Registro inicial",
    lastVisit: todayISO()
  };
  
  state.clients.unshift(newClient);
  showToast(`Cliente "${name}" creado correctamente`, "success");
  
  return newClient.id;
}

async function handleVehicleSubmit(event) {
  event.preventDefault();

  const clientId = refs.vehicleClient.value;
  let actualClientId = clientId;

  // Si se seleccionó "crear nuevo cliente"
  if (clientId === "new-client") {
    actualClientId = await createNewClientFromVehicle();
    if (!actualClientId) {
      showToast("Error al crear el cliente", "danger");
      return;
    }
  }

  const vehicle = {
    id: createId("VEH"),
    clientId: actualClientId,
    plate: document.getElementById("vehiclePlate").value.trim().toUpperCase(),
    make: document.getElementById("vehicleMake").value.trim(),
    model: document.getElementById("vehicleModel").value.trim(),
    year: document.getElementById("vehicleYear").value.trim(),
    color: document.getElementById("vehicleColor").value.trim(),
    mileage: document.getElementById("vehicleMileage").value.trim(),
    engine: document.getElementById("vehicleEngine").value.trim(),
    notes: document.getElementById("vehicleNotes").value.trim(),
    createdAt: todayISO()
  };

  const existingVehicle = state.vehicles.find((entry) => sameText(entry.plate, vehicle.plate));
  if (existingVehicle) {
    existingVehicle.clientId = vehicle.clientId;
    existingVehicle.make = vehicle.make;
    existingVehicle.model = vehicle.model;
    existingVehicle.year = vehicle.year;
    existingVehicle.color = vehicle.color;
    existingVehicle.mileage = vehicle.mileage;
    existingVehicle.engine = vehicle.engine;
    existingVehicle.notes = vehicle.notes;
    showToast("Vehiculo actualizado correctamente");
  } else {
    state.vehicles.unshift(vehicle);
    showToast("Vehiculo guardado correctamente");
  }

  saveState();
  renderAll();
  refs.vehicleForm.reset();
  refs.newClientForm.style.display = "none";
  updateVehicleClientOptions();
  switchSection("vehiculos");
}

function handleAppointmentSubmit(event) {
  event.preventDefault();

  state.appointments.unshift({
    id: createId("CIT"),
    client: document.getElementById("appointmentClient").value.trim(),
    service: document.getElementById("appointmentService").value.trim(),
    date: refs.appointmentDate.value,
    time: document.getElementById("appointmentTime").value,
    technician: document.getElementById("appointmentTechnician").value.trim()
  });

  persistState();
  renderAll();
  refs.appointmentForm.reset();
  refs.appointmentDate.value = todayISO();
  showToast("Cita agendada.");
  switchSection("agenda");
}

function handleSettingsSubmit(event) {
  event.preventDefault();

  state.settings = {
    businessName: refs.settingsBusinessName.value.trim(),
    manager: refs.settingsManager.value.trim(),
    phone: refs.settingsPhone.value.trim(),
    email: refs.settingsEmail.value.trim(),
    location: refs.settingsLocation.value.trim()
  };

  persistState();
  updateBrand();
  renderSettings();
  showToast("Configuracion guardada.");
}

function handleOrderAction(action, orderId) {
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order || action !== "advance") {
    return;
  }

  const currentIndex = ORDER_FLOW.indexOf(order.status);
  if (currentIndex < ORDER_FLOW.length - 1) {
    order.status = ORDER_FLOW[currentIndex + 1];
    if (order.status === "Entregado") {
      order.deliveredAt = todayISO();
    }
    persistState();
    renderAll();
    showToast("La orden avanzo a la siguiente etapa.");
  }
}

function handleInventoryAction(action, itemId) {
  const item = state.inventory.find((entry) => entry.id === itemId);
  if (!item) {
    return;
  }

  if (action === "minus" && item.stock > 0) {
    item.stock -= 1;
    addMovement(item, -1, "Salida");
  }

  if (action === "plus") {
    item.stock += 1;
    addMovement(item, 1, "Entrada");
  }

  if (action === "plus5") {
    item.stock += 5;
    addMovement(item, 5, "Reabasto");
  }

  persistState();
  renderAll();
}

function handleClientSelect() {
  const selectedValue = refs.orderClientSelect.value;
  
  if (selectedValue === "new") {
    // Mostrar campos para nuevo cliente
    refs.newClientFields.style.display = "block";
    refs.existingClientInfo.style.display = "none";
    refs.orderClient.required = true;
    refs.orderPhone.required = true;
  } else if (selectedValue) {
    // Mostrar información del cliente existente
    const client = state.clients.find(c => c.id === selectedValue);
    if (client) {
      refs.newClientFields.style.display = "none";
      refs.existingClientInfo.style.display = "block";
      refs.orderClient.required = false;
      refs.orderPhone.required = false;
      
      // Mostrar datos del cliente
      refs.selectedClientName.textContent = client.name;
      refs.selectedClientPhone.textContent = client.phone;
      refs.selectedClientVehicle.textContent = client.vehicle || "No especificado";
    }
  } else {
    // Ocultar todo si no hay selección
    refs.newClientFields.style.display = "none";
    refs.existingClientInfo.style.display = "none";
    refs.orderClient.required = false;
    refs.orderPhone.required = false;
  }
}

function renderOrders() {
  // No mostrar tarjetas existentes, solo cuando se agregue una nueva
  refs.ordersCards.innerHTML = '<div class="empty-state">Agrega una nueva orden para verla aquí.</div>';
}

function editOrder(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  
  // Llenar formulario con datos de la orden
  refs.orderDate.value = order.createdAt;
  refs.orderMechanic.value = order.mechanic || "";
  refs.orderMake.value = order.make;
  refs.orderModel.value = order.model;
  refs.orderColor.value = order.color;
  refs.orderYear.value = order.year;
  refs.orderPlate.value = order.plate;
  refs.orderPriority.value = order.priority;
  refs.orderDiagnosis.value = order.diagnosis || "";
  refs.orderNotes.value = order.notes || "";
  
  // Buscar y seleccionar cliente si existe
  const client = state.clients.find(c => c.name === order.client && c.phone === order.phone);
  if (client) {
    refs.orderClientSelect.value = client.id;
    handleClientSelect();
  } else {
    refs.orderClientSelect.value = "new";
    refs.orderClient.value = order.client;
    refs.orderPhone.value = order.phone;
    handleClientSelect();
  }
  
  switchSection("ordenes");
  showToast("Editando orden. Modifica los datos y guarda.");
}

function updateOrderStatus(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  
  // Ciclo de estados: Recepcion -> Diagnostico -> Reparacion -> Entregado
  const statusCycle = ["Recepcion", "Diagnostico", "Reparacion", "Entregado"];
  const currentIndex = statusCycle.indexOf(order.status || "Recepcion");
  const nextIndex = (currentIndex + 1) % statusCycle.length;
  order.status = statusCycle[nextIndex];
  
  saveState();
  renderAll();
  showToast(`Estado actualizado: ${order.status}`);
}

function renderAll() {
  renderDashboard();
  renderOrders();
  renderInventoryAlerts();
  renderInventory();
  renderClients();
  renderVehicles();
  renderHistory();
  renderSettings();
}

function renderDashboard() {
  const openOrders = state.orders.filter((order) => order.status !== "Entregado");
  const lowStockItems = state.inventory.filter((item) => getInventoryLevel(item) !== "Optimo");

  refs.dashboardOrders.innerHTML = renderList(
    sortOrders(state.orders)
      .filter((order) => order.status !== "Entregado")
      .slice(0, 4)
      .map((order) => {
        const vehicleInfo = `${order.make} ${order.model} ${order.year}`;
        return `
        <article class="row-card">
          <div class="row-card-main">
            <strong>${safe(order.id)} · ${safe(order.client)}</strong>
            <small>${safe(vehicleInfo)} · ${safe(order.plate)}</small>
            <div class="row-meta">
              ${badgeHtml(order.priority, badgeClassForPriority(order.priority))}
              ${badgeHtml(order.status, badgeClassForStatus(order.status))}
            </div>
          </div>
          <div class="row-card-side">
            <strong>${safe(order.mechanic)}</strong>
            <small>Tecnico</small>
          </div>
        </article>
      `}),
    "No hay ordenes activas."
  );

  refs.dashboardInventory.innerHTML = renderList(
    state.inventory
      .filter((item) => getInventoryLevel(item) !== "Optimo")
      .sort((left, right) => left.stock - right.stock)
      .slice(0, 4)
      .map((item) => `
        <article class="row-card">
          <div class="row-card-main">
            <strong>${safe(item.name)}</strong>
            <small>${safe(item.category)} · ${safe(item.location)}</small>
            <div class="row-meta">${badgeHtml(getInventoryLevel(item), badgeClassForInventory(item))}</div>
          </div>
          <div class="row-card-side">
            <strong>${item.stock} uds</strong>
            <small>Minimo ${item.minStock}</small>
          </div>
        </article>
      `),
    "Todo el inventario esta en buen nivel."
  );

  refs.dashboardAgenda.innerHTML = renderList(
    sortOrders(state.orders)
      .filter((order) => order.status !== "Entregado")
      .slice(0, 5)
      .map((order) => {
        const vehicleInfo = `${order.make} ${order.model} ${order.year}`;
        return `
        <article class="row-card">
          <div class="row-card-main">
            <strong>${safe(order.id)} · ${safe(order.client)}</strong>
            <small>${safe(vehicleInfo)} · ${safe(order.color)}</small>
            <div class="row-meta">
              ${badgeHtml(order.priority, badgeClassForPriority(order.priority))}
              ${badgeHtml(order.status, badgeClassForStatus(order.status))}
            </div>
          </div>
          <div class="row-card-side">
            <strong>${safe(order.mechanic)}</strong>
            <small>Tecnico</small>
          </div>
        </article>
      `}),
    "No hay citas programadas."
  );
}

// Eliminar esta función duplicada - ya existe renderOrders() arriba
// function renderOrders() {
//   // Mostrar solo historial de ordenes anteriores en lugar de listado general
//   const allOrders = sortOrders(state.orders);
//   const recentOrders = allOrders.slice(0, 10); // Últimas 10 ordenes como historial
//
//   // Renderizar historial en el panel de ordenes anteriores
//   const orderHistoryElement = document.getElementById("orderHistory");
//   if (orderHistoryElement) {
//     orderHistoryElement.innerHTML = recentOrders.length
//       ? recentOrders.map((order) => {
//         const vehicleInfo = `${order.make} ${order.model} ${order.year}`;
//         return `
//           <article class="row-card">
//             <div class="row-card-main">
//               <strong>${safe(order.id)} · ${safe(order.client)}</strong>
//               <small>${safe(vehicleInfo)} · ${safe(order.plate)}</small>
//               <div class="row-meta">
//                 ${badgeHtml(order.priority, badgeClassForPriority(order.priority))}
//                 ${badgeHtml(order.status, badgeClassForStatus(order.status))}
//               </div>
//             </div>
//             <div class="row-card-side">
//               <strong>${formatDate(order.createdAt)}</strong>
//               <small>${safe(order.mechanic || "Sin asignar")}</small>
//             </div>
//           </article>
//         `;
//       }).join("")
//       : '<div class="empty-state">No hay ordenes registradas.</div>';
//   }
// }

function renderInventoryAlerts() {
  const lowStockItems = state.inventory.filter(item => 
    item.stock <= item.minStock && item.stock > 0
  );
  
  const criticalStockItems = state.inventory.filter(item => 
    item.stock === 0
  );

  if (lowStockItems.length === 0 && criticalStockItems.length === 0) {
    refs.inventoryAlerts.innerHTML = '';
    return;
  }

  let alertsHTML = '';

  // Alerta de stock crítico (sin existencia)
  if (criticalStockItems.length > 0) {
    alertsHTML += `
      <div class="alert-card">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title">¡Stock Crítico!</div>
          <div class="alert-message">
            Los siguientes productos están agotados y necesitan reabastecimiento urgente:
            ${criticalStockItems.map(item => `
              <div class="alert-item">
                <span class="alert-product">${safe(item.name)} (${safe(item.brand)})</span>
                <span class="alert-stock">AGOTADO</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Alerta de stock bajo
  if (lowStockItems.length > 0) {
    alertsHTML += `
      <div class="alert-card">
        <div class="alert-icon">📉</div>
        <div class="alert-content">
          <div class="alert-title">Stock Bajo</div>
          <div class="alert-message">
            Los siguientes productos están por debajo del nivel mínimo:
            ${lowStockItems.map(item => `
              <div class="alert-item">
                <span class="alert-product">${safe(item.name)} (${safe(item.brand)})</span>
                <span class="alert-stock">${item.stock} uds (mín: ${item.minStock})</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  refs.inventoryAlerts.innerHTML = alertsHTML;
}

function renderInventory() {
  const search = refs.inventorySearch?.value?.trim().toLowerCase() || "";

  const filtered = state.inventory.filter((item) => {
    const matchesSearch =
      !search ||
      [item.name, item.brand, item.sku, item.category, item.supplier, item.location].some((value) =>
        String(value).toLowerCase().includes(search)
      );

    return matchesSearch;
  });

  // Renderizar como cards en lugar de tabla
  refs.inventoryCards.innerHTML = filtered.length
    ? filtered.map((item) => {
        const level = getInventoryLevel(item);
        const levelClass = badgeClassForInventory(item);
        
        // Calcular margen para mostrar en el card
        const totalCost = item.cost * (1 + (item.tax || 0) / 100);
        const marginAmount = item.price - totalCost;
        const marginPercent = totalCost > 0 ? (marginAmount / totalCost) * 100 : 0;
        
        return `
          <div class="inventory-card" data-item-id="${safe(item.id)}">
            <div class="card-header">
              <div class="card-title">
                <strong>${safe(item.name)}</strong>
                <small>${safe(item.brand || "")} · SKU: ${safe(item.sku || "")}</small>
              </div>
              <div class="card-badges">
                ${badgeHtml(item.category || "General", "badge--info")}
                ${badgeHtml(level, levelClass)}
              </div>
            </div>
            
            <div class="card-body">
              <div class="card-info">
                <div class="info-item">
                  <span class="info-label">Presentación:</span>
                  <span class="info-value">${safe(item.presentation || "N/A")}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Ubicación:</span>
                  <span class="info-value">${safe(item.location)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Stock:</span>
                  <span class="info-value stock-value ${level.toLowerCase()}">${item.stock} unidades</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Mínimo:</span>
                  <span class="info-value">${item.minStock} unidades</span>
                </div>
              </div>
              
              <div class="card-pricing">
                <div class="price-item">
                  <span class="price-label">Costo:</span>
                  <span class="price-value">${formatCurrency(item.cost)}</span>
                </div>
                <div class="price-item">
                  <span class="price-label">Venta:</span>
                  <span class="price-value">${formatCurrency(item.price)}</span>
                </div>
              </div>
              
              <div class="card-margin">
                <div class="margin-item">
                  <span class="margin-label">Margen:</span>
                  <span class="margin-value ${marginAmount < 0 ? 'negative' : marginPercent < 10 ? 'low' : 'good'}">
                    ${formatCurrency(marginAmount)} (${marginPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div class="card-info-row">
              <div class="info-item">
                <span class="info-label">Proveedor:</span>
                <span class="info-value">${safe(item.supplier)}</span>
              </div>
            </div>
            
            ${item.notes ? `
            <div class="card-notes">
              <span class="notes-label">Notas:</span>
              <span class="notes-value">${safe(item.notes)}</span>
            </div>
            ` : ''}
            
            <div class="card-actions">
              <button class="mini-btn" type="button" onclick="editInventoryItem('${safe(item.id)}')">Editar</button>
              <button class="mini-btn" type="button" onclick="adjustStock('${safe(item.id)}', 1)">+</button>
              <button class="mini-btn" type="button" onclick="adjustStock('${safe(item.id)}', -1)">-</button>
            </div>
          </div>
        `;
      }).join("")
    : '<div class="empty-state">No hay aceites registrados.</div>';
}

function renderClients() {
  const search = refs.clientSearch?.value?.trim().toLowerCase() || "";

  const filtered = state.clients.filter((client) => {
    return !search ||
      [client.nombre || client.name, client.telefono || client.phone, client.email, client.vehiculo || client.vehicle].some((value) =>
        String(value).toLowerCase().includes(search)
      );
  });

  refs.clientsTableBody.innerHTML = filtered.length
    ? filtered
        .slice()
        .sort((left, right) => (right.fechaRegistro || right.createdAt || "").localeCompare(left.fechaRegistro || left.createdAt || ""))
        .map((client) => `
          <tr>
            <td><strong>${safe(client.nombre || client.name)}</strong></td>
            <td>
              <div class="cell-title">
                <strong>${safe(client.telefono || client.phone || "Sin telefono")}</strong>
                <small>${safe(client.email || "Sin correo")}</small>
              </div>
            </td>
            <td>${safe(client.vehiculo || client.vehicle || "Sin vehiculo")}</td>
            <td>${formatDate(client.fechaRegistro || client.createdAt)}</td>
            <td>
              <div class="action-set">
                <button class="mini-btn" type="button" onclick="editClient('${safe(client.id)}')">Editar</button>
                <button class="mini-btn" type="button" onclick="deleteClient('${safe(client.id)}')">Eliminar</button>
              </div>
            </td>
          </tr>
        `)
        .join("")
    : `<tr><td colspan="5"><div class="empty-state">No hay clientes registrados.</div></td></tr>`;
}

function renderVehicles() {
  // Mostrar vehículos de órdenes activas
  const activeOrders = state.orders.filter(order => order.status !== "Entregado");
  const vehiclesFromOrders = activeOrders.map(order => {
    const client = state.clients.find(c => 
      sameText(c.name, order.client) || sameText(c.phone, order.phone)
    );
    return {
      plate: order.plate,
      clientName: order.client,
      make: order.make,
      model: order.model,
      year: order.year,
      color: order.color,
      orderId: order.id,
      status: order.status,
      mechanic: order.mechanic
    };
  });

  refs.vehiclesTableBody.innerHTML = vehiclesFromOrders.length
    ? vehiclesFromOrders
        .map((vehicle) => `
          <tr>
            <td><strong>${safe(vehicle.plate)}</strong></td>
            <td>${safe(vehicle.clientName)}</td>
            <td>${safe(vehicle.make)} ${safe(vehicle.model)}</td>
            <td>${safe(vehicle.year)}</td>
            <td>${badgeHtml(vehicle.status, badgeClassForStatus(vehicle.status))}</td>
            <td>${safe(vehicle.mechanic || "Sin asignar")}</td>
            <td>
              <div class="action-set">
                <button class="mini-btn" type="button" onclick="viewOrderDetails('${safe(vehicle.orderId)}')">Ver orden</button>
              </div>
            </td>
          </tr>
        `)
        .join("")
    : `<tr><td colspan="7"><div class="empty-state">No hay vehiculos en taller actualmente.</div></td></tr>`;
}

function renderHistory() {
  const completedOrders = state.orders.filter(order => order.status === "Entregado");

  refs.historyTableBody.innerHTML = completedOrders.length
    ? completedOrders
        .map((order) => {
          const vehicleInfo = `${order.make} ${order.model} ${order.year}`;
          return `
          <tr>
            <td><strong>${safe(order.id)}</strong></td>
            <td>
              <div class="cell-title">
                <strong>${safe(order.client)}</strong>
                <small>${safe(vehicleInfo)}</small>
              </div>
            </td>
            <td>${safe(order.color || "N/A")}</td>
            <td>${formatDate(order.deliveredAt || order.createdAt)}</td>
            <td>
              <button class="ghost-btn" onclick="viewOrderDetails('${safe(order.id)}')">Ver</button>
            </td>
          </tr>
        `;
        })
        .join("")
    : `<tr><td colspan="5"><div class="empty-state">No hay ordenes completadas.</div></td></tr>`;
}

function renderSettings() {
  refs.themeChoices.forEach((choice) => {
    choice.classList.toggle("active", choice.dataset.themeChoice === state.theme);
  });

  refs.systemSummary.innerHTML = [
    summaryCard("Modo actual", state.theme === "dark" ? "Oscuro" : "Claro"),
    summaryCard("Ordenes registradas", String(state.orders.length)),
    summaryCard("Productos activos", String(state.inventory.length))
  ].join("");
}

function switchSection(sectionId) {
  console.log("🎯 Cambiando a sección:", sectionId);
  
  refs.sections.forEach((section) => {
    section.classList.toggle("active", section.id === sectionId);
  });

  refs.navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.sectionTarget === sectionId);
  });

  refs.sectionTitle.textContent = SECTION_TITLES[sectionId] || "Panel";
  closeMenu();
  
  console.log("✅ Sección cambiada a:", sectionId);
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
  persistState();
  renderSettings();
}

function applyTheme(theme) {
  state.theme = theme;
  refs.root.setAttribute("data-theme", theme);
  refs.themeToggle.textContent = theme === "dark" ? "Modo claro" : "Modo oscuro";
}

function toggleMenu() {
  console.log("🔄 Toggle menu llamado");
  document.body.classList.toggle("menu-open");
  console.log("📱 Clases del body:", document.body.classList.toString());
}

function closeMenu() {
  console.log("❌ Cerrar menú llamado");
  document.body.classList.remove("menu-open");
}

function seedFormDates() {
  if (refs.orderDate) {
    refs.orderDate.value = todayISO();
  }
  if (refs.appointmentDate) {
    refs.appointmentDate.value = todayISO();
  }
}

function fillSettingsForm() {
  if (refs.settingsBusinessName) {
    refs.settingsBusinessName.value = state.settings.businessName;
  }
  if (refs.settingsManager) {
    refs.settingsManager.value = state.settings.manager;
  }
  if (refs.settingsPhone) {
    refs.settingsPhone.value = state.settings.phone;
  }
  if (refs.settingsEmail) {
    refs.settingsEmail.value = state.settings.email;
  }
  if (refs.settingsLocation) {
    refs.settingsLocation.value = state.settings.location;
  }
}

function updateBrand() {
  refs.brandName.textContent = state.settings.businessName;
  refs.brandSubtitle.textContent = `Responsable ${state.settings.manager} · ${state.settings.location}`;
}

function syncClientFromOrder(order) {
  const existing = state.clients.find(
    (entry) => sameText(entry.phone, order.phone) || sameText(entry.name, order.client)
  );

  if (existing) {
    existing.name = order.client;
    existing.phone = order.phone;
    existing.vehicle = `${order.make} ${order.model} ${order.year}`;
    existing.lastService = "Recepción vehículo";
    existing.lastVisit = order.createdAt;
    existing.notes = existing.notes || `Color: ${order.color}`;
    return;
  }

  // Crear cliente automáticamente desde orden si no existe
  state.clients.unshift({
    id: createId("CLI"),
    name: order.client,
    phone: order.phone,
    email: "",
    vehicle: `${order.make} ${order.model} ${order.year}`,
    notes: `Color: ${order.color} - Creado automáticamente desde orden de trabajo`,
    lastService: "Recepción vehículo",
    lastVisit: order.createdAt
  });
}

function editInventoryItem(itemId) {
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) return;
  
  // Llenar formulario con datos del aceite
  document.getElementById("inventoryName").value = item.name;
  document.getElementById("inventoryBrand").value = item.brand || "";
  document.getElementById("inventorySku").value = item.sku || "";
  document.getElementById("inventoryCategory").value = item.category || "";
  document.getElementById("inventoryPresentation").value = item.presentation || "";
  document.getElementById("inventorySupplier").value = item.supplier;
  document.getElementById("inventoryLocation").value = item.location;
  document.getElementById("inventoryStock").value = item.stock;
  document.getElementById("inventoryMinStock").value = item.minStock;
  document.getElementById("inventoryCost").value = item.cost;
  document.getElementById("inventoryTax").value = item.tax || 0;
  document.getElementById("inventoryPrice").value = item.price;
  document.getElementById("inventoryNotes").value = item.notes || "";
  
  // Calcular margen al cargar los datos
  calculateMargin();
  
  switchSection("inventario");
  showToast("Editando aceite. Modifica los datos y guarda.");
}

function adjustStock(itemId, delta) {
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) return;
  
  const newStock = Math.max(0, item.stock + delta);
  const reason = delta > 0 ? "Entrada manual" : "Salida manual";
  
  item.stock = newStock;
  addMovement(item, delta, reason);
  saveState();
  renderAll();
  showToast(`Stock ajustado: ${delta > 0 ? '+' : ''}${delta} unidades`);
}

function addMovement(item, delta, reason) {
  state.movements.unshift({
    id: createId("MOV"),
    itemId: item.id,
    itemName: item.name,
    delta,
    reason,
    timestamp: new Date().toISOString()
  });
  state.movements = state.movements.slice(0, 18);
}

function renderList(items, emptyMessage) {
  return items.length ? items.join("") : `<div class="empty-state">${safe(emptyMessage)}</div>`;
}

function metricCard(label, value) {
  return `
    <article class="mini-metric">
      <span>${safe(label)}</span>
      <strong>${safe(value)}</strong>
    </article>
  `;
}

function summaryCard(label, value) {
  return `
    <article class="summary-item">
      <span>${safe(label)}</span>
      <strong>${safe(value)}</strong>
    </article>
  `;
}

function badgeHtml(text, className) {
  return `<span class="badge ${className}">${safe(text)}</span>`;
}

function badgeClassForPriority(priority) {
  if (priority === "Alta") {
    return "badge--danger";
  }
  if (priority === "Media") {
    return "badge--warning";
  }
  return "badge--info";
}

function badgeClassForStatus(status) {
  if (status === "Entregado") {
    return "badge--success";
  }
  if (status === "Listo") {
    return "badge--brand";
  }
  if (status === "Control final") {
    return "badge--info";
  }
  if (status === "Diagnostico") {
    return "badge--warning";
  }
  return "badge--brand";
}

function badgeClassForInventory(item) {
  const level = getInventoryLevel(item);
  if (level === "Critico") {
    return "badge--danger";
  }
  if (level === "Bajo") {
    return "badge--warning";
  }
  return "badge--success";
}

function getInventoryLevel(item) {
  if (item.stock <= 0 || item.stock < Math.max(1, Math.floor(item.minStock * 0.5))) {
    return "Critico";
  }
  if (item.stock <= item.minStock) {
    return "Bajo";
  }
  return "Optimo";
}

function sortOrders(orders) {
  if (!Array.isArray(orders)) {
    return [];
  }
  
  return orders
    .slice()
    .sort((left, right) => {
      // Validar que las órdenes existan
      if (!left || !right) return 0;
      
      const leftDelivered = left.status === "Entregado" ? 1 : 0;
      const rightDelivered = right.status === "Entregado" ? 1 : 0;
      if (leftDelivered !== rightDelivered) {
        return leftDelivered - rightDelivered;
      }

      const leftPriority = PRIORITY_WEIGHT[left.priority] ?? 3;
      const rightPriority = PRIORITY_WEIGHT[right.priority] ?? 3;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      // Validar dueDate antes de usar localeCompare
      const leftDueDate = left.dueDate || left.createdAt || "";
      const rightDueDate = right.dueDate || right.createdAt || "";
      
      return leftDueDate.localeCompare(rightDueDate);
    });
}

function upcomingAppointments() {
  return state.appointments
    .slice()
    .sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}

// Eliminar función duplicada - ya está definida arriba
// function persistState() {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
//   // Auto-guardar en backend después de cambios locales
//   saveToBackend();
// }

// Eliminar función duplicada - ya está definida arriba como async function
// function saveState() {
//   persistState();
// }

// Eliminar función duplicada - ya está definida arriba
// function loadState() {
//   const fallback = createInitialState();
//   const stored = localStorage.getItem(STORAGE_KEY);
//
//   if (!stored) {
//     return fallback;
//   }
//
//   try {
//     const parsed = JSON.parse(stored);
//     return {
//       ...fallback,
//       ...parsed,
//       settings: { ...fallback.settings, ...(parsed.settings || {}) },
//       orders: Array.isArray(parsed.orders) ? parsed.orders : fallback.orders,
//       inventory: Array.isArray(parsed.inventory) ? parsed.inventory : fallback.inventory,
//       movements: Array.isArray(parsed.movements) ? parsed.movements : fallback.movements,
//       clients: Array.isArray(parsed.clients) ? parsed.clients : fallback.clients,
//       appointments: Array.isArray(parsed.appointments) ? parsed.appointments : fallback.appointments
//     };
//   } catch (error) {
//     return fallback;
//   }
// }

function createInitialState() {
  return {
    theme: "dark",
    settings: {
      businessName: "Taller Borjon",
      manager: "Jefe de operaciones",
      phone: "664 555 0101",
      email: "recepcion@tallerborjon.mx",
      location: "Zona industrial"
    },
    orders: [
      {
        id: "OT-1001",
        createdAt: todayISO(),
        client: "Carlos Mendez",
        phone: "664 111 2233",
        make: "Nissan",
        model: "Versa",
        color: "Gris",
        year: "2020",
        plate: "ABC-123-A",
        mechanic: "Luis Gomez",
        priority: "Alta",
        diagnosis: "El clutch patina y vibra al arrancar.",
        notes: "Revisar volante y kit completo.",
        status: "Reparacion"
      },
      {
        id: "OT-1002",
        createdAt: todayISO(),
        client: "Mariana Soto",
        phone: "664 222 3344",
        make: "Chevrolet",
        model: "Spark",
        color: "Rojo",
        year: "2018",
        plate: "DEF-456-B",
        mechanic: "Pedro Ruiz",
        priority: "Media",
        diagnosis: "Perdida de potencia y consumo elevado.",
        notes: "Cambiar filtros y bujias.",
        status: "Diagnostico"
      },
      {
        id: "OT-1003",
        createdAt: datePlus(-1),
        client: "Jose Ibarra",
        phone: "664 333 4455",
        make: "Ford",
        model: "Ranger",
        color: "Azul",
        year: "2019",
        plate: "GHI-789-C",
        mechanic: "Adrian Leon",
        priority: "Alta",
        diagnosis: "Balatas agotadas y discos con desgaste.",
        notes: "Cliente espera entrega el mismo dia.",
        status: "Listo"
      }
    ],
    inventory: [
      {
        id: "INV-001",
        name: "Aceite 5W30",
        category: "Lubricantes",
        supplier: "Shell",
        location: "Estante A1",
        stock: 24,
        minStock: 10,
        cost: 280
      },
      {
        id: "INV-002",
        name: "Filtro de aceite",
        category: "Filtros",
        supplier: "Bosch",
        location: "Estante B2",
        stock: 45,
        minStock: 20,
        cost: 85
      },
      {
        id: "INV-003",
        name: "Balatas delanteras",
        category: "Frenos",
        supplier: "Brembo",
        location: "Estante C3",
        stock: 8,
        minStock: 15,
        cost: 520
      }
    ],
    movements: [],
    clients: [
      {
        id: "CLI-1",
        name: "Carlos Mendez",
        phone: "664 111 2233",
        email: "carlos@example.com",
        vehicle: "Nissan Versa 2020",
        notes: "Autoriza trabajos por telefono.",
        lastService: "Cambio de clutch",
        lastVisit: todayISO()
      },
      {
        id: "CLI-2",
        name: "Mariana Soto",
        phone: "664 222 3344",
        email: "mariana@example.com",
        vehicle: "Chevrolet Spark 2018",
        notes: "Prefiere citas por la manana.",
        lastService: "Afinacion mayor",
        lastVisit: todayISO()
      }
    ],
    vehicles: [
      {
        id: "VEH-1",
        clientId: "CLI-1",
        clientName: "Carlos Mendez",
        plate: "ABC-123-A",
        make: "Nissan",
        model: "Versa",
        year: "2020",
        color: "Gris",
        mileage: "45000",
        engine: "1.6L",
        notes: "Vehiculo en buen estado, mantenimiento regular",
        createdAt: todayISO(),
        lastVisit: todayISO()
      },
      {
        id: "VEH-2",
        clientId: "CLI-2",
        clientName: "Mariana Soto",
        plate: "DEF-456-B",
        make: "Chevrolet",
        model: "Spark",
        year: "2018",
        color: "Blanco",
        mileage: "32000",
        engine: "1.4L",
        notes: "Requiere revision de suspension proxima",
        createdAt: datePlus(-30),
        lastVisit: datePlus(-15)
      }
    ]
  };
}

function createId(prefix) {
  return `${prefix}-${String(Date.now()).slice(-6)}`;
}

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function datePlus(days) {
  const date = new Date(`${todayISO()}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function differenceInDays(current, previous) {
  const currentTime = new Date(`${current}T12:00:00`).getTime();
  const previousTime = new Date(`${previous}T12:00:00`).getTime();
  return Math.round((currentTime - previousTime) / 86400000);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  refs.toastStack.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function sameText(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };
    return map[character];
  });
}

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", init);
