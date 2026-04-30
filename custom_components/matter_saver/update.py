"""Update platform for Matter Saver."""

from __future__ import annotations

import asyncio
from datetime import timedelta
from typing import Any

import aiohttp
from awesomeversion import AwesomeVersion

from homeassistant.components.update import UpdateEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import UPDATE_ICON_URL
from .const import (
    DOMAIN,
    GITHUB_LATEST_RELEASE_API_URL,
    GITHUB_REPOSITORY,
    get_integration_version,
    get_repository_url,
)

SCAN_INTERVAL = timedelta(hours=12)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the Matter Saver update entity."""
    async_add_entities([MatterSaverUpdateEntity(entry)], True)


class MatterSaverUpdateEntity(UpdateEntity):
    """Represent an available Matter Saver integration update."""

    _attr_has_entity_name = True
    _attr_name = "Update"
    _attr_icon = "mdi:package-up"
    _attr_should_poll = True

    def __init__(self, entry: ConfigEntry) -> None:
        """Initialize the update entity."""
        self._entry = entry
        self._attr_unique_id = f"{entry.entry_id}_update"
        self._attr_installed_version = get_integration_version()
        self._attr_latest_version = self._attr_installed_version
        self._attr_release_url = get_repository_url()
        self._attr_entity_picture = UPDATE_ICON_URL
        self._attr_device_info = {
            "identifiers": {(DOMAIN, entry.entry_id)},
            "name": "Matter Saver",
            "manufacturer": "Matter Saver",
            "model": "Matter Device Monitor",
            "sw_version": self._attr_installed_version,
            "configuration_url": get_repository_url(),
        }

    async def async_update(self) -> None:
        """Fetch the latest published Matter Saver release from GitHub."""
        self._attr_installed_version = get_integration_version()
        self._attr_release_url = get_repository_url()
        self._attr_latest_version = self._attr_installed_version

        session = async_get_clientsession(self.hass)
        headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": f"Home Assistant {DOMAIN}/{self._attr_installed_version}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        try:
            async with session.get(
                GITHUB_LATEST_RELEASE_API_URL,
                headers=headers,
                timeout=10,
            ) as response:
                if response.status != 200:
                    return

                payload = await response.json()
        except (aiohttp.ClientError, asyncio.TimeoutError, ValueError):
            return

        latest_version = _extract_release_version(payload)
        if latest_version is not None:
            self._attr_latest_version = latest_version

        release_url = payload.get("html_url")
        if isinstance(release_url, str) and release_url:
            self._attr_release_url = release_url
        elif latest_version is not None:
            self._attr_release_url = _build_release_notes_url(latest_version)


def _extract_release_version(payload: dict[str, Any]) -> str | None:
    """Extract a comparable version string from a GitHub release payload."""
    candidate = payload.get("tag_name") or payload.get("name")
    if not isinstance(candidate, str):
        return None

    normalized = candidate.strip().lstrip("vV")
    if not normalized:
        return None

    try:
        AwesomeVersion(normalized)
    except Exception:
        return None

    return normalized


def _build_release_notes_url(version: str) -> str:
    """Build a fallback release URL for a version tag."""
    return f"https://github.com/{GITHUB_REPOSITORY}/releases/tag/v{version}"