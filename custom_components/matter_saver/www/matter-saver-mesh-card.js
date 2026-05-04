// Lowest comparison value so links with real RSSI win during deduplication.
const DEDUPE_RSSI_SENTINEL = -999;
const MESH_VIEW_MODES = new Set(["logical", "by_floor", "by_area", "by_floor_area"]);
const LOCATION_ORDER_FALLBACKS = {
  floor: "__matter_saver_no_floor__",
  area: "__matter_saver_no_area__",
};
const FALLBACK_HORIZONTAL_SPREAD = 0.5;
const FALLBACK_VERTICAL_JITTER = 40;
const NODE_ROLE_ORDER = {
  leader: 0,
  router: 1,
  reed: 2,
  end_device: 3,
  sed: 4,
  unknown: 5,
  ha: 6,
};

class MatterSaverMeshCard extends HTMLElement {
  constructor() {
    super();
    this._lastDataJson = "";
    this._initialized = false;
    this._nodes = [];
    this._links = [];
    this._regions = [];
    this._dragging = null;
    this._offsetX = 0;
    this._offsetY = 0;
    this._scale = 1;
    this._panX = 0;
    this._panY = 0;
    this._isPanning = false;
    this._panStartX = 0;
    this._panStartY = 0;
    this._deviceDataError = "";
    this._viewMode = "logical";
    this._floorOrder = [];
    this._areaOrder = [];
  }

  setConfig(config) {
    this.config = config;
    this._entityId = config.entity || "sensor.matter_saver_devices";
    this._title = config.title || "Thread Mesh";
    this._showLegend = config.show_legend !== false;
    this._graphHeight = Number.isFinite(Number(config.height)) && Number(config.height) >= 320
      ? Number(config.height)
      : null;

    const nextViewMode = MESH_VIEW_MODES.has(config.view_mode) ? config.view_mode : "logical";
    const nextFloorOrder = this._normalizeOrder(config.floor_order);
    const nextAreaOrder = this._normalizeOrder(config.area_order);
    const layoutChanged = this._viewMode !== nextViewMode
      || JSON.stringify(this._floorOrder) !== JSON.stringify(nextFloorOrder)
      || JSON.stringify(this._areaOrder) !== JSON.stringify(nextAreaOrder);

    this._viewMode = nextViewMode;
    this._floorOrder = nextFloorOrder;
    this._areaOrder = nextAreaOrder;

    if (layoutChanged) {
      this._releaseNodePositions();
    }

    if (this._initialized && this._hass) {
      this._fullRender();
    }
  }

  set hass(hass) {
    this._hass = hass;
    const state = hass.states[this._entityId];
    const dataJson = state ? JSON.stringify(state.attributes) : "";
    if (!this._initialized || !this.querySelector("#mm-svg")) {
      this._fullRender();
      this._initialized = true;
    } else if (dataJson !== this._lastDataJson) {
      this._lastDataJson = dataJson;
      this._buildGraph();
      this._renderGraph();
    }
  }

  _normalizeOrder(values) {
    if (!Array.isArray(values)) {
      return [];
    }
    return values.map((value) => String(value || "").trim()).filter(Boolean);
  }

  _releaseNodePositions() {
    for (const node of this._nodes) {
      node.fixed = false;
      node.x = 0;
      node.y = 0;
    }
  }

