import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Toggle } from "./Toggle.ts";

describe("Toggle", () => {
  const options = [
    { value: "bestOf", label: "Best of" },
    { value: "firstTo", label: "First to" },
  ];

  it("defaults value to first option when initial omitted", () => {
    const t = new Toggle({ options, orientation: "vertical" });
    assert.equal(t.value, "bestOf");
  });

  it("uses initial when it matches an option", () => {
    const t = new Toggle({
      options,
      orientation: "vertical",
      initial: "firstTo",
    });
    assert.equal(t.value, "firstTo");
  });

  it("falls back to first option when initial is unknown", () => {
    const t = new Toggle({
      options,
      orientation: "vertical",
      initial: "nope",
    });
    assert.equal(t.value, "bestOf");
  });

  it("setValue ignores unknown values", () => {
    const t = new Toggle({
      options,
      orientation: "horizontal",
      initial: "bestOf",
    });
    t.setValue("nope");
    assert.equal(t.value, "bestOf");
    t.setValue("firstTo");
    assert.equal(t.value, "firstTo");
  });

  it("throws when methods run through a Proxy (Alpine must not wrap Toggle)", () => {
    const t = new Toggle({ options, orientation: "horizontal" });
    const proxied = new Proxy(t, {});
    assert.throws(() => proxied.unmount(), /private member/);
  });
});
