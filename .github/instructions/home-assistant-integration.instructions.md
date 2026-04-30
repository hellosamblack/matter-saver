---
applyTo: 'custom_components/matter_saver/**/*.py'
description: "Backend guidance for the Matter Saver Home Assistant integration. Use when editing the coordinator, config flow, services, sensors, storage, or Matter Server communication."
---

# Matter Saver Home Assistant integration

- Follow Home Assistant async conventions: prefer `async def`, avoid blocking I/O, and keep network access inside async paths.
- `MatterSaverCoordinator` in `custom_components/matter_saver/__init__.py` is the center of data flow; prefer extending coordinator data rather than adding ad-hoc polling elsewhere.
- Keep config-entry setup/unload behavior symmetrical when adding new runtime resources, services, or background tasks.
- Service definitions in Python must stay aligned with `custom_components/matter_saver/services.yaml`.
- New config-flow or user-visible backend strings should preserve translation coverage in `custom_components/matter_saver/translations/en.json`.
- Changes to sensor payload structure should be checked against the Lovelace consumers in `custom_components/matter_saver/www/`.
- This repository already contains mixed English/German operational text in logs and messages; only normalize wording when the task explicitly calls for it.
- Favor small, local changes over restructuring Home Assistant entry points.
- For release-sensitive metadata changes, also inspect `custom_components/matter_saver/manifest.json`, `hacs.json`, and `README.md`.
