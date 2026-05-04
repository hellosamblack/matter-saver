const MATTER_SAVER_CARD_TYPE_PREFIX = "custom:";

const MATTER_SAVER_EDITOR_META = {
  "matter-saver-card": {
    title: "Matter Saver Card",
    description: "Main device table with sorting, grouping, search, and actions.",
    defaultEntity: "sensor.matter_saver_devices",
    entityLabel: "Devices entity",
    fields: [
      {
        name: "title",
        label: "Card title",
        type: "text",
        placeholder: "Matter Devices",
        helper: "Override the header shown at the top of the card.",
        section: "appearance",
      },
      {
        name: "sort_by",
        label: "Default sort field",
        type: "select",
        defaultValue: "status",
        helper: "Choose how the table is grouped and sorted when the card first loads.",
        section: "data",
        options: [
          ["status", "Status"],
          ["name", "Name"],
          ["node_id", "Node ID"],
          ["area", "Area"],
          ["product", "Product"],
          ["thread_role", "Thread role"],
          ["errors", "Errors"],
          ["offline_24h_minutes", "24h downtime"],
          ["offline_7d_minutes", "7d downtime"],
          ["last_seen", "Last seen"],
          ["battery", "Battery"],
        ],
      },
      {
        name: "sort_ascending",
        label: "Sort ascending by default",
        type: "boolean",
        defaultValue: true,
        section: "data",
      },
      {
        name: "show_search",
        label: "Show filter box",
        type: "boolean",
        defaultValue: true,
        helper: "Hide this if you want a cleaner read-only dashboard card.",
        section: "appearance",
      },
      {
        name: "show_stats",
        label: "Show online/offline stats",
        type: "boolean",
        defaultValue: true,
        section: "appearance",
      },
      {
        name: "filter",
        label: "Initial filter text",
        type: "text",
        placeholder: "Optional startup filter",
        helper: "Pre-filter devices by a word like an area, product, or status.",
        section: "advanced",
        advanced: true,
      },
    ],
  },
  "matter-saver-log-card": {
    title: "Matter Saver Log Card",
    description: "Activity log with filtering and relative timestamps.",
    defaultEntity: "sensor.matter_saver_activity_log",
    entityLabel: "Activity log entity",
    fields: [
      {
        name: "title",
        label: "Card title",
        type: "text",
        placeholder: "Activity Log",
        helper: "Override the header shown at the top of the log card.",
        section: "appearance",
      },
      {
        name: "show_search",
        label: "Show filter box",
        type: "boolean",
        defaultValue: true,
        section: "appearance",
      },
      {
        name: "filter",
        label: "Initial filter text",
        type: "text",
        placeholder: "Optional startup filter",
        helper: "Pre-filter the log to a device name, node ID, or message keyword.",
        section: "advanced",
        advanced: true,
      },
      {
        name: "max_entries",
        label: "Maximum entries",
        type: "number",
        min: 1,
        placeholder: "All entries",
        helper: "Limit how many log entries are rendered.",
        section: "advanced",
        advanced: true,
      },
    ],
  },
  "matter-saver-topology-card": {
    title: "Matter Saver Topology Card",
    description: "Thread mesh topology grouped by router and child devices.",
    defaultEntity: "sensor.matter_saver_devices",
    entityLabel: "Devices entity",
    fields: [
      {
        name: "title",
        label: "Card title",
        type: "text",
        placeholder: "Thread Topology",
        helper: "Override the header shown at the top of the topology card.",
        section: "appearance",
      },
      {
        name: "show_stats",
        label: "Show topology stats",
        type: "boolean",
        defaultValue: true,
        section: "appearance",
      },
      {
        name: "show_unassigned",
        label: "Show unassigned end devices",
        type: "boolean",
        defaultValue: true,
        helper: "Hide this when you only want the router tree itself.",
        section: "advanced",
        advanced: true,
      },
    ],
  },
  "matter-saver-mesh-card": {
    title: "Matter Saver Mesh Card",
    description: "Interactive Thread mesh network visualization.",
    defaultEntity: "sensor.matter_saver_devices",
    entityLabel: "Devices entity",
    fields: [
      {
        name: "title",
        label: "Card title",
        type: "text",
        placeholder: "Thread Mesh",
        helper: "Override the header shown at the top of the mesh card.",
        section: "appearance",
      },
      {
        name: "show_legend",
        label: "Show legend",
        type: "boolean",
        defaultValue: true,
        section: "appearance",
      },
      {
        name: "height",
        label: "Graph height (px)",
        type: "number",
        min: 320,
        placeholder: "500",
        helper: "Set a fixed graph height for tighter dashboards.",
        section: "advanced",
        advanced: true,
      },
    ],
  },
};

