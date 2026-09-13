import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const OLD_CITIES = ["King of Prussia", "Phoenixville", "Morgantown"];
const SOURCES = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/api/chat/route.ts",
  "app/api/lead/route.ts",
];

describe("service area", () => {
  it.each(SOURCES)("%s names no retired service area", (rel) => {
    const src = readFileSync(join(process.cwd(), rel), "utf8");
    for (const city of OLD_CITIES) {
      expect(src).not.toContain(city);
    }
  });

  it("the chat system prompt states the current service area", () => {
    // Guarded because it is invisible from the client bundle -- a stale
    // service area here is the one the bot would actually tell people.
    const src = readFileSync(
      join(process.cwd(), "app/api/chat/route.ts"),
      "utf8"
    );
    expect(src).toContain("Philadelphia, PA and Chester County, PA");
  });

  it("visible UI copy states the current service area", () => {
    const src = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8");
    expect(src).toContain("Philadelphia, PA and Chester County, PA");
  });

  it("page metadata states the current service area", () => {
    const src = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(src).toContain("Philadelphia, PA and Chester County, PA");
  });
});
