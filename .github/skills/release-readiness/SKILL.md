---
name: release-readiness
description: "Use when: preparing a release, checking release readiness, or reviewing a PR that touches manifest metadata, HACS packaging, translations, services, Home Assistant setup, or bundled Lovelace assets."
---

# Release readiness for Matter Saver

Use this skill to review whether a change is likely to package and validate cleanly for Home Assistant and HACS.

## Focus areas

1. **Metadata and packaging**
   - Check `custom_components/matter_saver/manifest.json` for version, requirements, dependencies, documentation links, and Home Assistant compatibility.
   - Check `hacs.json` for HACS-facing metadata such as `homeassistant`, `content_in_root`, and README rendering.

2. **Runtime wiring**
   - If services changed, verify Python registration matches `custom_components/matter_saver/services.yaml`.
   - If config flow or user-facing strings changed, verify `custom_components/matter_saver/translations/en.json` still covers them.
   - If frontend assets changed, verify file names and order in `LOVELACE_CARD_FILENAMES` inside `custom_components/matter_saver/__init__.py`.
   - If compact device payloads changed, inspect both `custom_components/matter_saver/sensor.py` and the JS consumers in `custom_components/matter_saver/www/`.

3. **Documentation drift**
   - Check whether `README.md` still reflects installation, services, dashboards, and notable capabilities.

4. **Validation**
   - Prefer the same validation targets CI uses: `.github/workflows/hassfest.yaml` and `.github/workflows/validate.yaml`.
   - If local validation commands are available in the environment, run them and summarize results.
   - If local validation tools are unavailable, state that clearly and review the affected files against the CI expectations instead.

## Expected output

Provide a short release-readiness report that includes:
- what changed
- release-sensitive files reviewed
- validations run or why they could not be run
- any blockers, risks, or follow-up fixes
- a clear recommendation: ready / ready with caveats / not ready