  _fullRender() {
    this._lastDataJson = JSON.stringify((this._hass.states[this._entityId] || {}).attributes || {});
    this.innerHTML = `
      <ha-card>
        <style>
          .mm-header { padding: 16px 16px 8px; display: flex; justify-content: space-between; align-items: center; }
          .mm-title { font-size: 1.2em; font-weight: 500; }
          .mm-controls { display: flex; gap: 8px; }
          .mm-btn {
            background: var(--card-background-color, #333); border: 2px solid var(--divider-color, #555);
            color: var(--primary-text-color, #fff); padding: 8px 16px; border-radius: 10px;
            cursor: pointer; font-size: 1.1em; font-weight: 600; min-width: 40px;
          }
          .mm-btn:hover { border-color: var(--primary-color, #03a9f4); background: var(--primary-color, #03a9f4)22; }
          .mm-legend { padding: 0 16px 8px; display: flex; gap: 16px; font-size: 0.8em; flex-wrap: wrap; }
          .mm-legend-item { display: flex; align-items: center; gap: 4px; }
          .mm-legend-dot { width: 12px; height: 12px; border-radius: 50%; }
          .mm-svg-wrap {
            width: 100%; height: calc(100vh - 180px); min-height: 400px;
            position: relative; overflow: hidden;
            cursor: grab; user-select: none;
          }
          .mm-svg-wrap.grabbing { cursor: grabbing; }
          .mm-svg { width: 100%; height: 100%; }
          .mm-tooltip {
            display: none; position: absolute; background: var(--ha-card-background, #1c1c1c);
            border: 1px solid var(--divider-color, #555); border-radius: 8px;
            padding: 10px 14px; font-size: 0.8em; pointer-events: none; z-index: 10;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4); max-width: 250px;
          }
          .mm-tooltip.show { display: block; }
          .mm-tooltip-name { font-weight: 600; margin-bottom: 4px; }
          .mm-tooltip-detail { color: var(--secondary-text-color, #999); line-height: 1.4; white-space: pre-line; }
        </style>
        <div class="mm-header">
          <span class="mm-title">${this._esc(this._title)}</span>
          <div class="mm-controls">
            <button class="mm-btn" id="mm-zoom-in">+</button>
            <button class="mm-btn" id="mm-zoom-out">-</button>
            <button class="mm-btn" id="mm-reset">${this._esc(this._t("reset"))}</button>
          </div>
        </div>
        ${this._showLegend ? `<div class="mm-legend">
          <span class="mm-legend-item"><span class="mm-legend-dot" style="background:#ffb300"></span> ${this._threadRoleLabel("leader")}</span>
          <span class="mm-legend-item"><span class="mm-legend-dot" style="background:#4caf50"></span> ${this._threadRoleLabel("router")}</span>
          <span class="mm-legend-item"><span class="mm-legend-dot" style="background:#8bc34a"></span> ${this._threadRoleLabel("reed")}</span>
          <span class="mm-legend-item"><span class="mm-legend-dot" style="background:#78909c"></span> ${this._threadRoleLabel("end_device")}</span>
          <span class="mm-legend-item"><span class="mm-legend-dot" style="background:#03a9f4"></span> ${this._t("homeAssistant")}</span>
          <span class="mm-legend-item"><span style="width:20px;height:2px;background:#4caf50;display:inline-block"></span> ${this._t("strongSignal")}</span>
          <span class="mm-legend-item"><span style="width:20px;height:2px;background:#ff9800;display:inline-block"></span> ${this._t("fairSignal")}</span>
          <span class="mm-legend-item"><span style="width:20px;height:2px;background:#f44336;display:inline-block"></span> ${this._t("weakSignal")}</span>
          <span class="mm-legend-item"><span style="width:20px;height:2px;background:rgba(255,255,255,0.25);display:inline-block"></span> ${this._t("unknownSignal")}</span>
        </div>` : ""}
        <div class="mm-svg-wrap" id="mm-wrap" style="height:${this._graphHeight ? `${this._graphHeight}px` : "calc(100vh - 180px)"};min-height:${this._graphHeight ? `${this._graphHeight}px` : "400px"}">
          <svg class="mm-svg" id="mm-svg"></svg>
          <div class="mm-tooltip" id="mm-tooltip">
            <div class="mm-tooltip-name" id="mm-tt-name"></div>
            <div class="mm-tooltip-detail" id="mm-tt-detail"></div>
          </div>
        </div>
      </ha-card>
    `;

    this.querySelector("#mm-zoom-in").addEventListener("click", () => { this._scale *= 1.2; this._renderGraph(); });
    this.querySelector("#mm-zoom-out").addEventListener("click", () => { this._scale /= 1.2; this._renderGraph(); });
    this.querySelector("#mm-reset").addEventListener("click", () => {
      this._scale = 1;
      this._panX = 0;
      this._panY = 0;
      this._releaseNodePositions();
      this._layoutNodes();
      this._renderGraph();
    });

    const wrap = this.querySelector("#mm-wrap");
    wrap.addEventListener("mousedown", (e) => {
      if (e.target.closest(".mm-node")) return;
      this._isPanning = true;
      this._panStartX = e.clientX - this._panX;
      this._panStartY = e.clientY - this._panY;
      wrap.classList.add("grabbing");
    });
    wrap.addEventListener("mousemove", (e) => {
      if (this._isPanning) {
        this._panX = e.clientX - this._panStartX;
        this._panY = e.clientY - this._panStartY;
        this._renderGraph();
      }
      if (this._dragging) {
        const svg = this.querySelector("#mm-svg");
        const rect = svg.getBoundingClientRect();
        this._dragging.x = (e.clientX - rect.left - this._panX) / this._scale;
        this._dragging.y = (e.clientY - rect.top - this._panY) / this._scale;
        this._dragging.fixed = true;
        this._renderGraph();
      }
    });
    wrap.addEventListener("mouseup", () => {
      this._isPanning = false;
      this._dragging = null;
      wrap.classList.remove("grabbing");
    });
    wrap.addEventListener("mouseleave", () => {
      this._isPanning = false;
      this._dragging = null;
      wrap.classList.remove("grabbing");
    });
    wrap.addEventListener("wheel", (e) => {
      e.preventDefault();
      this._scale *= e.deltaY < 0 ? 1.1 : 0.9;
      this._scale = Math.max(0.3, Math.min(3, this._scale));
      this._renderGraph();
    });

    this._buildGraph();
    this._renderGraph();
  }

