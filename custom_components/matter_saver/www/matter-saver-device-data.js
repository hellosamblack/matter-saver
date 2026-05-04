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

    const nodeId = isCompactDevice ? device.i : device.node_id;
    const product = isCompactDevice ? device.p : (device.product || device.product_name || "");
    const nodeLabel = isCompactDevice ? device.nl : (device.node_label || "");
    const name = isCompactDevice
      ? (device.n || `Node ${device.i}`)
      : (device.name || device.device_name || nodeLabel || product || (nodeId != null ? `Node ${nodeId}` : ""));

    return {
      node_id: nodeId,
      name,
      area: isCompactDevice ? (device.a || "") : (device.area || ""),
      floor: isCompactDevice ? (device.fl || "") : (device.floor || ""),
      product,
      vendor: isCompactDevice ? (device.v || "") : (device.vendor || device.vendor_name || ""),
      node_label: nodeLabel,
      serial_number: isCompactDevice ? (device.sn || "") : (device.serial_number || ""),
      status: isCompactDevice
        ? (device.av ? "online" : "offline")
        : (device.status || (device.available ? "online" : "offline")),
      power: normalizePower(isCompactDevice ? device.w : (device.power || device.power_source)),
      firmware: isCompactDevice ? (device.f || "") : (device.firmware || device.software_version_string || ""),
      update_available: isCompactDevice ? Boolean(device.u) : Boolean(device.update_available),
      thread_role: normalizeRole(isCompactDevice ? device.r : device.thread_role),
      neighbors: isCompactDevice ? (device.k ?? 0) : (device.neighbors ?? 0),
      children: isCompactDevice ? (device.ch ?? 0) : (device.children ?? 0),
      errors: isCompactDevice ? (device.e ?? 0) : (device.errors ?? 0),
      error_comment: isCompactDevice ? (device.m || "") : (device.error_comment || ""),
      error_comment_codes: isCompactDevice
        ? (Array.isArray(device.mc) ? device.mc : [])
        : (Array.isArray(device.error_comment_codes) ? device.error_comment_codes : []),
      parent: isCompactDevice ? (device.pn || "") : (device.parent || device.parent_name || ""),
      parent_node_id: isCompactDevice ? (device.pi ?? null) : (device.parent_node_id ?? null),
      signal_rssi: isCompactDevice ? (device.sr ?? null) : (device.signal_rssi ?? null),
      signal_lqi: isCompactDevice ? (device.sq ?? null) : (device.signal_lqi ?? null),
      route_path: isCompactDevice ? [] : (Array.isArray(device.route_path) ? device.route_path : []),
      tx_retries: isCompactDevice ? (device.tr ?? 0) : (device.tx_retries ?? 0),
      offline_24h_count: isCompactDevice ? (device.c24 ?? 0) : (device.offline_24h_count ?? 0),
      offline_24h_minutes: isCompactDevice ? (device.m24 ?? 0) : (device.offline_24h_minutes ?? 0),
      offline_7d_count: isCompactDevice ? (device.c7 ?? 0) : (device.offline_7d_count ?? 0),
      offline_7d_minutes: isCompactDevice ? (device.m7 ?? 0) : (device.offline_7d_minutes ?? 0),
      offline_30d_count: isCompactDevice ? (device.c30 ?? 0) : (device.offline_30d_count ?? 0),
      offline_30d_minutes: isCompactDevice ? (device.m30 ?? 0) : (device.offline_30d_minutes ?? 0),
      last_seen: isCompactDevice ? (device.ls || "") : (device.last_seen || ""),
      date_commissioned: isCompactDevice ? (device.dc || "") : (device.date_commissioned || ""),
      last_interview: isCompactDevice ? (device.li || "") : (device.last_interview || ""),
      battery: isCompactDevice ? device.b : (device.battery ?? device.battery_percent),
      device_type_ids: isCompactDevice
        ? (Array.isArray(device.dt) ? device.dt : [])
        : (Array.isArray(device.device_type_ids) ? device.device_type_ids : []),
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
