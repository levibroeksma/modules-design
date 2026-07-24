import { Toggle } from "../toggle/Toggle.ts";

/**
 * @param {import('alpinejs').Alpine} Alpine
 */
export default (Alpine) => {
  Alpine.data("toggle", (config = {}) => {
    // Keep Toggle off the reactive object. Alpine deep-proxies `this.*`;
    // calling methods on a proxied class breaks ES private fields (#ro, #pill, …)
    // and mount()/layout() never run — pill stays 0×0.
    /** @type {Toggle | null} */
    let toggle = null;

    return {
      activeTab: config.initial ?? config.options?.[0]?.value ?? "",
      options: config.options ?? [],
      orientation: config.orientation ?? "vertical",
      pill: { w: 0, h: 0, x: 0, y: 0 },

      init() {
        const resolved = this.options.some((o) => o.value === this.activeTab)
          ? this.activeTab
          : (this.options[0]?.value ?? "");
        this.activeTab = resolved;

        toggle = new Toggle({
          options: this.options,
          orientation: this.orientation,
          initial: this.activeTab,
          onPillChange: (pill) => {
            this.pill = { ...pill };
          },
        });

        this.$watch("activeTab", (value) => {
          toggle?.setValue(value);
        });

        this.$nextTick(() => {
          const list = this.$refs.list;
          if (!list || !toggle) return;
          toggle.mount(list);
          // Second frame: fonts / layout settle so equalize + pill aren’t 0×0.
          requestAnimationFrame(() => toggle?.layout());
        });
      },

      destroy() {
        toggle?.unmount();
        toggle = null;
      },

      select(value) {
        this.activeTab = value;
      },
    };
  });
};
