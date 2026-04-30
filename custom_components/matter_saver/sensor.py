"""Sensor platform for Matter Saver."""
from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import MatterSaverCoordinator
from .const import DOMAIN

ROLE_TO_CODE = {
    "leader": "l",
    "router": "r",
    "reed": "re",
    "end_device": "e",
    "sed": "s",
    "unassigned": "ua",
    "unspecified": "us",
    "unknown": "u",
}

POWER_TO_CODE = {
    "battery": "b",
    "wired": "w",
    "unknown": "u",
}


def _node_name(node: dict[str, Any]) -> str:
    """Return the preferred display name for a Matter node."""
    return (
        node.get("device_name")
        or node.get("node_label")
        or node.get("product_name")
        or f"Node {node['node_id']}"
    )


def _encode_route_path(route_path: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Compact route path payload for Lovelace cards."""
    compact_path: list[dict[str, Any]] = []
    for hop in route_path:
        compact_hop = {"i": hop.get("node_id")}
        if hop.get("rssi") is not None:
            compact_hop["rs"] = hop["rssi"]
        if hop.get("lqi") is not None:
            compact_hop["lq"] = hop["lqi"]
        compact_path.append(compact_hop)
    return compact_path


def _encode_device(node: dict[str, Any]) -> dict[str, Any]:
    """Compact device payload to keep state attributes small."""
    encoded: dict[str, Any] = {
        "i": node["node_id"],
        "n": _node_name(node),
        "av": node.get("available", False),
        "r": ROLE_TO_CODE.get(node.get("thread_role", "unknown"), "u"),
    }

    optional_fields = (
        ("a", node.get("area")),
        ("p", node.get("product_name")),
        ("f", node.get("software_version_string")),
        ("m", node.get("error_comment")),
        ("pn", node.get("parent_name")),
        ("ls", node.get("last_seen")),
    )
    for key, value in optional_fields:
        if value:
            encoded[key] = value

    if node.get("power_source"):
        encoded["w"] = POWER_TO_CODE.get(node["power_source"], "u")
    if node.get("update_available"):
        encoded["u"] = True
    if node.get("neighbors"):
        encoded["k"] = node["neighbors"]
    if node.get("children"):
        encoded["ch"] = node["children"]
    if node.get("errors"):
        encoded["e"] = node["errors"]
    if node.get("parent_node_id") is not None:
        encoded["pi"] = node["parent_node_id"]
    if node.get("route_path"):
        encoded["rt"] = _encode_route_path(node["route_path"])
    if node.get("offline_7d_count"):
        encoded["c7"] = node["offline_7d_count"]
    if node.get("offline_7d_minutes"):
        encoded["m7"] = node["offline_7d_minutes"]
    if node.get("offline_30d_count"):
        encoded["c30"] = node["offline_30d_count"]
    if node.get("offline_30d_minutes"):
        encoded["m30"] = node["offline_30d_minutes"]
    if node.get("battery_percent") is not None:
        encoded["b"] = round(node["battery_percent"], 1)

    return encoded


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Matter Saver sensors."""
    coordinator: MatterSaverCoordinator = entry.runtime_data
    async_add_entities([
        MatterDeviceCountSensor(coordinator, entry),
        MatterOnlineSensor(coordinator, entry),
        MatterOfflineSensor(coordinator, entry),
        MatterActivityLogSensor(coordinator, entry),
    ])


class MatterSaverBaseSensor(CoordinatorEntity[MatterSaverCoordinator], SensorEntity):
    """Base class for Matter Saver sensors."""

    _attr_has_entity_name = True

    def __init__(
        self, coordinator: MatterSaverCoordinator, entry: ConfigEntry
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._entry = entry
        self._attr_device_info = {
            "identifiers": {(DOMAIN, entry.entry_id)},
            "name": "Matter Saver",
            "manufacturer": "Matter Saver",
            "model": "Matter Device Monitor",
            "sw_version": "0.1.0",
        }


class MatterDeviceCountSensor(MatterSaverBaseSensor):
    """Sensor showing total Matter device count with details as attributes."""

    _attr_name = "Devices"
    _attr_icon = "mdi:devices"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "devices"
    _unrecorded_attributes = frozenset({"devices"})

    def __init__(
        self, coordinator: MatterSaverCoordinator, entry: ConfigEntry
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_device_count"

    @property
    def native_value(self) -> int:
        """Return total device count."""
        if self.coordinator.data is None:
            return 0
        return self.coordinator.data.get("total", 0)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return device details as attributes."""
        if self.coordinator.data is None:
            return {}

        data = self.coordinator.data
        nodes = data.get("nodes", [])

        return {
            "online": data.get("online", 0),
            "offline": data.get("offline", 0),
            "devices": [_encode_device(node) for node in nodes],
        }


class MatterOnlineSensor(MatterSaverBaseSensor):
    """Sensor showing online Matter device count."""

    _attr_name = "Online"
    _attr_icon = "mdi:check-network"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "devices"

    def __init__(
        self, coordinator: MatterSaverCoordinator, entry: ConfigEntry
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_online"

    @property
    def native_value(self) -> int:
        """Return online device count."""
        if self.coordinator.data is None:
            return 0
        return self.coordinator.data.get("online", 0)


class MatterOfflineSensor(MatterSaverBaseSensor):
    """Sensor showing offline Matter device count."""

    _attr_name = "Offline"
    _attr_icon = "mdi:close-network"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "devices"
    # Exclude high-cardinality device names from recorder history.
    _unrecorded_attributes = frozenset({"device_names"})

    def __init__(
        self, coordinator: MatterSaverCoordinator, entry: ConfigEntry
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_offline"

    @property
    def native_value(self) -> int:
        """Return offline device count."""
        if self.coordinator.data is None:
            return 0
        return self.coordinator.data.get("offline", 0)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return offline device names for notifications/automations."""
        if self.coordinator.data is None:
            return {"device_names": []}

        nodes = self.coordinator.data.get("nodes", [])
        return {
            "device_names": [
                _node_name(node) for node in nodes if not node.get("available", False)
            ],
        }


class MatterActivityLogSensor(MatterSaverBaseSensor):
    """Sensor providing the activity log."""

    _attr_name = "Activity Log"
    _attr_icon = "mdi:text-box-outline"
    _unrecorded_attributes = frozenset({"entries"})

    def __init__(
        self, coordinator: MatterSaverCoordinator, entry: ConfigEntry
    ) -> None:
        """Initialize."""
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_activity_log"

    @property
    def native_value(self) -> int:
        """Return number of log entries."""
        return len(self.coordinator.activity_log)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return log entries."""
        return {
            "entries": self.coordinator.activity_log,
        }
