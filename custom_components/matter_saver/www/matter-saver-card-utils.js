(() => {
  const COMPACT_DEVICE_ERROR = "Shared device decoder unavailable.";

  function hasCompactDevices(devices) {
    return Array.isArray(devices) && devices.some((device) => (
      device
      && typeof device === "object"
      && !Array.isArray(device)
      && Object.prototype.hasOwnProperty.call(device, "i")
    ));
  }

  function getDevices(state, cardName) {
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
      return { devices: [], error: COMPACT_DEVICE_ERROR };
    }

    return { devices, error: "" };
  }

  window.MatterSaverCardUtils = {
    COMPACT_DEVICE_ERROR,
    getDevices,
    hasCompactDevices,
  };
})();
