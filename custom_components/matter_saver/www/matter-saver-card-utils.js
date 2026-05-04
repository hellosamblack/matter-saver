(() => {
  const COMPACT_DEVICE_ERROR = "Shared device decoder unavailable.";
  const LOCATION_ORDER_FALLBACKS = {
    floor: "::matter_saver_internal_no_floor::",
    area: "::matter_saver_internal_no_area::",
  };
  const ROUTING_ROLES = new Set(["leader", "router", "reed"]);
  const AREA_NAME_BOUNDARY_PATTERN = "[\\s\\-–—:()\\[\\],/]+";
  const DEVICE_ICON_RULES = [
    { icon: "mdi:home-lock", patterns: [/\b(lock|deadbolt|door lock)\b/i] },
    { icon: "mdi:power-plug", patterns: [/\b(outlet|socket|plug|receptacle)\b/i] },
    { icon: "mdi:lightbulb", patterns: [/\b(light|lamp|bulb|dimmer|lighting)\b/i] },
    { icon: "mdi:motion-sensor", patterns: [/\b(motion|occupancy|presence)\b/i] },
    { icon: "mdi:air-filter", patterns: [/\b(air quality|iaq|voc|pm2\.?5|co2)\b/i] },
    { icon: "mdi:gesture-tap-button", patterns: [/\b(button|scene controller|remote)\b/i] },
    { icon: "mdi:door-closed", patterns: [/\b(door|contact sensor|entry sensor)\b/i] },
    { icon: "mdi:window-closed", patterns: [/\b(window|shade sensor)\b/i] },
    { icon: "mdi:blinds", patterns: [/\b(blind|shade|curtain)\b/i] },
    { icon: "mdi:thermostat", patterns: [/\b(thermostat|trv|radiator valve|heating)\b/i] },
    { icon: "mdi:thermometer", patterns: [/\b(temperature|thermo)\b/i] },
    { icon: "mdi:water-percent", patterns: [/\b(humidity)\b/i] },
    { icon: "mdi:water-alert", patterns: [/\b(leak|water sensor|flood)\b/i] },
    { icon: "mdi:smoke-detector", patterns: [/\b(smoke|carbon monoxide|co alarm|alarm)\b/i] },
    { icon: "mdi:fan", patterns: [/\b(fan|ventilation|air purifier)\b/i] },
    { icon: "mdi:toggle-switch", patterns: [/\b(switch|relay)\b/i] },
    { icon: "mdi:router-wireless", patterns: [/\b(router|border router|gateway|hub)\b/i] },
    { icon: "mdi:radar", patterns: [/\b(sensor|detector|monitor)\b/i] },
  ];

  const STRINGS = {
    en: {
      entityNotFound: "Entity not found",
      sharedDeviceDecoderUnavailable: "Shared device decoder unavailable.",
      filterDevicesPlaceholder: "Filter devices...",
      filterLogPlaceholder: "Filter log...",
      noActivities: "No activity yet",
      entry_one: "entry",
      entry_other: "entries",
      justNow: "just now",
      minuteAgo: "{count}m ago",
      hourAgo: "{count}h ago",
      dayAgo: "{count}d ago",
      routeTitle: "Route: {name}",
      routePath: "Route",
      unknown: "Unknown",
      borderRouterGateway: "Border Router Gateway",
      online: "online",
      offline: "offline",
      node: "Node",
      name: "Name",
      area: "Area",
      floor: "Floor",
      editorLayoutModeLabel: "Layout mode",
      editorLayoutModeHelper: "Arrange devices by Thread routing or by Home Assistant floor and area placement.",
      editorLayoutLogical: "Logical",
      editorLayoutByFloor: "By Floor",
      editorLayoutByArea: "By Area",
      editorLayoutByFloorArea: "By Floor and Area",
      editorFloorOrderLabel: "Floor order",
      editorFloorOrderHelper: "Order floors from top to bottom for By Floor and dollhouse layouts.",
      editorAreaOrderLabel: "Area order",
      editorAreaOrderHelper: "Order rooms from left to right for By Area and dollhouse layouts.",
      editorTrimAreaFromNameLabel: "Hide room name in node labels",
      editorTrimAreaFromNameHelper: "Shorten labels like “Bathroom Door” to “Door” when the area is Bathroom.",
      product: "Product",
      status: "Status",
      thread: "Thread",
      neighbors: "Neighbors",
      children: "Children",
      parent: "Parent",
      parentNodeId: "Parent Node ID",
      signal: "Signal",
      signalQuality: "Signal Quality",
      signalRssi: "RSSI",
      signalLqi: "LQI",
      power: "Power",
      battery: "Battery",
      firmware: "Firmware",
      vendor: "Vendor",
      label: "Label",
      serialNumber: "Serial Number",
      commissioned: "Commissioned",
      lastInterview: "Last Interview",
      txRetries: "TX Retries",
      update: "Update",
      errors: "Errors",
      lastSeen: "Last Seen",
      nodeId: "Node ID",
      diagnostics: "Diagnostics",
      issueCodes: "Issue Codes",
      downtime24h: "24h Downtime",
      downtime7d: "7d Downtime",
      offline24h: "Offline 24h",
      offline7d: "Offline 7d",
      offline30d: "Offline 30d",
      offline24hCount: "24h Offline Count",
      offline24hDuration: "24h Offline Duration",
      offline7dCount: "7d Offline Count",
      offline7dDuration: "7d Offline Duration",
      offline30dCount: "30d Offline Count",
      offline30dDuration: "30d Offline Duration",
      repairHistory: "Repair history",
      onlineGroup: "Online",
      offlineGroup: "Offline",
      batteryPower: "Battery",
      wiredPower: "Wired",
      noArea: "No Area",
      noFloor: "No Floor",
      editorNoFloorsDetected: "No floors detected on the selected devices yet.",
      editorNoAreasDetected: "No areas detected on the selected devices yet.",
      editorTopToBottom: "Top to bottom",
      editorLeftToRight: "Left to right",
      editorMoveItemUp: "Move {name} up in the order",
      editorMoveItemDown: "Move {name} down in the order",
      noParentRouter: "No Parent (Router)",
      noBattery: "No Battery",
      criticalBattery: "Critical (< 20%)",
      lowBattery: "Low (< 50%)",
      goodBattery: "Good (50%+)",
      noErrors: "No Errors",
      critical: "Critical",
      high: "High",
      moderate: "Moderate",
      low: "Low",
      neverSeen: "Never seen",
      seen: "Seen",
      noDevicesFound: "No devices found",
      routerFallback: "Router",
      leader: "Leader",
      router: "Router",
      reed: "REED",
      end_device: "End Device",
      sed: "Sleepy End Device",
      unassigned: "Unassigned",
      unspecified: "Unspecified",
      homeAssistant: "Home Assistant",
      endDevices: "End Devices",
      noEndDevicesAttached: "No end devices attached",
      unassignedEndDevices: "Unassigned end devices",
      parentLegend: "Parent",
      neighborLegend: "Neighbor",
      strongSignal: "Strong signal",
      fairSignal: "Fair signal",
      weakSignal: "Weak signal",
      unknownSignal: "Unknown signal",
      routeHopCount: "Route Hop Count",
      routeDetails: "Route Details",
      notAvailable: "Not available",
      reset: "Reset",
      batteryLabel: "Battery: {value}%",
      updateAvailable: "Available",
      upToDate: "Current",
      offlineBadge: "OFFLINE",
      overviewTab: "Overview",
      threadTab: "Thread",
      diagnosticsTab: "Diagnostics",
      historyTab: "History",
      actionsTab: "Actions",
      noHistory: "No activity for this device yet",
      autoRecoveryPingFailed: "Auto-Recovery: ping failed",
      autoRecoveryPingOk: "Auto-Recovery: ping ok, starting re-interview",
      autoRecoveryInterviewFailed: "Auto-Recovery: re-interview failed",
      autoRecoveryInterviewSucceeded: "Auto-Recovery: re-interview succeeded",
      problemDetected: "problem detected: {problem}",
      problemUpdated: "problem updated: {problem}",
      problemCleared: "problem cleared",
      actionStarted: "{action} started",
      actionFailed: "{action} failed: {error}",
      actionSucceeded: "{action} succeeded",
      suggestionPingFirst: "💡 Recommendation: Try Ping first to check whether the device is reachable on the Thread network.",
      suggestionInterviewNext: "💡 Recommendation: Ping succeeded, so the device is reachable on Thread. Try Re-Interview to rebuild the Matter connection.",
      suggestionRestartAddon: "⚠️ Recommendation: Ping succeeded but Re-Interview failed — the Matter application is not responding.<br><br>1. Restart the Matter Server addon: <button class=\"ms-action-btn\" id=\"ms-restart-addon\" style=\"background:#b71c1c;color:#fff;display:inline-flex;padding:6px 14px;font-size:0.85em;margin:4px 0\">⚡ Restart Matter Server</button><br>2. If that does not help: physically power-cycle the device (5 seconds) and plug it back in",
      suggestionPingFailed: "⚠️ Recommendation: Ping failed — the device is unreachable. Possible causes:<br>1. No power → check plug/breaker<br>2. Outside Thread range → move it closer to a router<br>3. Hardware failure",
      suggestionResetCounters: "💡 Recommendation: Error counters are high. Run Reset Counters and watch whether the errors return. If they do, move the device.",
      suggestionMoveDevice: "⚠️ Recommendation: Counters were already reset. If errors keep increasing, the device is likely in an area with strong RF interference (Wi-Fi, microwave). Reposition it or inspect the Thread channel.",
      pingRunning: "Running Ping...",
      interviewRunning: "Running Re-Interview, this can take up to 30 seconds...",
      resetRunning: "Resetting error counters...",
      actionSuccessForNode: "{action} succeeded for Node {nodeId}",
      errorPrefix: "Error: {error}",
      restartAddonConfirm: "Restart the Matter Server addon?\n\nAll Matter devices will be offline briefly (30–60 seconds).",
      restartAddonLoading: "Restarting the Matter Server addon. All devices will go offline briefly...",
      restartAddonSuccess: "Matter Server addon restarted. Devices should come back within 1–5 minutes.",
      issue_thread_noise_severe: "severe channel interference",
      issue_thread_noise_moderate: "channel interference",
      issue_tx_abort_severe: "many aborted transmissions",
      issue_tx_abort_moderate: "aborted transmissions",
      issue_rx_no_frame_severe: "reception problems",
      issue_rx_no_frame_moderate: "minor reception problems",
      issue_rx_unknown_neighbors: "unknown neighbors",
      issue_rx_invalid_source: "invalid sources",
      issue_tx_retry_severe: "very poor connection",
      issue_tx_retry_moderate: "poor connection",
    },
    de: {
      entityNotFound: "Entität nicht gefunden",
      sharedDeviceDecoderUnavailable: "Gemeinsamer Geräte-Decoder ist nicht verfügbar.",
      filterDevicesPlaceholder: "Geräte filtern...",
      filterLogPlaceholder: "Protokoll filtern...",
      noActivities: "Noch keine Aktivitäten",
      entry_one: "Eintrag",
      entry_other: "Einträge",
      justNow: "gerade eben",
      minuteAgo: "vor {count}m",
      hourAgo: "vor {count}h",
      dayAgo: "vor {count}d",
      routeTitle: "Route: {name}",
      routePath: "Route",
      unknown: "Unbekannt",
      borderRouterGateway: "Border-Router-Gateway",
      online: "online",
      offline: "offline",
      node: "Node",
      name: "Name",
      area: "Bereich",
      floor: "Etage",
      editorLayoutModeLabel: "Layout-Modus",
      editorLayoutModeHelper: "Geräte nach Thread-Routing oder nach Home-Assistant-Etage und -Bereich anordnen.",
      editorLayoutLogical: "Logisch",
      editorLayoutByFloor: "Nach Etage",
      editorLayoutByArea: "Nach Bereich",
      editorLayoutByFloorArea: "Nach Etage und Bereich",
      editorFloorOrderLabel: "Etagen-Reihenfolge",
      editorFloorOrderHelper: "Etagen für Nach-Etage- und Puppenhaus-Layouts von oben nach unten anordnen.",
      editorAreaOrderLabel: "Bereichs-Reihenfolge",
      editorAreaOrderHelper: "Räume für Nach-Bereich- und Puppenhaus-Layouts von links nach rechts anordnen.",
      editorTrimAreaFromNameLabel: "Raumnamen in Knotenlabels ausblenden",
      editorTrimAreaFromNameHelper: "Kürzt Labels wie „Badezimmer Tür“ auf „Tür“, wenn der Bereich Badezimmer ist.",
      product: "Produkt",
      status: "Status",
      thread: "Thread",
      neighbors: "Nachbarn",
      children: "Kinder",
      parent: "Parent",
      parentNodeId: "Parent Node ID",
      signal: "Signal",
      signalQuality: "Signalqualität",
      signalRssi: "RSSI",
      signalLqi: "LQI",
      power: "Strom",
      battery: "Batterie",
      firmware: "Firmware",
      vendor: "Hersteller",
      label: "Label",
      serialNumber: "Seriennummer",
      commissioned: "Kommissioniert",
      lastInterview: "Letztes Interview",
      txRetries: "TX Retries",
      update: "Update",
      errors: "Fehler",
      lastSeen: "Zuletzt gesehen",
      nodeId: "Node ID",
      diagnostics: "Diagnose",
      issueCodes: "Issue Codes",
      downtime24h: "24h Ausfall",
      downtime7d: "7d Ausfall",
      offline24h: "Offline 24h",
      offline7d: "Offline 7d",
      offline30d: "Offline 30d",
      offline24hCount: "Offline-Anzahl 24h",
      offline24hDuration: "Offline-Dauer 24h",
      offline7dCount: "Offline-Anzahl 7d",
      offline7dDuration: "Offline-Dauer 7d",
      offline30dCount: "Offline-Anzahl 30d",
      offline30dDuration: "Offline-Dauer 30d",
      repairHistory: "Reparaturverlauf",
      onlineGroup: "Online",
      offlineGroup: "Offline",
      batteryPower: "Batterie",
      wiredPower: "Netzteil",
      noArea: "Kein Bereich",
      noFloor: "Keine Etage",
      editorNoFloorsDetected: "Für die ausgewählten Geräte wurden noch keine Etagen erkannt.",
      editorNoAreasDetected: "Für die ausgewählten Geräte wurden noch keine Bereiche erkannt.",
      editorTopToBottom: "Von oben nach unten",
      editorLeftToRight: "Von links nach rechts",
      editorMoveItemUp: "{name} in der Reihenfolge nach oben verschieben",
      editorMoveItemDown: "{name} in der Reihenfolge nach unten verschieben",
      noParentRouter: "Kein Parent (Router)",
      noBattery: "Keine Batterie",
      criticalBattery: "Kritisch (< 20%)",
      lowBattery: "Niedrig (< 50%)",
      goodBattery: "Gut (50%+)",
      noErrors: "Keine Fehler",
      critical: "Kritisch",
      high: "Hoch",
      moderate: "Mittel",
      low: "Niedrig",
      neverSeen: "Nie gesehen",
      seen: "Gesehen",
      noDevicesFound: "Keine Geräte gefunden",
      routerFallback: "Router",
      leader: "Leader",
      router: "Router",
      reed: "REED",
      end_device: "End Device",
      sed: "Sleepy End Device",
      unassigned: "Nicht zugeordnet",
      unspecified: "Nicht spezifiziert",
      homeAssistant: "Home Assistant",
      endDevices: "End Devices",
      noEndDevicesAttached: "Keine End Devices angebunden",
      unassignedEndDevices: "Nicht zugeordnete End Devices",
      parentLegend: "Parent",
      neighborLegend: "Nachbar",
      strongSignal: "Starkes Signal",
      fairSignal: "Mittleres Signal",
      weakSignal: "Schwaches Signal",
      unknownSignal: "Unbekanntes Signal",
      routeHopCount: "Route-Hop-Anzahl",
      routeDetails: "Route-Details",
      notAvailable: "Nicht verfügbar",
      reset: "Reset",
      batteryLabel: "Batterie: {value}%",
      updateAvailable: "Verfügbar",
      upToDate: "Aktuell",
      offlineBadge: "OFFLINE",
      overviewTab: "Übersicht",
      threadTab: "Thread",
      diagnosticsTab: "Diagnose",
      historyTab: "Verlauf",
      actionsTab: "Aktionen",
      noHistory: "Noch keine Aktivitäten für dieses Gerät",
      autoRecoveryPingFailed: "Auto-Recovery: Ping fehlgeschlagen",
      autoRecoveryPingOk: "Auto-Recovery: Ping OK, starte Re-Interview",
      autoRecoveryInterviewFailed: "Auto-Recovery: Re-Interview fehlgeschlagen",
      autoRecoveryInterviewSucceeded: "Auto-Recovery: Re-Interview erfolgreich",
      problemDetected: "Problem erkannt: {problem}",
      problemUpdated: "Problem aktualisiert: {problem}",
      problemCleared: "Problem behoben",
      actionStarted: "{action} gestartet",
      actionFailed: "{action} fehlgeschlagen: {error}",
      actionSucceeded: "{action} erfolgreich",
      suggestionPingFirst: "💡 <strong>Empfehlung:</strong> Zuerst Ping versuchen, um zu prüfen, ob das Gerät auf Thread-Ebene erreichbar ist.",
      suggestionInterviewNext: "💡 <strong>Empfehlung:</strong> Ping war erfolgreich — das Gerät ist auf Thread-Ebene erreichbar. Re-Interview versuchen, um die Matter-Verbindung neu aufzubauen.",
      suggestionRestartAddon: "⚠️ <strong>Empfehlung:</strong> Ping OK, aber Re-Interview gescheitert — die Matter-Application reagiert nicht.<br><br>1. Matter Server Addon neu starten: <button class=\"ms-action-btn\" id=\"ms-restart-addon\" style=\"background:#b71c1c;color:#fff;display:inline-flex;padding:6px 14px;font-size:0.85em;margin:4px 0\">⚡ Matter Server neu starten</button><br>2. Falls das nicht hilft: Gerät physisch vom Strom trennen (5 Sek.) und wieder einstecken",
      suggestionPingFailed: "⚠️ <strong>Empfehlung:</strong> Ping fehlgeschlagen — das Gerät ist nicht erreichbar. Mögliche Ursachen:<br>1. Kein Strom → Stecker/Sicherung prüfen<br>2. Außerhalb der Thread-Reichweite → näher an einen Router stellen<br>3. Hardware-Defekt",
      suggestionResetCounters: "💡 <strong>Empfehlung:</strong> Hohe Error-Zähler. Reset Counters ausführen und beobachten, ob die Fehler wiederkommen. Falls ja, Gerät umplatzieren.",
      suggestionMoveDevice: "⚠️ <strong>Empfehlung:</strong> Counter wurden bereits zurückgesetzt. Falls Fehler weiter steigen, steht das Gerät vermutlich in einem Bereich mit starken Funkstörungen (WLAN, Mikrowelle). Umplatzieren oder Thread-Kanal prüfen.",
      pingRunning: "Ping wird ausgeführt...",
      interviewRunning: "Re-Interview läuft, das kann bis zu 30 Sekunden dauern...",
      resetRunning: "Error Counter werden zurückgesetzt...",
      actionSuccessForNode: "{action} erfolgreich für Node {nodeId}",
      errorPrefix: "Fehler: {error}",
      restartAddonConfirm: "Matter Server Addon neu starten?\n\nAlle Matter-Geräte werden kurzzeitig offline sein (30–60 Sek.).",
      restartAddonLoading: "Matter Server Addon wird neu gestartet, alle Geräte werden kurzzeitig offline...",
      restartAddonSuccess: "Matter Server Addon neu gestartet. Geräte kommen in 1–5 Minuten zurück.",
      issue_thread_noise_severe: "starke Kanalstörungen",
      issue_thread_noise_moderate: "Kanalstörungen",
      issue_tx_abort_severe: "viele Sendeabbrüche",
      issue_tx_abort_moderate: "Sendeabbrüche",
      issue_rx_no_frame_severe: "Empfangsprobleme",
      issue_rx_no_frame_moderate: "leichte Empfangsprobleme",
      issue_rx_unknown_neighbors: "unbekannte Nachbarn",
      issue_rx_invalid_source: "ungültige Quellen",
      issue_tx_retry_severe: "sehr schlechte Verbindung",
      issue_tx_retry_moderate: "schlechte Verbindung",
    },
  };

  const ACTIONS = {
    en: { ping: "Ping", interview: "Re-Interview", reset: "Reset Counters" },
    de: { ping: "Ping", interview: "Re-Interview", reset: "Reset Counters" },
  };

  const ISSUE_ALIASES = {
    "starke Kanalstörungen": "thread_noise_severe",
    "Kanalstörungen": "thread_noise_moderate",
    "viele Sendeabbrüche": "tx_abort_severe",
    "Sendeabbrüche": "tx_abort_moderate",
    "Empfangsprobleme": "rx_no_frame_severe",
    "leichte Empfangsprobleme": "rx_no_frame_moderate",
    "unbekannte Nachbarn": "rx_unknown_neighbors",
    "ungültige Quellen": "rx_invalid_source",
    "sehr schlechte Verbindung": "tx_retry_severe",
    "schlechte Verbindung": "tx_retry_moderate",
    "severe channel interference": "thread_noise_severe",
    "channel interference": "thread_noise_moderate",
    "many aborted transmissions": "tx_abort_severe",
    "aborted transmissions": "tx_abort_moderate",
    "reception problems": "rx_no_frame_severe",
    "minor reception problems": "rx_no_frame_moderate",
    "unknown neighbors": "rx_unknown_neighbors",
    "invalid sources": "rx_invalid_source",
    "very poor connection": "tx_retry_severe",
    "poor connection": "tx_retry_moderate",
  };

  const LEGACY_ACTIONS = {
    Ping: "ping",
    "Re-Interview": "interview",
    "Error Counter Reset": "reset",
    "Reset Counters": "reset",
  };

  function normalizeLanguage(language) {
    return String(language || "en").toLowerCase().startsWith("de") ? "de" : "en";
  }

  function getLocale(hass) {
    return hass?.locale?.language || navigator.language || "en";
  }

  function getLanguage(hass) {
    return normalizeLanguage(getLocale(hass));
  }

  function template(str, vars = {}) {
    return String(str).replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
  }

  function t(hass, key, vars = {}) {
    const lang = getLanguage(hass);
    const value = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
    return template(value, vars);
  }

  function actionLabel(hass, action) {
    const lang = getLanguage(hass);
    return ACTIONS[lang]?.[action] || ACTIONS.en[action] || action || "";
  }

  function roleLabel(hass, role) {
    return t(hass, role || "unknown");
  }

  function formatDate(hass, value, options) {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(getLocale(hass), options).format(date);
  }

  function formatRelativeTime(hass, value) {
    const date = value instanceof Date ? value : new Date(value);
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return t(hass, "justNow");
    if (diffMin < 60) return t(hass, "minuteAgo", { count: diffMin });
    if (diffMin < 1440) return t(hass, "hourAgo", { count: Math.floor(diffMin / 60) });
    return t(hass, "dayAgo", { count: Math.floor(diffMin / 1440) });
  }

  function formatList(hass, values) {
    const filtered = values.filter(Boolean);
    if (typeof Intl.ListFormat === "function") {
      return new Intl.ListFormat(getLocale(hass), { style: "long", type: "conjunction" }).format(filtered);
    }
    return filtered.join(", ");
  }

  function normalizeIssueCodes(codes, message = "") {
    if (Array.isArray(codes) && codes.length > 0) return codes;
    return String(message || "")
      .split(",")
      .map((part) => ISSUE_ALIASES[part.trim()])
      .filter(Boolean);
  }

  function localizeIssueComment(hass, message = "", codes = []) {
    const normalized = normalizeIssueCodes(codes, message);
    if (normalized.length > 0) {
      return formatList(hass, normalized.map((code) => t(hass, `issue_${code}`)));
    }
    return message || "";
  }

  function legacyActionCode(raw) {
    return LEGACY_ACTIONS[raw] || null;
  }

  function localizeLegacyLogMessage(hass, message) {
    const text = String(message || "");
    if (!text) return "";

    if (text === "online") return t(hass, "online");
    if (text === "offline") return t(hass, "offline");
    if (text === "problem cleared") return t(hass, "problemCleared");

    const problemDetected = text.match(/^problem detected: (.+)$/i);
    if (problemDetected) {
      return t(hass, "problemDetected", {
        problem: localizeIssueComment(hass, problemDetected[1]),
      });
    }

    const problemUpdated = text.match(/^problem updated: (.+)$/i);
    if (problemUpdated) {
      return t(hass, "problemUpdated", {
        problem: localizeIssueComment(hass, problemUpdated[1]),
      });
    }

    const actionStarted = text.match(/^(Ping|Re-Interview|Error Counter Reset|Reset Counters) gestartet$/);
    if (actionStarted) {
      const action = legacyActionCode(actionStarted[1]);
      return t(hass, "actionStarted", { action: actionLabel(hass, action) });
    }

    const actionFailed = text.match(/^(Ping|Re-Interview|Error Counter Reset|Reset Counters) fehlgeschlagen: (.+)$/);
    if (actionFailed) {
      const action = legacyActionCode(actionFailed[1]);
      return t(hass, "actionFailed", { action: actionLabel(hass, action), error: actionFailed[2] });
    }

    if (text === "Ping erfolgreich") return t(hass, "actionSucceeded", { action: actionLabel(hass, "ping") });
    if (text === "Re-Interview erfolgreich") return t(hass, "actionSucceeded", { action: actionLabel(hass, "interview") });
    if (text === "Error Counter zurückgesetzt") return t(hass, "actionSucceeded", { action: actionLabel(hass, "reset") });
    if (text === "Auto-Recovery: Ping fehlgeschlagen") return t(hass, "autoRecoveryPingFailed");
    if (text === "Auto-Recovery: Ping OK, starte Re-Interview") return t(hass, "autoRecoveryPingOk");
    if (text === "Auto-Recovery: Re-Interview fehlgeschlagen") return t(hass, "autoRecoveryInterviewFailed");
    if (text === "Auto-Recovery: Re-Interview erfolgreich") return t(hass, "autoRecoveryInterviewSucceeded");

    return text;
  }

  function localizeLogMessage(hass, entry) {
    const key = entry?.message_key;
    if (!key) return localizeLegacyLogMessage(hass, entry?.message || "");

    switch (key) {
      case "node_online":
        return t(hass, "online");
      case "node_offline":
        return t(hass, "offline");
      case "problem_detected":
        return t(hass, "problemDetected", {
          problem: localizeIssueComment(hass, entry.problem_message || entry.message, entry.problem_codes),
        });
      case "problem_updated":
        return t(hass, "problemUpdated", {
          problem: localizeIssueComment(hass, entry.problem_message || entry.message, entry.problem_codes),
        });
      case "problem_cleared":
        return t(hass, "problemCleared");
      case "action_started":
        return t(hass, "actionStarted", { action: actionLabel(hass, entry.action) });
      case "action_failed":
        return t(hass, "actionFailed", {
          action: actionLabel(hass, entry.action),
          error: entry.error || "",
        });
      case "action_succeeded":
        return t(hass, "actionSucceeded", { action: actionLabel(hass, entry.action) });
      case "auto_recovery_ping_failed":
        return t(hass, "autoRecoveryPingFailed");
      case "auto_recovery_ping_ok":
        return t(hass, "autoRecoveryPingOk");
      case "auto_recovery_interview_failed":
        return t(hass, "autoRecoveryInterviewFailed");
      case "auto_recovery_interview_succeeded":
        return t(hass, "autoRecoveryInterviewSucceeded");
      default:
        return localizeLegacyLogMessage(hass, entry?.message || "");
    }
  }

  function formatCountLabel(hass, count) {
    return `${count} ${t(hass, count === 1 ? "entry_one" : "entry_other")}`;
  }

  function hasNumericValue(value) {
    return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  }

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function signalInfo(rssi) {
    if (!hasNumericValue(rssi)) {
      return { level: "unknown", color: "rgba(255,255,255,0.25)" };
    }
    const value = Number(rssi);
    if (value > -70) return { level: "strong", color: "#4caf50" };
    if (value > -85) return { level: "fair", color: "#ff9800" };
    return { level: "weak", color: "#f44336" };
  }

  function formatSignal(hass, rssi, lqi) {
    const hasRssi = hasNumericValue(rssi);
    const hasLqi = hasNumericValue(lqi);
    if (!hasRssi && !hasLqi) return t(hass, "unknownSignal");
    if (!hasRssi) return `LQI ${Number(lqi)}/3`;
    const base = `${Math.round(Number(rssi))} dBm`;
    return hasLqi ? `${base} • LQI ${Number(lqi)}/3` : base;
  }

  function trimAreaFromName(name, area) {
    const normalizedName = String(name || "").trim();
    const normalizedArea = String(area || "").trim();
    if (!normalizedName || !normalizedArea) {
      return normalizedName;
    }

    let matcher;
    try {
      matcher = new RegExp(`(^|${AREA_NAME_BOUNDARY_PATTERN})${escapeRegExp(normalizedArea)}(?=$|${AREA_NAME_BOUNDARY_PATTERN})`, "ig");
    } catch (error) {
      return normalizedName;
    }

    const trimmed = normalizedName
      .replace(matcher, "$1")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s\-–—:(),/]+|[\s\-–—:(),/]+$/g, "")
      .trim();

    return trimmed || normalizedName;
  }

  function deviceTypeIcon(device) {
    if (!device || typeof device !== "object" || Array.isArray(device)) {
      return "mdi:devices";
    }

    if (device.node_id === "ha" || device.role === "ha") {
      return "mdi:home-assistant";
    }

    const haystack = [
      device.name,
      device.product,
      device.node_label,
      device.vendor,
    ].filter(Boolean).join(" ");

    for (const rule of DEVICE_ICON_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(haystack))) {
        return rule.icon;
      }
    }

    if (ROUTING_ROLES.has(device.thread_role || device.role)) {
      return "mdi:router-wireless";
    }

    return device.power === "battery" ? "mdi:battery" : "mdi:devices";
  }

  function hasCompactDevices(devices) {
    return Array.isArray(devices) && devices.some((device) => (
      device
      && typeof device === "object"
      && !Array.isArray(device)
      && Object.prototype.hasOwnProperty.call(device, "i")
    ));
  }

  function getDevices(state, cardName, hass) {
    const normalized = window.MatterSaverDeviceData?.normalizeDevices(state);
    if (Array.isArray(normalized)) {
      return { devices: normalized, error: "" };
    }

    const devices = (state?.attributes && state.attributes.devices) || [];
    if (!Array.isArray(devices)) {
      return { devices: [], error: "" };
    }

    if (hasCompactDevices(devices)) {
      console.warn(`${cardName}: compact device payload found but MatterSaverDeviceData.normalizeDevices is unavailable; returning no devices to avoid mis-rendering.`);
      return { devices: [], error: t(hass, "sharedDeviceDecoderUnavailable") };
    }

    return { devices, error: "" };
  }

  window.MatterSaverCardUtils = {
    COMPACT_DEVICE_ERROR,
    LOCATION_ORDER_FALLBACKS,
    getDevices,
    hasCompactDevices,
    getLanguage,
    getLocale,
    t,
    actionLabel,
    roleLabel,
    signalInfo,
    formatSignal,
    trimAreaFromName,
    deviceTypeIcon,
    formatDate,
    formatRelativeTime,
    formatCountLabel,
    localizeIssueComment,
    localizeLogMessage,
  };
})();
