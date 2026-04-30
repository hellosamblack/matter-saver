"""Constants and shared metadata helpers for Matter Saver."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

DOMAIN = "matter_saver"
DEFAULT_NAME = "Matter Saver"

CONF_MATTER_URL = "matter_url"
DEFAULT_MATTER_URL = "ws://core-matter-server:5580/ws"

SCAN_INTERVAL_SECONDS = 60
DEFAULT_INTEGRATION_VERSION = "0.0.0"
GITHUB_REPOSITORY = "hellosamblack/matter-saver"
REPOSITORY_URL = f"https://github.com/{GITHUB_REPOSITORY}"
GITHUB_LATEST_RELEASE_API_URL = (
	f"https://api.github.com/repos/{GITHUB_REPOSITORY}/releases/latest"
)


@lru_cache(maxsize=1)
def get_manifest() -> dict[str, Any]:
	"""Return the parsed integration manifest."""
	manifest_path = Path(__file__).parent / "manifest.json"
	try:
		return json.loads(manifest_path.read_text(encoding="utf-8"))
	except (OSError, json.JSONDecodeError):
		return {}


def get_integration_version() -> str:
	"""Return the integration version from the manifest."""
	version = get_manifest().get("version")
	return version if isinstance(version, str) and version else DEFAULT_INTEGRATION_VERSION


def get_repository_url() -> str:
	"""Return the canonical repository URL."""
	return REPOSITORY_URL
