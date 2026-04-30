---
applyTo: 'custom_components/matter_saver/www/**/*.js'
description: "Frontend guidance for Matter Saver Lovelace assets. Use when editing bundled cards, shared JS utilities, compact device decoding, route-path rendering, or adding/removing frontend files."
---

# Matter Saver frontend assets

- These files are shipped directly from `custom_components/matter_saver/www/`; there is no npm/build pipeline to regenerate bundles.
- Keep browser-side code dependency-light and compatible with Home Assistant's bundled frontend environment.
- Shared helpers live in `matter-saver-card-utils.js` and `matter-saver-device-data.js`; load-order matters because the cards use globals attached to `window`.
- If you add, remove, or rename a frontend asset, also update `LOVELACE_CARD_FILENAMES` in `custom_components/matter_saver/__init__.py`.
- Preserve the current load order rule: utilities/data decoders first, dependent cards afterwards.
- Device payloads may be compact-encoded by `custom_components/matter_saver/sensor.py`; when changing frontend device fields, verify the Python encoder and JS decoder still agree on keys and defaults.
- Be defensive when reading state attributes from Home Assistant: cards should tolerate missing data and avoid hard failures on partial payloads.
- Prefer incremental changes to shared globals (`window.MatterSaverCardUtils`, `window.MatterSaverDeviceData`) because multiple cards consume them.
- When changing user-facing card behavior or terminology, check whether `README.md` should be updated too.