const MATTER_SAVER_SECTION_META = {
  source: {
    title: "Data source",
    description: "Pick which sensor entity powers this card.",
  },
  appearance: {
    title: "Appearance",
    description: "Control headings and visible UI elements.",
  },
  data: {
    title: "Data behavior",
    description: "Choose default sorting and how the card starts up.",
  },
  advanced: {
    title: "Advanced options",
    description: "Optional tuning for more focused dashboards.",
  },
};

function normalizeMatterSaverCardType(type) {
  if (!type) {
    return "matter-saver-card";
  }
  return String(type).startsWith(MATTER_SAVER_CARD_TYPE_PREFIX)
    ? String(type).slice(MATTER_SAVER_CARD_TYPE_PREFIX.length)
    : String(type);
}

function buildMatterSaverCardType(type) {
  return `${MATTER_SAVER_CARD_TYPE_PREFIX}${normalizeMatterSaverCardType(type)}`;
}

class MatterSaverCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._cardType = "matter-saver-card";
    this._initialized = false;
  }

  set cardType(value) {
    if (value) {
      this._cardType = normalizeMatterSaverCardType(value);
      if (this._initialized) {
        this._render();
      }
    }
  }

  setConfig(config) {
    this._config = { ...(config || {}) };
    if (this._config.type) {
      this._cardType = normalizeMatterSaverCardType(this._config.type);
    }
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._syncEntityPicker();
  }

  _meta() {
    return MATTER_SAVER_EDITOR_META[this._cardType] || MATTER_SAVER_EDITOR_META["matter-saver-card"];
  }

  _render() {
    const meta = this._meta();
    const configuredEntity = this._config.entity || "";
    const groupedFields = this._groupFields(meta.fields || []);
    const regularSectionsHtml = groupedFields.regular.map((section) => this._sectionShell(section)).join("");
    const advancedSectionHtml = groupedFields.advanced.length
      ? this._advancedSectionShell(groupedFields.advanced)
      : "";

    this.innerHTML = `
      <style>
        .ms-editor {
          display: grid;
          gap: 16px;
          padding: 8px 0;
        }
        .ms-editor__intro {
          display: grid;
          gap: 4px;
        }
        .ms-editor__title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--primary-text-color);
        }
        .ms-editor__description,
        .ms-editor__hint {
          color: var(--secondary-text-color);
          font-size: 0.9rem;
          line-height: 1.4;
        }
        .ms-editor__field {
          display: grid;
          gap: 6px;
        }
        .ms-editor__fields {
          display: grid;
          gap: 16px;
        }
        .ms-editor__section {
          display: grid;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
          border-radius: 14px;
          background: color-mix(in srgb, var(--card-background-color, transparent) 92%, var(--primary-text-color, #fff) 8%);
        }
        .ms-editor__section-header {
          display: grid;
          gap: 4px;
        }
        .ms-editor__section-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--primary-text-color);
        }
        .ms-editor__section-description {
          color: var(--secondary-text-color);
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .ms-editor__label {
          font-weight: 500;
          color: var(--primary-text-color);
        }
        .ms-editor__fallback {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--divider-color);
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font: inherit;
        }
        .ms-editor__checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--primary-text-color);
          font: inherit;
        }
        .ms-editor__checkbox input {
          width: 18px;
          height: 18px;
          margin: 0;
        }
        .ms-editor__helper {
          color: var(--secondary-text-color);
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .ms-editor__advanced {
          border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
          border-radius: 14px;
          overflow: hidden;
          background: color-mix(in srgb, var(--card-background-color, transparent) 94%, var(--primary-text-color, #fff) 6%);
        }
        .ms-editor__advanced summary {
          list-style: none;
          cursor: pointer;
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .ms-editor__advanced summary::-webkit-details-marker {
          display: none;
        }
        .ms-editor__advanced-icon {
          color: var(--secondary-text-color);
          font-size: 0.9rem;
          transition: transform 0.2s ease;
        }
        .ms-editor__advanced[open] .ms-editor__advanced-icon {
          transform: rotate(90deg);
        }
        .ms-editor__advanced-body {
          padding: 0 14px 14px;
        }
        .ms-editor__note {
          color: var(--secondary-text-color);
          font-size: 0.85rem;
          line-height: 1.5;
          padding: 12px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--primary-color, #03a9f4) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 25%, transparent);
        }
      </style>
      <div class="ms-editor">
        <div class="ms-editor__intro">
          <div class="ms-editor__title">${this._esc(meta.title)}</div>
          <div class="ms-editor__description">${this._esc(meta.description)}</div>
        </div>
        <div class="ms-editor__section">
          <div class="ms-editor__section-header">
            <div class="ms-editor__section-title">${this._esc(MATTER_SAVER_SECTION_META.source.title)}</div>
            <div class="ms-editor__section-description">${this._esc(MATTER_SAVER_SECTION_META.source.description)}</div>
          </div>
          <div class="ms-editor__field">
            <label class="ms-editor__label" for="ms-editor-entity">${this._esc(meta.entityLabel)}</label>
            <div id="ms-editor-entity-slot"></div>
            <div class="ms-editor__hint">Leave empty to use the built-in default: <code>${this._esc(meta.defaultEntity)}</code></div>
          </div>
        </div>
        <div class="ms-editor__fields">${regularSectionsHtml}${advancedSectionHtml}</div>
        <div class="ms-editor__note">Home Assistant should continue to manage the built-in <strong>Visibility</strong> and <strong>Layout</strong> tabs separately. This editor only updates card-specific config keys and preserves any other dashboard metadata.</div>
      </div>
    `;

    const slot = this.querySelector("#ms-editor-entity-slot");
    if (slot) {
      const picker = this._createEntityField(configuredEntity, meta.defaultEntity);
      slot.replaceChildren(picker);
    }

    this._renderExtraFields();

    this._initialized = true;
    this._syncEntityPicker();
  }

  _groupFields(fields) {
    const regularMap = new Map();
    const advancedMap = new Map();

    for (const field of fields) {
      const sectionKey = field.section || "appearance";
      const target = field.advanced ? advancedMap : regularMap;
      if (!target.has(sectionKey)) {
        target.set(sectionKey, []);
      }
      target.get(sectionKey).push(field);
    }

    const toSections = (map) => [...map.entries()].map(([key, sectionFields]) => ({
      key,
      title: MATTER_SAVER_SECTION_META[key]?.title || key,
      description: MATTER_SAVER_SECTION_META[key]?.description || "",
      fields: sectionFields,
    }));

    return {
      regular: toSections(regularMap),
      advanced: toSections(advancedMap),
    };
  }

  _sectionShell(section) {
    const fieldsHtml = section.fields.map((field) => this._fieldShell(field)).join("");
    return `
      <div class="ms-editor__section">
        <div class="ms-editor__section-header">
          <div class="ms-editor__section-title">${this._esc(section.title)}</div>
          ${section.description ? `<div class="ms-editor__section-description">${this._esc(section.description)}</div>` : ""}
        </div>
        ${fieldsHtml}
      </div>
    `;
  }

  _advancedSectionShell(sections) {
    const bodyHtml = sections.map((section) => this._sectionShell(section)).join("");
    return `
      <details class="ms-editor__advanced">
        <summary>
          <span>
            <strong>${this._esc(MATTER_SAVER_SECTION_META.advanced.title)}</strong><br>
            <span class="ms-editor__section-description">${this._esc(MATTER_SAVER_SECTION_META.advanced.description)}</span>
          </span>
          <span class="ms-editor__advanced-icon">▶</span>
        </summary>
        <div class="ms-editor__advanced-body">${bodyHtml}</div>
      </details>
    `;
  }

  _fieldShell(field) {
    if (field.type === "boolean") {
      return `
        <div class="ms-editor__field" data-field="${this._esc(field.name)}">
          <div class="ms-editor__control"></div>
          ${field.helper ? `<div class="ms-editor__helper">${this._esc(field.helper)}</div>` : ""}
        </div>
      `;
    }

    return `
      <div class="ms-editor__field" data-field="${this._esc(field.name)}">
        <div class="ms-editor__label">${this._esc(field.label)}</div>
        <div class="ms-editor__control"></div>
        ${field.helper ? `<div class="ms-editor__helper">${this._esc(field.helper)}</div>` : ""}
      </div>
    `;
  }

  _renderExtraFields() {
    const meta = this._meta();
    for (const field of meta.fields || []) {
      const container = this.querySelector(`[data-field="${field.name}"] .ms-editor__control`);
      if (!container) {
        continue;
      }
      container.replaceChildren(this._createFieldControl(field));
    }
  }

  _createFieldControl(field) {
    if (field.type === "boolean") {
      const label = document.createElement("label");
      label.className = "ms-editor__checkbox";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = this._fieldValue(field);
      input.addEventListener("change", (event) => {
        this._updateField(field, Boolean(event.target?.checked));
      });

      const text = document.createElement("span");
      text.textContent = field.label;

      label.append(input, text);
      return label;
    }

    const input = field.type === "select"
      ? document.createElement("select")
      : document.createElement("input");

    input.id = `ms-editor-${field.name}`;
    input.className = "ms-editor__fallback";

    if (field.type === "select") {
      for (const [optionValue, optionLabel] of field.options || []) {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionLabel;
        input.append(option);
      }
      input.value = String(this._fieldValue(field));
      input.addEventListener("change", (event) => {
        this._updateField(field, event.target?.value || "");
      });
      return input;
    }

    input.type = field.type === "number" ? "number" : "text";
    if (field.placeholder) {
      input.placeholder = field.placeholder;
    }
    if (field.type === "number" && field.min != null) {
      input.min = String(field.min);
    }
    input.value = this._fieldDisplayValue(field);
    input.addEventListener("input", (event) => {
      this._updateField(field, event.target?.value || "");
    });
    return input;
  }

  _createEntityField(value, placeholder) {
    if (customElements.get("ha-entity-picker")) {
      const picker = document.createElement("ha-entity-picker");
      picker.id = "ms-editor-entity";
      picker.label = this._meta().entityLabel;
      picker.includeDomains = ["sensor"];
      picker.allowCustomEntity = true;
      picker.value = value;
      picker.placeholder = placeholder;
      picker.addEventListener("value-changed", (event) => {
        this._updateEntity(event.detail?.value || "");
      });
      picker.addEventListener("change", (event) => {
        this._updateEntity(event.target?.value || "");
      });
      return picker;
    }

    const input = document.createElement("input");
    input.id = "ms-editor-entity";
    input.className = "ms-editor__fallback";
    input.type = "text";
    input.value = value;
    input.placeholder = placeholder;
    input.addEventListener("input", (event) => {
      this._updateEntity(event.target?.value || "");
    });
    return input;
  }

  _syncEntityPicker() {
    const picker = this.querySelector("#ms-editor-entity");
    if (!picker) {
      return;
    }

    if ("hass" in picker) {
      picker.hass = this._hass;
    }

    const value = this._config.entity || "";
    if (picker.value !== value) {
      picker.value = value;
    }
  }

  _fieldValue(field) {
    if (Object.prototype.hasOwnProperty.call(this._config, field.name)) {
      return this._config[field.name];
    }
    return field.defaultValue ?? "";
  }

  _fieldDisplayValue(field) {
    const value = this._fieldValue(field);
    return value == null ? "" : String(value);
  }

  _updateEntity(value) {
    const nextValue = (value || "").trim();
    const nextConfig = {
      ...this._config,
      type: buildMatterSaverCardType(this._cardType),
    };

    if (nextValue) {
      nextConfig.entity = nextValue;
    } else {
      delete nextConfig.entity;
    }

    this._config = nextConfig;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: nextConfig },
      bubbles: true,
      composed: true,
    }));
  }

  _updateField(field, rawValue) {
    const nextConfig = {
      ...this._config,
      type: buildMatterSaverCardType(this._cardType),
    };

    const normalizedValue = this._normalizeFieldValue(field, rawValue);

    if (normalizedValue === undefined || normalizedValue === null || normalizedValue === "") {
      delete nextConfig[field.name];
    } else {
      nextConfig[field.name] = normalizedValue;
    }

    this._config = nextConfig;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: nextConfig },
      bubbles: true,
      composed: true,
    }));
  }

  _normalizeFieldValue(field, rawValue) {
    if (field.type === "boolean") {
      if (rawValue === field.defaultValue) {
        return undefined;
      }
      return Boolean(rawValue);
    }

    const trimmed = String(rawValue || "").trim();
    if (!trimmed) {
      return undefined;
    }

    if (field.type === "number") {
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) {
        return undefined;
      }
      if (field.defaultValue != null && parsed === field.defaultValue) {
        return undefined;
      }
      if (field.min != null && parsed < field.min) {
        return field.min;
      }
      return parsed;
    }

    if (field.defaultValue != null && trimmed === String(field.defaultValue)) {
      return undefined;
    }

    return trimmed;
  }

  _esc(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }
}

window.MatterSaverCardEditor = window.MatterSaverCardEditor || {
  normalizeCardType: normalizeMatterSaverCardType,
  buildCardType: buildMatterSaverCardType,
};

customElements.define("matter-saver-card-editor", MatterSaverCardEditor);
