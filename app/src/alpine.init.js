import toggle from "./lib/alpine/toggle.js";
import gameConfig from "./lib/alpine/gameConfig.js";

/**
 * @param {import('alpinejs').Alpine} Alpine
 */
export default (Alpine) => {
  toggle(Alpine);
  gameConfig(Alpine);
};
