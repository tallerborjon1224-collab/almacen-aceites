const STORAGE_KEY = "taller-pro-admin-v1";
const API_BASE = "http://localhost:3000";
const ORDER_FLOW = ["Recepcion", "Diagnostico", "Reparacion", "Control final", "Listo", "Entregado"];
const PRIORITY_WEIGHT = { Alta: 0, Media: 1, Baja: 2 };
const SECTION_TITLES = {
  dashboard: "Resumen general",
  ordenes: "Ordenes de trabajo",
  inventario: "Inventario",
  clientes: "Clientes",
  vehiculos: "Vehiculos",
  historial: "Historial",
  configuracion: "Configuracion"
};

let state = loadState();
const refs = {};

// Funciones de sincronización con backend
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

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheDom();
  bindEvents();
  seedFormDates();
  applyTheme(state.theme || "dark");
  fillSettingsForm();
  updateBrand();
  updateVehicleClientOptions();
  switchSection("dashboard");
  loadFromBackend(); // Cargar datos del servidor al iniciar
  renderAll();
}

function cacheDom() {
  refs.root = document.documentElement;
  refs.backdrop = document.getElementById("backdrop");
  refs.sectionTitle = document.getElementById("sectionTitle");
  refs.themeToggle = document.getElementById("themeToggle");
  refs.menuToggle = document.getElementById("menuToggle");
  refs.navLinks = Array.from(document.querySelectorAll(".nav-link"));
  refs.sections = Array.from(document.querySelectorAll(".page-section"));

  refs.heroOrders = document.getElementById("heroOrders");
  refs.heroAlerts = document.getElementById("heroAlerts");
  refs.heroRevenue = document.getElementById("heroRevenue");
  refs.metricOpenOrders = document.getElementById("metricOpenOrders");
  refs.metricDeliveredToday = document.getElementById("metricDeliveredToday");
  refs.metricLowStock = document.getElementById("metricLowStock");
  refs.metricRevenue = document.getElementById("metricRevenue");
  refs.dashboardOrders = document.getElementById("dashboardOrders");
  refs.dashboardInventory = document.getElementById("dashboardInventory");
  refs.dashboardAgenda = document.getElementById("dashboardAgenda");

  refs.orderForm = document.getElementById("orderForm");
  refs.orderDate = document.getElementById("orderDate");
  refs.orderDueDate = document.getElementById("orderDueDate");
  refs.orderSearch = document.getElementById("orderSearch");
  refs.orderStatusFilter = document.getElementById("orderStatusFilter");
  refs.orderPriorityFilter = document.getElementById("orderPriorityFilter");
  refs.orderStatusStrip = document.getElementById("orderStatusStrip");
  refs.orderSpotlight = document.getElementById("orderSpotlight");
  refs.ordersTableBody = document.getElementById("ordersTableBody");

  refs.inventoryForm = document.getElementById("inventoryForm");
  refs.inventorySearch = document.getElementById("inventorySearch");
  refs.inventoryStatusFilter = document.getElementById("inventoryStatusFilter");
  refs.inventoryMetrics = document.getElementById("inventoryMetrics");
  refs.movementFeed = document.getElementById("movementFeed");
  refs.inventoryTableBody = document.getElementById("inventoryTableBody");

  refs.clientForm = document.getElementById("clientForm");
  refs.clientMetrics = document.getElementById("clientMetrics");
  refs.clientSpotlight = document.getElementById("clientSpotlight");
  refs.clientsTableBody = document.getElementById("clientsTableBody");

  refs.vehicleForm = document.getElementById("vehicleForm");
  refs.vehicleClient = document.getElementById("vehicleClient");
  refs.newClientForm = document.getElementById("newClientForm");
  refs.newClientName = document.getElementById("newClientName");
  refs.newClientPhone = document.getElementById("newClientPhone");
  refs.newClientEmail = document.getElementById("newClientEmail");
  refs.vehicleMetrics = document.getElementById("vehicleMetrics");
  refs.vehicleSpotlight = document.getElementById("vehicleSpotlight");
  refs.vehiclesTableBody = document.getElementById("vehiclesTableBody");

  refs.historyMetrics = document.getElementById("historyMetrics");
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
  refs.systemSummary = document.getElementById("systemSummary");
  refs.themeChoices = Array.from(document.querySelectorAll("[data-theme-choice]"));
  refs.toastStack = document.getElementById("toastStack");
}