  _buildGraph() {
    const state = this._hass.states[this._entityId];
    if (!state) return;
    const devices = this._getDevices(state);

    const oldPos = {};
    for (const node of this._nodes) {
      oldPos[node.id] = { x: node.x, y: node.y, fixed: node.fixed };
    }

    this._nodes = [];
    this._links = [];
    this._regions = [];
    const linkMap = new Map();

    this._nodes.push({
      id: "ha", name: "Home Assistant", role: "ha", status: "online",
      radius: 20, x: 0, y: 0, fixed: false,
      children: 0, neighbors: 0, area: "", floor: "", product: "Border Router",
    });

    for (const device of devices) {
      const isRouter = ["router", "leader", "reed"].includes(device.thread_role);
      this._nodes.push({
        id: device.node_id, name: device.name, role: device.thread_role, status: device.status,
        radius: isRouter ? 16 : 10,
        x: 0, y: 0, fixed: false,
        children: device.children || 0, neighbors: device.neighbors || 0,
        area: device.area || "", floor: device.floor || "", product: device.product || "",
        battery: device.battery, errors: device.errors || 0,
        parent_node_id: device.parent_node_id,
      });
    }

    for (const node of this._nodes) {
      if (this._viewMode === "logical" && oldPos[node.id]) {
        node.x = oldPos[node.id].x;
        node.y = oldPos[node.id].y;
        node.fixed = oldPos[node.id].fixed;
      }
    }

    for (const device of devices) {
      if (Array.isArray(device.route_path) && device.route_path.length > 1) {
        for (let index = 0; index < device.route_path.length - 1; index++) {
          const currentHop = device.route_path[index];
          const nextHop = device.route_path[index + 1];
          const source = currentHop?.node_id ?? "ha";
          const target = nextHop?.node_id ?? "ha";
          if (source === target) continue;
          const key = `${source}->${target}`;
          const existing = linkMap.get(key);
          const nextLink = {
            source,
            target,
            type: "parent",
            rssi: nextHop?.rssi ?? null,
            lqi: nextHop?.lqi ?? null,
          };
          if (!existing || (nextLink.rssi ?? DEDUPE_RSSI_SENTINEL) > (existing.rssi ?? DEDUPE_RSSI_SENTINEL)) {
            linkMap.set(key, nextLink);
          }
        }
      } else if (device.parent_node_id != null) {
        linkMap.set(`${device.parent_node_id}->${device.node_id}`, {
          source: device.parent_node_id,
          target: device.node_id,
          type: "parent",
          rssi: device.signal_rssi ?? null,
          lqi: device.signal_lqi ?? null,
        });
      }
    }

    for (const device of devices) {
      if (device.thread_role === "leader") {
        linkMap.set(`${device.node_id}->ha`, { source: device.node_id, target: "ha", type: "parent", rssi: null, lqi: null });
      }
    }

    if (!devices.some((device) => device.thread_role === "leader")) {
      for (const device of devices) {
        if (device.thread_role === "router") {
          linkMap.set(`${device.node_id}->ha`, { source: device.node_id, target: "ha", type: "parent", rssi: null, lqi: null });
        }
      }
    }

    this._links = Array.from(linkMap.values());
    this._layoutNodes();
  }

