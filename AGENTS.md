# AGENTS.md

Guidance for coding agents working in `matter-saver`.

## Project at a glance

- Home Assistant custom integration in `custom_components/matter_saver/`.
- Backend is Python/async Home Assistant code; frontend is plain bundled Lovelace JavaScript in `custom_components/matter_saver/www/`.
- User-facing behavior and installation details live in [README.md](README.md).
- Product ideas and longer-term direction live in [idee.md](idee.md).

## Where to look first

- `custom_components/matter_saver/__init__.py` — integration setup, `DataUpdateCoordinator`, service registration, Lovelace asset registration.
- `custom_components/matter_saver/sensor.py` — sensor entities and any compacted data passed to the cards.
- `custom_components/matter_saver/config_flow.py` — config entry flow and connection validation.
- `custom_components/matter_saver/manifest.json` — Home Assistant metadata and runtime requirements.
- `custom_components/matter_saver/translations/en.json` — config-flow and UI translation strings.
- `custom_components/matter_saver/services.yaml` — service definitions that must match registered services.

## Repository-specific conventions

- Follow Home Assistant async patterns: prefer `async def`, avoid blocking I/O, and keep coordinator-driven data flow intact.
- Keep changes small and local; do not restructure Home Assistant entry points unless required.
- When changing user-visible behavior, verify the wording still matches [README.md](README.md) or update the README too.
- Preserve translation coverage when adding new config-flow or user-facing strings.
- This repo already contains some German log/action text; avoid “correcting” language unless the task is specifically about wording consistency.

## Frontend asset rules

- Bundled Lovelace files are served from `custom_components/matter_saver/www/` and registered in `custom_components/matter_saver/__init__.py`.
- If you add, remove, or rename a JS asset, update `LOVELACE_CARD_FILENAMES` in `__init__.py`.
- Asset order matters: shared utilities must load before cards that depend on them.
- Keep new frontend files dependency-light; there is no separate npm build pipeline in this repo.

## Validation

- CI validates this repo with `.github/workflows/hassfest.yaml` and `.github/workflows/validate.yaml`.
- There is no dedicated local test suite in the repository.
- For metadata, packaging, translations, or integration-structure changes, optimize for passing Hassfest and HACS validation.

## Specialized customizations

- `.github/instructions/frontend-assets.instructions.md` adds focused guidance for Lovelace JS files in `custom_components/matter_saver/www/`.
- `.github/instructions/home-assistant-integration.instructions.md` adds focused guidance for backend Python files in `custom_components/matter_saver/`.
- `.github/instructions/release-metadata.instructions.md` adds focused guidance for release-sensitive metadata, translations, services, docs, and CI workflow files.
- `.github/skills/release-readiness/SKILL.md` is available for release and packaging checks touching metadata, translations, services, or frontend assets.
- `.github/skills/payload-sync-review/SKILL.md` is available for checking backend/frontend device-payload compatibility.

## Practical tips

- Link to existing docs instead of duplicating them in new guidance files.
- When editing services, keep Python service registration and `services.yaml` aligned.
- When editing frontend-backed entity payloads, check both Python producers and JS consumers so data keys stay compatible.