function bindEvents() {
  document.addEventListener("click", handleDocumentClick);
  refs.orderForm.addEventListener("submit", handleOrderSubmit);
  refs.inventoryForm.addEventListener("submit", handleInventorySubmit);
  refs.clientForm.addEventListener("submit", handleClientSubmit);
  refs.vehicleForm.addEventListener("submit", handleVehicleSubmit);
  refs.settingsForm.addEventListener("submit", handleSettingsSubmit);
  refs.orderSearch.addEventListener("input", renderOrders);
  refs.orderStatusFilter.addEventListener("change", renderOrders);
  refs.orderPriorityFilter.addEventListener("change", renderOrders);
  refs.inventorySearch.addEventListener("input", renderInventory);
  refs.inventoryStatusFilter.addEventListener("change", renderInventory);
  refs.vehicleClient.addEventListener("change", handleVehicleClientChange);
  refs.themeToggle.addEventListener("click", toggleTheme);
  refs.menuToggle.addEventListener("click", toggleMenu);
}

function handleDocumentClick(event) {
  const sectionButton = event.target.closest("[data-section-target]");
  if (sectionButton) {
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

  const order = {
    id: createId("OT"),
    createdAt: refs.orderDate.value,
    dueDate: refs.orderDueDate.value,
    client: document.getElementById("orderClient").value.trim(),
    phone: document.getElementById("orderPhone").value.trim(),
    vehicle: document.getElementById("orderVehicle").value.trim(),
    plate: document.getElementById("orderPlate").value.trim().toUpperCase(),
    service: document.getElementById("orderService").value.trim(),
    mechanic: document.getElementById("orderMechanic").value.trim(),
    priority: document.getElementById("orderPriority").value,
    estimate: Number(document.getElementById("orderEstimate").value),
    diagnosis: document.getElementById("orderDiagnosis").value.trim(),
    notes: document.getElementById("orderNotes").value.trim(),
    status: "Recepcion"
  };

  state.orders.unshift(order);
  syncClientFromOrder(order);
  syncVehicleFromOrder(order);
  persistState();
  renderAll();
  refs.orderForm.reset();
  seedFormDates();
  showToast("Orden de trabajo registrada.");
  switchSection("ordenes");
}

function handleInventorySubmit(event) {
  event.preventDefault();

  const item = {
    id: createId("INV"),
    name: document.getElementById("inventoryName").value.trim(),
    category: document.getElementById("inventoryCategory").value.trim(),
    supplier: document.getElementById("inventorySupplier").value.trim(),
    location: document.getElementById("inventoryLocation").value.trim(),
    stock: Number(document.getElementById("inventoryStock").value),
    minStock: Number(document.getElementById("inventoryMinStock").value),
    cost: Number(document.getElementById("inventoryCost").value)
  };

  state.inventory.unshift(item);
  addMovement(item, item.stock, "Entrada inicial");
  persistState();
  renderAll();
  refs.inventoryForm.reset();
  showToast("Producto agregado al inventario.");
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

  persistState();
  renderAll();
  refs.clientForm.reset();
  updateVehicleClientOptions();
  showToast("Cliente guardado.");
}

function updateVehicleClientOptions() {
  if (!refs.vehicleClient) return;
  
  const currentValue = refs.vehicleClient.value;
  refs.vehicleClient.innerHTML = '<option value="">Seleccionar cliente</option>' +
    state.clients.map(client => 
      `<option value="${client.id}">${safe(client.name)} - ${safe(client.phone)}</option>`
    ).join('');
  
  if (currentValue) {
    refs.vehicleClient.value = currentValue;
  }
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
  persistState();
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
  persistState();
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

function handleVehicleSubmit(event) {
  event.preventDefault();

  let clientId = refs.vehicleClient.value;
  
  // Si seleccionó crear nuevo cliente
  if (clientId === "new-client") {
    clientId = createNewClientFromVehicle();
    if (!clientId) return; // Si falló la creación del cliente
  }
  
  if (!clientId) {
    showToast("Selecciona un cliente o crea uno nuevo", "danger");
    return;
  }

  const vehicle = {
    id: createId("VEH"),
    clientId: clientId,
    plate: document.getElementById("vehiclePlate").value.trim().toUpperCase(),
    make: document.getElementById("vehicleMake").value.trim(),
    model: document.getElementById("vehicleModel").value.trim(),
    year: document.getElementById("vehicleYear").value,
    color: document.getElementById("vehicleColor").value.trim(),
    mileage: document.getElementById("vehicleMileage").value,
    engine: document.getElementById("vehicleEngine").value.trim(),
    notes: document.getElementById("vehicleNotes").value.trim(),
    createdAt: todayISO(),
    lastVisit: todayISO()
  };

  // Buscar cliente para obtener nombre
  const client = state.clients.find(c => c.id === vehicle.clientId);
  vehicle.clientName = client ? client.name : "Cliente no encontrado";

  // Actualizar vehículo del cliente
  if (client) {
    client.vehicle = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
    client.lastVisit = vehicle.lastVisit;
  }

  const existing = state.vehicles.find((entry) => sameText(entry.plate, vehicle.plate));
  if (existing) {
    existing.clientId = vehicle.clientId;
    existing.clientName = vehicle.clientName;
    existing.make = vehicle.make;
    existing.model = vehicle.model;
    existing.year = vehicle.year;
    existing.color = vehicle.color;
    existing.mileage = vehicle.mileage;
    existing.engine = vehicle.engine;
    existing.notes = vehicle.notes;
    existing.lastVisit = vehicle.lastVisit;
    showToast("Vehiculo actualizado correctamente");
  } else {
    state.vehicles.unshift(vehicle);
    showToast("Vehiculo guardado correctamente");
  }

  persistState();
  renderAll();
  refs.vehicleForm.reset();
  refs.newClientForm.style.display = "none";
  updateVehicleClientOptions();
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

function renderAll() {
  renderDashboard();
  renderOrders();
  renderInventory();
  renderClients();
  renderVehicles();
  renderHistory();
  renderSettings();
}

function renderDashboard() {
  const openOrders = state.orders.filter((order) => order.status !== "Entregado");
  const lowStockItems = state.inventory.filter((item) => getInventoryLevel(item) !== "Optimo");
  const deliveredToday = state.orders.filter((order) => order.deliveredAt === todayISO()).length;
  const revenue = state.orders.reduce((sum, order) => sum + Number(order.estimate || 0), 0);

  refs.heroOrders.textContent = String(openOrders.length);
  refs.heroAlerts.textContent = String(lowStockItems.length);
  refs.heroRevenue.textContent = formatCurrency(revenue);
  refs.metricOpenOrders.textContent = String(openOrders.length);
  refs.metricDeliveredToday.textContent = String(deliveredToday);
  refs.metricLowStock.textContent = String(lowStockItems.length);
  refs.metricRevenue.textContent = formatCurrency(revenue);

  refs.dashboardOrders.innerHTML = renderList(
    sortOrders(state.orders)
      .filter((order) => order.status !== "Entregado")
      .slice(0, 4)
      .map((order) => `
        <article class="row-card">
          <div class="row-card-main">
            <strong>${safe(order.id)} · ${safe(order.client)}</strong>
            <small>${safe(order.vehicle)} · ${safe(order.service)}</small>
            <div class="row-meta">
              ${badgeHtml(order.priority, badgeClassForPriority(order.priority))}
              ${badgeHtml(order.status, badgeClassForStatus(order.status))}
            </div>
          </div>
          <div class="row-card-side">
            <strong>${formatDate(order.dueDate)}</strong>
            <small>${formatCurrency(order.estimate)}</small>
          </div>
        </article>
      `),
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
            <strong>${item.stock} pzas</strong>
            <small>Minimo ${item.minStock}</small>
          </div>
        </article>
      `),
    "Todo el inventario esta en buen nivel."
  );

  refs.dashboardAgenda.innerHTML = renderList(
    upcomingAppointments()
      .slice(0, 4)
      .map((appointment) => `
        <article class="row-card">
          <div class="row-card-main">
            <strong>${safe(appointment.client)}</strong>
            <small>${safe(appointment.service)}</small>
          </div>
          <div class="row-card-side">
            <strong>${formatDate(appointment.date)}</strong>
            <small>${safe(appointment.time)} · ${safe(appointment.technician)}</small>
          </div>
        </article>
      `),
    "No hay citas programadas."
  );
}

function renderOrders() {
  refs.orderStatusStrip.innerHTML = ORDER_FLOW
    .map((status) => {
      const total = state.orders.filter((order) => order.status === status).length;
      return `
        <article class="status-card">
          <span>${safe(status)}</span>
          <strong>${total}</strong>
          <small>ordenes</small>
        </article>
      `;
    })
    .join("");

  const focusOrder = sortOrders(state.orders).find((order) => order.status !== "Entregado");
  if (focusOrder) {
    refs.orderSpotlight.innerHTML = `
      <p class="eyebrow">Orden destacada</p>
      <strong>${safe(focusOrder.id)} · ${safe(focusOrder.client)}</strong>
      <p>${safe(focusOrder.service)} para ${safe(focusOrder.vehicle)}</p>
      <div class="spotlight-meta">
        ${badgeHtml(focusOrder.priority, badgeClassForPriority(focusOrder.priority))}
        ${badgeHtml(focusOrder.status, badgeClassForStatus(focusOrder.status))}
        ${badgeHtml(formatDate(focusOrder.dueDate), "badge--info")}
      </div>
      <small>${safe(focusOrder.diagnosis)}</small>
    `;
  } else {
    refs.orderSpotlight.innerHTML = `<div class="empty-state">No hay ordenes en proceso.</div>`;
  }

  const search = refs.orderSearch.value.trim().toLowerCase();
  const statusFilter = refs.orderStatusFilter.value;
  const priorityFilter = refs.orderPriorityFilter.value;

  const filtered = sortOrders(state.orders).filter((order) => {
    const matchesSearch =
      !search ||
      [order.id, order.client, order.vehicle, order.service, order.plate].some((value) =>
        String(value).toLowerCase().includes(search)
      );
    const matchesStatus = statusFilter === "Todos" || order.status === statusFilter;
    const matchesPriority = priorityFilter === "Todas" || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  refs.ordersTableBody.innerHTML = filtered.length
    ? filtered
        .map((order) => {
          const canAdvance = order.status !== "Entregado";
          const actionLabel = order.status === "Listo" ? "Entregar" : "Avanzar";
          return `
            <tr>
              <td>
                <div class="cell-title">
                  <strong>${safe(order.id)}</strong>
                  <small>${formatDate(order.createdAt)}</small>
                </div>
              </td>
              <td>
                <div class="cell-title">
                  <strong>${safe(order.client)}</strong>
                  <small>${safe(order.vehicle)} · ${safe(order.plate)}</small>
                </div>
              </td>
              <td>
                <div class="cell-title">
                  <strong>${safe(order.service)}</strong>
                  <small>${safe(order.mechanic)}</small>
                </div>
              </td>
              <td>${badgeHtml(order.priority, badgeClassForPriority(order.priority))}</td>
              <td>${badgeHtml(order.status, badgeClassForStatus(order.status))}</td>
              <td>${formatDate(order.dueDate)}</td>
              <td>${formatCurrency(order.estimate)}</td>
              <td>
                <div class="action-set">
                  ${
                    canAdvance
                      ? `<button class="mini-btn" type="button" data-order-action="advance" data-order-id="${safe(order.id)}">${actionLabel}</button>`
                      : `<span class="badge badge--success">Cerrada</span>`
                  }
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="8"><div class="empty-state">No hay ordenes con ese filtro.</div></td></tr>`;
}

function renderInventory() {
  const totalUnits = state.inventory.reduce((sum, item) => sum + item.stock, 0);
  const lowStock = state.inventory.filter((item) => getInventoryLevel(item) === "Bajo").length;
  const totalValue = state.inventory.reduce((sum, item) => sum + item.stock * item.cost, 0);

  refs.inventoryMetrics.innerHTML = [
    metricCard("Productos", String(state.inventory.length)),
    metricCard("Piezas", String(totalUnits)),
    metricCard("Stock bajo", String(lowStock)),
    metricCard("Valor", formatCurrency(totalValue))
  ].join("");

  refs.movementFeed.innerHTML = renderList(
    state.movements.slice(0, 6).map(
      (movement) => `
        <article class="row-card">
          <div class="row-card-main">
            <strong>${safe(movement.itemName)}</strong>
            <small>${safe(movement.reason)}</small>
          </div>
          <div class="row-card-side">
            <strong>${movement.delta > 0 ? "+" : ""}${movement.delta}</strong>
            <small>${formatDateTime(movement.timestamp)}</small>
          </div>
        </article>
      `
    ),
    "Todavia no hay movimientos."
  );

  const search = refs.inventorySearch.value.trim().toLowerCase();
  const statusFilter = refs.inventoryStatusFilter.value;

  const filtered = state.inventory.filter((item) => {
    const level = getInventoryLevel(item);
    const matchesSearch =
      !search ||
      [item.name, item.category, item.supplier, item.location].some((value) =>
        String(value).toLowerCase().includes(search)
      );
    const matchesStatus = statusFilter === "Todos" || level === statusFilter;
    return matchesSearch && matchesStatus;
  });

  refs.inventoryTableBody.innerHTML = filtered.length
    ? filtered
        .slice()
        .sort((left, right) => left.stock - right.stock)
        .map((item) => `
          <tr>
            <td>
              <div class="cell-title">
                <strong>${safe(item.name)}</strong>
                <small>${safe(item.id)}</small>
              </div>
            </td>
            <td>${safe(item.category)}</td>
            <td>${safe(item.supplier)}</td>
            <td>${safe(item.location)}</td>
            <td>${item.stock}</td>
            <td>${item.minStock}</td>
            <td>${badgeHtml(getInventoryLevel(item), badgeClassForInventory(item))}</td>
            <td>${formatCurrency(item.cost)}</td>
            <td>
              <div class="action-set">
                <button class="mini-btn" type="button" data-item-action="minus" data-item-id="${safe(item.id)}">-1</button>
                <button class="mini-btn" type="button" data-item-action="plus" data-item-id="${safe(item.id)}">+1</button>
                <button class="mini-btn" type="button" data-item-action="plus5" data-item-id="${safe(item.id)}">+5</button>
              </div>
            </td>
          </tr>
        `)
        .join("")
    : `<tr><td colspan="9"><div class="empty-state">No hay productos con ese filtro.</div></td></tr>`;
}

function renderClients() {
  const activeClients = state.clients.filter((client) => differenceInDays(todayISO(), client.lastVisit) <= 30).length;
  const withEmail = state.clients.filter((client) => client.email).length;

  refs.clientMetrics.innerHTML = [
    metricCard("Clientes", String(state.clients.length)),
    metricCard("Activos 30 dias", String(activeClients)),
    metricCard("Con correo", String(withEmail)),
    metricCard("OT ligadas", String(state.orders.length))
  ].join("");

  const spotlightClient = state.clients[0];
  if (spotlightClient) {
    refs.clientSpotlight.innerHTML = `
      <p class="eyebrow">Cliente reciente</p>
      <strong>${safe(spotlightClient.name)}</strong>
      <p>${safe(spotlightClient.vehicle)}</p>
      <div class="spotlight-meta">
        ${badgeHtml(spotlightClient.phone || "Sin telefono", "badge--info")}
        ${badgeHtml(spotlightClient.lastService || "Sin servicio", "badge--brand")}
      </div>
      <small>${spotlightClient.notes ? safe(spotlightClient.notes) : "Sin notas registradas."}</small>
    `;
  } else {
    refs.clientSpotlight.innerHTML = `<div class="empty-state">Aun no hay clientes registrados.</div>`;
  }

  refs.clientsTableBody.innerHTML = state.clients.length
    ? state.clients
        .slice()
        .sort((left, right) => right.lastVisit.localeCompare(left.lastVisit))
        .map((client) => `
          <tr>
            <td><strong>${safe(client.name)}</strong></td>
            <td>
              <div class="cell-title">
                <strong>${safe(client.phone || "Sin telefono")}</strong>
                <small>${safe(client.email || "Sin correo")}</small>
              </div>
            </td>
            <td>${safe(client.vehicle || "Sin vehiculo")}</td>
            <td>${safe(client.lastService || "Sin historial")}</td>
            <td>${formatDate(client.lastVisit)}</td>
            <td>${safe(client.notes || "Sin notas")}</td>
            <td>
              <button class="ghost-btn" onclick="editClient('${client.id}')">Editar</button>
              <button class="ghost-btn danger" onclick="deleteClient('${client.id}')">Eliminar</button>
            </td>
          </tr>
        `)
        .join("")
    : `<tr><td colspan="7"><div class="empty-state">No hay clientes registrados.</div></td></tr>`;
}

function renderVehicles() {
  const totalVehicles = state.vehicles.length;
  const lastVehicle = state.vehicles.length > 0 ? state.vehicles[0] : null;

  refs.vehicleMetrics.innerHTML = [
    metricCard("Total vehiculos", String(totalVehicles))
  ].join("");

  refs.vehicleSpotlight.innerHTML = lastVehicle ? `
    <p class="eyebrow">Ultimo registrado</p>
    <strong>${lastVehicle.make} ${lastVehicle.model}</strong>
    <p>Placa: ${lastVehicle.plate} • ${lastVehicle.clientName}</p>
    <div class="spotlight-meta">
      ${badgeHtml(`${lastVehicle.year} • ${lastVehicle.color}`, "badge--brand")}
    </div>
    <small>Kilometraje: ${formatNumber(lastVehicle.mileage || 0)} km</small>
  ` : '<div class="empty-state">No hay vehiculos registrados.</div>';

  refs.vehiclesTableBody.innerHTML = state.vehicles.length
    ? state.vehicles
        .map((vehicle) => `
          <tr>
            <td><strong>${safe(vehicle.plate)}</strong></td>
            <td>${safe(vehicle.clientName)}</td>
            <td>${safe(vehicle.make)} ${safe(vehicle.model)}</td>
            <td>${safe(vehicle.year)}</td>
            <td>${formatNumber(vehicle.mileage || 0)} km</td>
            <td>${formatDate(vehicle.lastVisit)}</td>
            <td>
              <button class="ghost-btn" onclick="editVehicle('${vehicle.id}')">Editar</button>
              <button class="ghost-btn danger" onclick="deleteVehicle('${vehicle.id}')">Eliminar</button>
            </td>
          </tr>
        `)
        .join("")
    : `<tr><td colspan="7"><div class="empty-state">No hay vehiculos registrados.</div></td></tr>`;
}

function renderHistory() {
  const completedOrders = state.orders.filter(order => order.status === "Entregado");
  const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.estimate || 0), 0);
  const avgOrderValue = completedOrders.length ? totalRevenue / completedOrders.length : 0;
  const thisMonth = completedOrders.filter(order => order.createdAt.startsWith(new Date().toISOString().slice(0,7))).length;

  refs.historyMetrics.innerHTML = [
    metricCard("Ordenes completadas", String(completedOrders.length)),
    metricCard("Ingresos totales", formatCurrency(totalRevenue)),
    metricCard("Ticket promedio", formatCurrency(avgOrderValue)),
    metricCard("Este mes", String(thisMonth))
  ].join("");

  refs.historyFeed.innerHTML = completedOrders.slice(0, 5)
    .map(order => `
      <div class="feed-item">
        <div class="feed-header">
          <strong>${safe(order.client)}</strong>
          <span class="feed-date">${formatDate(order.deliveredAt || order.createdAt)}</span>
        </div>
        <p>${safe(order.vehicle)} - ${safe(order.service)}</p>
        <div class="feed-meta">${badgeHtml(formatCurrency(order.estimate), "badge--success")}</div>
      </div>
    `).join("") || '<div class="empty-state">No hay trabajos completados.</div>';

  refs.historyTableBody.innerHTML = completedOrders.length
    ? completedOrders
        .map((order) => `
          <tr>
            <td><strong>${safe(order.id)}</strong></td>
            <td>${safe(order.client)}</td>
            <td>${safe(order.vehicle)}</td>
            <td>${safe(order.service)}</td>
            <td>${formatDate(order.deliveredAt || order.createdAt)}</td>
            <td>${formatCurrency(order.estimate)}</td>
            <td>
              <button class="ghost-btn" onclick="viewOrderDetails('${order.id}')">Ver</button>
            </td>
          </tr>
        `)
        .join("")
    : `<tr><td colspan="7"><div class="empty-state">No hay ordenes completadas.</div></td></tr>`;
}

function renderSettings() {
  refs.themeChoices.forEach((choice) => {
    choice.classList.toggle("active", choice.dataset.themeChoice === state.theme);
  });

  refs.systemSummary.innerHTML = [
    summaryCard("Modo actual", state.theme === "dark" ? "Oscuro" : "Claro"),
    summaryCard("Ordenes registradas", String(state.orders.length)),
    summaryCard("Productos activos", String(state.inventory.length)),
    summaryCard("Citas programadas", String(state.appointments.length))
  ].join("");
}

function switchSection(sectionId) {
  refs.sections.forEach((section) => {
    section.classList.toggle("active", section.id === sectionId);
  });

  refs.navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.sectionTarget === sectionId);
  });

  refs.sectionTitle.textContent = SECTION_TITLES[sectionId] || "Panel";
  closeMenu();
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
  document.body.classList.toggle("menu-open");
}

function closeMenu() {
  document.body.classList.remove("menu-open");
}

function seedFormDates() {
  refs.orderDate.value = todayISO();
  refs.orderDueDate.value = datePlus(2);
  refs.appointmentDate.value = todayISO();
}

function fillSettingsForm() {
  refs.settingsBusinessName.value = state.settings.businessName;
  refs.settingsManager.value = state.settings.manager;
  refs.settingsPhone.value = state.settings.phone;
  refs.settingsEmail.value = state.settings.email;
  refs.settingsLocation.value = state.settings.location;
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
    existing.vehicle = order.vehicle;
    existing.lastService = order.service;
    existing.lastVisit = order.createdAt;
    existing.notes = existing.notes || order.notes;
    return;
  }

  // Crear cliente automáticamente desde orden si no existe
  state.clients.unshift({
    id: createId("CLI"),
    name: order.client,
    phone: order.phone,
    email: "",
    vehicle: order.vehicle,
    notes: order.notes || "Creado automáticamente desde orden de trabajo",
    lastService: order.service,
    lastVisit: order.createdAt
  });
}

function syncVehicleFromOrder(order) {
  // Buscar si ya existe un vehículo con esa placa
  const existingVehicle = state.vehicles.find(v => 
    sameText(v.plate, order.plate) || 
    (v.clientName === order.client && v.make && order.vehicle.includes(v.make))
  );

  if (existingVehicle) {
    existingVehicle.lastVisit = order.createdAt;
    return;
  }

  // Si no existe el vehículo, intentar crear uno básico
  const client = state.clients.find(c => 
    sameText(c.name, order.client) || sameText(c.phone, order.phone)
  );

  if (client) {
    // Extraer información básica del vehículo
    const vehicleInfo = order.vehicle.split(' ');
    const make = vehicleInfo[0] || "Desconocido";
    const model = vehicleInfo.slice(1).join(' ') || "Desconocido";
    
    state.vehicles.unshift({
      id: createId("VEH"),
      clientId: client.id,
      clientName: client.name,
      plate: order.plate || "SIN-PLACA",
      make: make,
      model: model,
      year: "2020",
      color: "No especificado",
      mileage: "0",
      engine: "No especificado",
      notes: "Creado automáticamente desde orden de trabajo",
      createdAt: order.createdAt,
      lastVisit: order.createdAt
    });
  }
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
  return orders
    .slice()
    .sort((left, right) => {
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

      return left.dueDate.localeCompare(right.dueDate);
    });
}

function upcomingAppointments() {
  return state.appointments
    .slice()
    .sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Auto-guardar en backend después de cambios locales
  saveToBackend();
}

function saveState() {
  persistState();
}

function loadState() {
  const fallback = createInitialState();
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      ...fallback,
      ...parsed,
      settings: { ...fallback.settings, ...(parsed.settings || {}) },
      orders: Array.isArray(parsed.orders) ? parsed.orders : fallback.orders,
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : fallback.inventory,
      movements: Array.isArray(parsed.movements) ? parsed.movements : fallback.movements,
      clients: Array.isArray(parsed.clients) ? parsed.clients : fallback.clients,
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : fallback.appointments
    };
  } catch (error) {
    return fallback;
  }
}

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
        dueDate: datePlus(1),
        client: "Carlos Mendez",
        phone: "664 111 2233",
        vehicle: "Nissan Versa 2020",
        plate: "ABC-123-A",
        service: "Cambio de clutch",
        mechanic: "Luis Gomez",
        priority: "Alta",
        estimate: 6800,
        diagnosis: "El clutch patina y vibra al arrancar.",
        notes: "Revisar volante y kit completo.",
        status: "Reparacion"
      },
      {
        id: "OT-1002",
        createdAt: todayISO(),
        dueDate: datePlus(2),
        client: "Mariana Soto",
        phone: "664 222 3344",
        vehicle: "Chevrolet Spark 2018",
        plate: "DEF-456-B",
        service: "Afinacion mayor",
        mechanic: "Pedro Ruiz",
        priority: "Media",
        estimate: 2400,
        diagnosis: "Perdida de potencia y consumo elevado.",
        notes: "Cambiar filtros y bujias.",
        status: "Diagnostico"
      },
      {
        id: "OT-1003",
        createdAt: datePlus(-1),
        dueDate: todayISO(),
        client: "Jose Ibarra",
        phone: "664 333 4455",
        vehicle: "Ford Ranger 2019",
        plate: "GHI-789-C",
        service: "Frenos delanteros",
        mechanic: "Adrian Leon",
        priority: "Alta",
        estimate: 3900,
        diagnosis: "Balatas agotadas y discos con desgaste.",
        notes: "Cliente espera entrega el mismo dia.",
        status: "Listo"
      }
    ],
    inventory: [
      {
        id: "INV-101",
        name: "Aceite sintetico 5W30",
        category: "Lubricantes",
        supplier: "Mobil",
        location: "Rack A1",
        stock: 18,
        minStock: 10,
        cost: 210
      },
      {
        id: "INV-102",
        name: "Balatas delanteras Versa",
        category: "Frenos",
        supplier: "Bosch",
        location: "Rack B2",
        stock: 3,
        minStock: 4,
        cost: 780
      },
      {
        id: "INV-103",
        name: "Filtro de aceite universal",
        category: "Filtros",
        supplier: "Mann",
        location: "Rack A3",
        stock: 1,
        minStock: 5,
        cost: 115
      },
      {
        id: "INV-104",
        name: "Liquido de frenos DOT 4",
        category: "Fluidos",
        supplier: "ACDelco",
        location: "Rack C1",
        stock: 9,
        minStock: 6,
        cost: 160
      }
    ],
    movements: [
      {
        id: "MOV-1",
        itemId: "INV-102",
        itemName: "Balatas delanteras Versa",
        delta: -1,
        reason: "Salida para orden OT-1003",
        timestamp: new Date().toISOString()
      },
      {
        id: "MOV-2",
        itemId: "INV-101",
        itemName: "Aceite sintetico 5W30",
        delta: 6,
        reason: "Reabasto",
        timestamp: new Date().toISOString()
      }
    ],
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