  _layoutNodes() {
    const svg = this.querySelector("#mm-svg");
    if (!svg) return;
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 600;

    if (this._viewMode === "logical") {
      this._layoutLogicalNodes(width, height);
      return;
    }

    this._layoutPhysicalNodes(width, height);
  }

  _layoutLogicalNodes(width, height) {
    this._regions = [];
    const centerX = width / 2;
    const centerY = height / 2;

    const homeAssistantNode = this._nodes.find((node) => node.id === "ha");
    if (homeAssistantNode) {
      homeAssistantNode.x = centerX;
      homeAssistantNode.y = centerY;
    }

    const routers = this._nodes.filter((node) => ["router", "leader", "reed"].includes(node.role));
    const routerRadius = Math.min(width, height) * 0.3;
    routers.forEach((router, index) => {
      if (router.fixed) return;
      const angle = (2 * Math.PI * index) / routers.length - Math.PI / 2;
      router.x = centerX + routerRadius * Math.cos(angle);
      router.y = centerY + routerRadius * Math.sin(angle);
    });

    const endDevices = this._nodes.filter((node) => ["sed", "end_device"].includes(node.role));
    for (const endDevice of endDevices) {
      if (endDevice.fixed) continue;
      const parent = this._nodes.find((node) => node.id === endDevice.parent_node_id);
      if (parent) {
        const siblings = endDevices.filter((node) => node.parent_node_id === endDevice.parent_node_id);
        const index = siblings.indexOf(endDevice);
        const count = siblings.length;
        const baseAngle = Math.atan2(parent.y - centerY, parent.x - centerX);
        const angle = baseAngle + ((index - (count - 1) / 2) * 0.4);
        const distance = routerRadius * 0.45;
        endDevice.x = parent.x + distance * Math.cos(angle);
        endDevice.y = parent.y + distance * Math.sin(angle);
      } else {
        endDevice.x = centerX + (Math.random() - 0.5) * width * FALLBACK_HORIZONTAL_SPREAD;
        endDevice.y = height * 0.85 + (Math.random() - 0.5) * FALLBACK_VERTICAL_JITTER;
      }
    }
  }

  _layoutPhysicalNodes(width, height) {
    this._regions = [];
    const homeAssistantNode = this._nodes.find((node) => node.id === "ha");
    if (homeAssistantNode) {
      homeAssistantNode.x = width / 2;
      homeAssistantNode.y = 58;
    }

    const deviceNodes = this._nodes.filter((node) => node.id !== "ha");
    if (!deviceNodes.length) {
      return;
    }

    if (this._viewMode === "by_floor") {
      this._layoutByFloor(width, height, deviceNodes);
      return;
    }

    if (this._viewMode === "by_area") {
      this._layoutByArea(width, height, deviceNodes);
      return;
    }

    this._layoutByFloorAndArea(width, height, deviceNodes);
  }

  _layoutByFloor(width, height, deviceNodes) {
    const groupMap = this._groupNodes(deviceNodes, (node) => this._locationGroupKey("floor", node));
    const groups = this._orderedGroups([...groupMap.keys()], this._floorOrder);
    const top = 104;
    const left = 16;
    const bottom = 16;
    const gap = 16;
    const totalHeight = Math.max(height - top - bottom, 140);
    const bandHeight = Math.max((totalHeight - gap * Math.max(groups.length - 1, 0)) / Math.max(groups.length, 1), 96);

    groups.forEach((groupName, index) => {
      const y = top + index * (bandHeight + gap);
      const region = {
        kind: "floor",
        label: this._locationGroupLabel("floor", groupName),
        x: left,
        y,
        width: Math.max(width - left * 2, 120),
        height: bandHeight,
      };
      this._regions.push(region);
      this._layoutNodesInZone(groupMap.get(groupName) || [], region, { topInset: 36, sideInset: 18, bottomInset: 18 });
    });
  }

  _layoutByArea(width, height, deviceNodes) {
    const groupMap = this._groupNodes(deviceNodes, (node) => this._locationGroupKey("area", node));
    const groups = this._orderedGroups([...groupMap.keys()], this._areaOrder);
    const zones = this._gridRegions(groups, width, height, "area", 104);
    zones.forEach((zone) => {
      this._regions.push({ ...zone, label: this._locationGroupLabel("area", zone.label) });
      this._layoutNodesInZone(groupMap.get(zone.label) || [], zone, { topInset: 34, sideInset: 16, bottomInset: 16 });
    });
  }

