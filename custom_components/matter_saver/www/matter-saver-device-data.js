(() => {
  const ROLE_MAP = {
    l: "leader",
    r: "router",
    re: "reed",
    e: "end_device",
    s: "sed",
    ua: "unassigned",
    us: "unspecified",
    u: "unknown",
  };

  const POWER_MAP = {
    b: "battery",
    w: "wired",
    u: "unknown",
  };

  function normalizeRole(role) {
    return ROLE_MAP[role] || role || "unknown";
  }

  function normalizePower(power) {
    return POWER_MAP[power] || power || "unknown";
  }

  function normalizeDevice(device) {
    if (!device || typeof device !== "object") return {};
    const isCompactDevice = "i" in device;
    if (!isCompactDevice) return device;

    return {
      node_id: device.i,
      name: device.n || `Node ${device.i}`,
      area: device.a || "",
      product: device.p || "",
      status: device.av ? "online" : "offline",
      power: normalizePower(device.w),
      firmware: device.f || "",
      update_available: Boolean(device.u),
      thread_role: normalizeRole(device.r),
      neighbors: device.k ?? 0,
      children: device.ch ?? 0,
      errors: device.e ?? 0,
      error_comment: device.m || "",
      error_comment_codes: Array.isArray(device.mc) ? device.mc : [],
      parent: device.pn || "",
      parent_node_id: device.pi ?? null,
      route_path: [],
      offline_7d_count: device.c7 ?? 0,
      offline_7d_minutes: device.m7 ?? 0,
      offline_30d_count: device.c30 ?? 0,
      offline_30d_minutes: device.m30 ?? 0,
      last_seen: device.ls || "",
      battery: device.b,
    };
  }

  function normalizeRouteHop(hop, byId) {
    const isCompactHop = hop && typeof hop === "object"
      && ("i" in hop || "rs" in hop || "lq" in hop);
    if (!isCompactHop) return hop;
    const nodeId = hop.i ?? null;
    if (nodeId === null || nodeId === undefined) {
      return { node_id: null, name: "Home Assistant", role: "ha", rssi: null, lqi: null };
    }

    const device = byId.get(nodeId) || {};
    return {
      node_id: nodeId,
      name: device.name || `Node ${nodeId}`,
      role: device.thread_role || "unknown",
      rssi: hop && hop.rs != null ? hop.rs : null,
      lqi: hop && hop.lq != null ? hop.lq : null,
    };
  }

  function normalizeDevices(state) {
    const devices = (state.attributes && state.attributes.devices) || [];
    if (!Array.isArray(devices)) return [];

    const normalized = devices.map((device) => normalizeDevice(device));
    const byId = new Map(normalized.map((device) => [device.node_id, device]));

    devices.forEach((device, index) => {
      if (device && !("node_id" in device) && Array.isArray(device.rt)) {
        normalized[index].route_path = device.rt.map((hop) => normalizeRouteHop(hop, byId));
      }
    });

    return normalized;
  }

  window.MatterSaverDeviceData = {
    normalizeDevices,
    normalizeDevice,
    normalizeRole,
    normalizePower,
  };
})();
