---
applyTo: '{README.md,hacs.json,custom_components/matter_saver/manifest.json,custom_components/matter_saver/services.yaml,custom_components/matter_saver/strings.json,custom_components/matter_saver/translations/*.json,.github/workflows/*.yaml}'
description: "Release and metadata guidance for Matter Saver. Use when editing manifest metadata, HACS settings, services, translations, strings, README, or CI validation workflows."
---

# Matter Saver release metadata and docs

- Treat these files as release-sensitive: small mismatches here can break HACS validation, Home Assistant UX, or installation flow.
- Keep `custom_components/matter_saver/manifest.json` and `hacs.json` aligned on Home Assistant compatibility, repository identity, and packaging expectations.
- When adding or renaming services, keep `custom_components/matter_saver/services.yaml` aligned with the registered service names and behavior in Python.
- When adding config-flow or other user-facing strings, keep `custom_components/matter_saver/strings.json` and `custom_components/matter_saver/translations/en.json` consistent.
- If functionality, installation steps, or bundled cards change, verify `README.md` still matches reality.
- CI expectations come from `.github/workflows/hassfest.yaml` and `.github/workflows/validate.yaml`; prefer changes that remain compatible with those validations.
- Avoid speculative metadata churn: change versions, requirements, workflow names, or documentation links only when the task actually requires it.