  _layoutByFloorAndArea(width, height, deviceNodes) {
    const floorMap = new Map();
    for (const node of deviceNodes) {
      const floorKey = this._locationGroupKey("floor", node);
      const areaKey = this._locationGroupKey("area", node);
      if (!floorMap.has(floorKey)) {
        floorMap.set(floorKey, new Map());
      }
      const areaMap = floorMap.get(floorKey);
      if (!areaMap.has(areaKey)) {
        areaMap.set(areaKey, []);
      }
      areaMap.get(areaKey).push(node);
    }

    const floors = this._orderedGroups([...floorMap.keys()], this._floorOrder);
    const top = 104;
    const left = 16;
    const bottom = 16;
    const floorGap = 18;
    const totalHeight = Math.max(height - top - bottom, 140);
    const floorHeight = Math.max((totalHeight - floorGap * Math.max(floors.length - 1, 0)) / Math.max(floors.length, 1), 124);

    floors.forEach((floorKey, floorIndex) => {
      const y = top + floorIndex * (floorHeight + floorGap);
      const floorRegion = {
        kind: "floor",
        label: this._locationGroupLabel("floor", floorKey),
        x: left,
        y,
        width: Math.max(width - left * 2, 120),
        height: floorHeight,
      };
      this._regions.push(floorRegion);

      const areas = this._orderedGroups([...floorMap.get(floorKey).keys()], this._areaOrder);
      const roomGap = 12;
      const roomWidth = Math.max((floorRegion.width - 24 - roomGap * Math.max(areas.length - 1, 0)) / Math.max(areas.length, 1), 100);
      areas.forEach((areaKey, areaIndex) => {
        const roomRegion = {
          kind: "room",
          label: this._locationGroupLabel("area", areaKey),
          x: floorRegion.x + 12 + areaIndex * (roomWidth + roomGap),
          y: floorRegion.y + 34,
          width: roomWidth,
          height: Math.max(floorRegion.height - 46, 76),
        };
        this._regions.push(roomRegion);
        this._layoutNodesInZone(floorMap.get(floorKey).get(areaKey) || [], roomRegion, { topInset: 28, sideInset: 12, bottomInset: 12 });
      });
    });
  }

