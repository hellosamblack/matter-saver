---
name: payload-sync-review
description: "Use when: reviewing or implementing changes to device payload keys, route-path data, sensor attributes, or Lovelace card data handling in Matter Saver."
---

# Payload sync review for Matter Saver

Use this skill when a change might affect the contract between the backend entity payloads and the frontend cards.

## Review targets

- `custom_components/matter_saver/sensor.py`
- `custom_components/matter_saver/__init__.py`
- `custom_components/matter_saver/www/matter-saver-device-data.js`
- `custom_components/matter_saver/www/matter-saver-card-utils.js`
- Any card file in `custom_components/matter_saver/www/` that reads normalized device data

## What to verify

1. **Compact key compatibility**
   - If Python changes compact keys like `i`, `n`, `av`, `r`, `rt`, or counters, verify the JS decoder still maps them correctly.
   - If JS expects a new field, verify Python emits it consistently and with sensible defaults.

2. **Fallback behavior**
   - Cards should handle missing or partial device payloads without crashing.
   - Shared helpers should fail soft when compact payload decoding is unavailable.

3. **Route-path compatibility**
   - If route-path structure changes, verify hop decoding still reconstructs node names, roles, RSSI, and LQI correctly.

4. **Cross-file impact**
   - Check both producers and consumers, not just the file being edited.
   - Summarize any hidden coupling that future changes should preserve.

## Expected output

Provide a short compatibility report covering:
- payload fields changed or reviewed
- producer files checked
- consumer files checked
- compatibility risks or mismatches
- whether the change is safe, needs follow-up, or is currently broken