  _gridRegions(groups, width, height, kind, top) {
    const left = 16;
    const right = 16;
    const bottom = 16;
    const gap = 16;
    const columns = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(groups.length || 1))));
    const rows = Math.max(1, Math.ceil(groups.length / columns));
    const usableWidth = Math.max(width - left - right, 140);
    const usableHeight = Math.max(height - top - bottom, 140);
    const cellWidth = Math.max((usableWidth - gap * Math.max(columns - 1, 0)) / columns, 120);
    const cellHeight = Math.max((usableHeight - gap * Math.max(rows - 1, 0)) / rows, 100);

    return groups.map((label, index) => ({
      kind,
      label,
      x: left + (index % columns) * (cellWidth + gap),
      y: top + Math.floor(index / columns) * (cellHeight + gap),
      width: cellWidth,
      height: cellHeight,
    }));
  }

  _groupNodes(nodes, keyFn) {
    const grouped = new Map();
    for (const node of nodes) {
      const key = keyFn(node);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(node);
    }
    return grouped;
  }

  _orderedGroups(values, preferredOrder) {
    const uniqueValues = [...new Set(values.filter(Boolean))];
    const ordered = [];
    const seen = new Set();

    preferredOrder.forEach((value) => {
      if (uniqueValues.includes(value) && !seen.has(value)) {
        ordered.push(value);
        seen.add(value);
      }
    });

    uniqueValues
      .filter((value) => !seen.has(value))
      .sort((left, right) => left.localeCompare(right))
      .forEach((value) => ordered.push(value));

    return ordered;
  }

  _layoutNodesInZone(nodes, zone, options = {}) {
    const topInset = options.topInset ?? 32;
    const sideInset = options.sideInset ?? 16;
    const bottomInset = options.bottomInset ?? 16;
    const sortedNodes = [...nodes].sort((left, right) => {
      const leftRank = NODE_ROLE_ORDER[left.role] ?? NODE_ROLE_ORDER.unknown;
      const rightRank = NODE_ROLE_ORDER[right.role] ?? NODE_ROLE_ORDER.unknown;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return String(left.name || "").localeCompare(String(right.name || ""));
    });

    const movableNodes = sortedNodes.filter((node) => !node.fixed);
    if (!movableNodes.length) {
      return;
    }

    const usableWidth = Math.max(zone.width - sideInset * 2, 48);
    const usableHeight = Math.max(zone.height - topInset - bottomInset, 48);
    const columns = Math.max(1, Math.min(movableNodes.length, Math.floor(usableWidth / 82)));
    const rows = Math.max(1, Math.ceil(movableNodes.length / columns));
    const cellWidth = usableWidth / columns;
    const cellHeight = usableHeight / rows;

    movableNodes.forEach((node, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      node.x = zone.x + sideInset + cellWidth * column + cellWidth / 2;
      node.y = zone.y + topInset + cellHeight * row + cellHeight / 2;
    });
  }

  _locationGroupKey(target, node) {
    const rawValue = target === "floor" ? node.floor : node.area;
    const normalized = String(rawValue || "").trim();
    return normalized || LOCATION_ORDER_FALLBACKS[target];
  }

  _locationGroupLabel(target, value) {
    if (value === LOCATION_ORDER_FALLBACKS.floor) {
      return this._t("noFloor");
    }
    if (value === LOCATION_ORDER_FALLBACKS.area) {
      return this._t("noArea");
    }
    return value;
  }

  _getDevices(state) {
    const result = window.MatterSaverCardUtils?.getDevices(state, "matter-saver-mesh-card", this._hass);
    if (result) {
      this._deviceDataError = result.error;
      return result.devices;
    }

    this._deviceDataError = this._t("sharedDeviceDecoderUnavailable");
    console.warn("matter-saver-mesh-card: shared card utilities unavailable; returning no devices to avoid mis-rendering.");
    return [];
  }

  _renderGraph() {
    const svg = this.querySelector("#mm-svg");
    if (!svg) return;
    if (this._deviceDataError) {
      svg.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="currentColor">${this._deviceDataError}</text>`;
      return;
    }

    const roleColors = {
      leader: "#ffb300", router: "#4caf50", reed: "#8bc34a",
      sed: "#78909c", end_device: "#78909c", ha: "#03a9f4",
    };

    const nodeMap = {};
    for (const node of this._nodes) nodeMap[node.id] = node;

    let html = `<g transform="translate(${this._panX},${this._panY}) scale(${this._scale})">`;
    html += this._regionMarkup();

    for (const link of this._links) {
      const source = nodeMap[link.source];
      const target = nodeMap[link.target];
      if (!source || !target) continue;
      html += `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="${this._linkColor(link.rssi)}" stroke-width="2" />`;
    }

    for (const node of this._nodes) {
      const color = roleColors[node.role] || "#999";
      const offline = node.status === "offline";
      const opacity = offline ? 0.4 : 1;
      const strokeColor = offline ? "#f44336" : "rgba(255,255,255,0.15)";
      const strokeWidth = offline ? 2 : 1;
      const label = node.name.length > 18 ? `${node.name.substring(0, 16)}..` : node.name;
      const fontSize = node.role === "ha" ? 11 : node.radius > 12 ? 9 : 8;
      const glow = node.errors > 10000
        ? `<circle cx="${node.x}" cy="${node.y}" r="${node.radius + 4}" fill="none" stroke="#f4433655" stroke-width="3" />`
        : "";

      html += `${glow}
        <g class="mm-node" data-id="${node.id}" style="cursor:${this._nodeCursor(node)};opacity:${opacity}">
          <circle cx="${node.x}" cy="${node.y}" r="${node.radius}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <text x="${node.x}" y="${node.y + node.radius + fontSize + 2}" text-anchor="middle" fill="var(--primary-text-color, #fff)" font-size="${fontSize}" font-family="inherit">${this._esc(label)}</text>
        </g>`;
    }

    html += "</g>";
    svg.innerHTML = html;

    svg.querySelectorAll(".mm-node").forEach((group) => {
      const id = group.dataset.id;
      const node = nodeMap[id === "ha" ? "ha" : parseInt(id, 10)] || nodeMap[id];

      group.addEventListener("mousedown", (event) => {
        if (node && node.id !== "ha" && this._viewMode === "logical") {
          this._dragging = node;
          event.stopPropagation();
        }
      });

      group.addEventListener("mouseenter", (event) => {
        if (node) this._showTooltip(event, node);
      });
      group.addEventListener("mouseleave", () => this._hideTooltip());
    });
  }

  _regionMarkup() {
    return this._regions.map((region) => {
      const fill = region.kind === "floor"
        ? "rgba(3, 169, 244, 0.06)"
        : "rgba(255, 255, 255, 0.03)";
      const stroke = region.kind === "floor"
        ? "rgba(3, 169, 244, 0.22)"
        : "rgba(255, 255, 255, 0.1)";
      const labelWeight = region.kind === "floor" ? 600 : 500;
      return `
        <g class="mm-region mm-region-${region.kind}">
          <rect x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}" rx="16" ry="16" fill="${fill}" stroke="${stroke}" stroke-width="1" />
          <text x="${region.x + 12}" y="${region.y + 20}" fill="var(--secondary-text-color, #999)" font-size="11" font-weight="${labelWeight}" font-family="inherit">${this._esc(region.label)}</text>
        </g>`;
    }).join("");
  }

  _showTooltip(event, node) {
    const tooltip = this.querySelector("#mm-tooltip");
    const nameEl = this.querySelector("#mm-tt-name");
    const detailEl = this.querySelector("#mm-tt-detail");
    if (!tooltip) return;

    nameEl.textContent = node.name;
    let detail = node.id === "ha"
      ? this._t("homeAssistant")
      : `${this._t("node")} ${node.id} | ${this._roleLabel(node.role)}`;
    if (node.floor) detail += `\n${this._t("floor")}: ${node.floor}`;
    if (node.area) detail += `\n${this._t("area")}: ${node.area}`;
    if (node.product) detail += `\n${node.product}`;
    if (node.neighbors) detail += `\n${node.neighbors} ${this._t("neighbors").toLowerCase()}`;
    if (node.children) detail += `, ${node.children} ${this._t("children").toLowerCase()}`;
    if (node.battery != null) detail += `\n${this._t("batteryLabel", { value: Math.round(node.battery) })}`;
    if (node.errors > 0) detail += `\nErrors: ${node.errors.toLocaleString()}`;
    if (node.status === "offline") detail += `\n${this._t("offlineBadge")}`;
    detailEl.textContent = detail;

    const wrap = this.querySelector("#mm-wrap");
    const rect = wrap.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - rect.left + 12}px`;
    tooltip.style.top = `${event.clientY - rect.top - 10}px`;
    tooltip.classList.add("show");
  }

  _hideTooltip() {
    const tooltip = this.querySelector("#mm-tooltip");
    if (tooltip) tooltip.classList.remove("show");
  }

  _linkColor(rssi) {
    return window.MatterSaverCardUtils?.signalInfo(rssi)?.color || "rgba(255,255,255,0.25)";
  }

  _nodeCursor(node) {
    return this._viewMode === "logical" && node.id !== "ha" ? "grab" : "pointer";
  }

  _roleLabel(role) {
    return role === "ha"
      ? this._t("homeAssistant")
      : this._threadRoleLabel(role);
  }

  _threadRoleLabel(role) {
    return window.MatterSaverCardUtils?.roleLabel(this._hass, role) || role || this._t("unknown");
  }

  _t(key, vars) {
    return window.MatterSaverCardUtils?.t(this._hass, key, vars) || key;
  }

  _esc(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  static async getConfigElement() {
    const editor = document.createElement("matter-saver-card-editor");
    editor.cardType = "matter-saver-mesh-card";
    return editor;
  }

  static getStubConfig() {
    return {
      type: window.MatterSaverCardEditor?.buildCardType("matter-saver-mesh-card") || "custom:matter-saver-mesh-card",
      entity: "sensor.matter_saver_devices",
    };
  }

  getGridOptions() {
    return {
      columns: 12,
      rows: 10,
      min_columns: 6,
    };
  }

  getCardSize() { return 8; }
}

customElements.define("matter-saver-mesh-card", MatterSaverMeshCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "matter-saver-mesh-card",
  name: "Matter Saver Mesh Card",
  description: "Interactive Thread mesh network visualization",
  preview: true,
  documentationURL: "https://github.com/hellosamblack/matter-saver",
});
