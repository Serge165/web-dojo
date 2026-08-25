import * as builtIn from "./builtinThemes";
import * as community from "./community-themes";
import { aestheticThemes } from "./aestheticThemes";
import { themes, applyTheme } from "./index";
import { resolveChrome as rc } from "./chrome";
import {
  validateTheme, REQUIRED_COLORS, WD_TOKENS, SKINNING_MAP, contrastRatio,
} from "./themeValidation";

const allThemes = {
  ...builtIn, ...community, ...aestheticThemes,
};

describe("Web Dojo full-UI theming", () => {
  test("27 aesthetic mood-board editor skins are registered", () => {
    const keys = Object.keys(aestheticThemes);
    expect(keys.length).toBe(27);
  });

  test("themes registry exposes Winamp, Community and Aesthetic groups", () => {
    expect(themes.defaultTheme).toBeDefined();
    expect(themes.winampModern).toBeDefined();
    expect(themes.dracula).toBeDefined();
    expect(themes["aesthetic-frutiger-aero"]).toBeDefined();
    expect(themes["aesthetic-goblincore"]).toBeDefined();
  });

  test("every bundled theme (incl. all 27 aesthetics) passes palette validation", () => {
    const errors = [];
    for (const [key, t] of Object.entries(allThemes)) {
      const issues = validateTheme(t);
      const errs = issues.filter((i) => i.severity === "error");
      if (errs.length) errors.push(`${key}: ${errs.map((e) => e.message).join("; ")}`);
    }
    expect(errors).toEqual([]);
  });

  test("every theme resolves the full chrome-token set (full-UI coverage)", () => {
    const chromeKeys = Object.keys(rc(allThemes.defaultTheme)).sort();
    for (const [key, t] of Object.entries(allThemes)) {
      const got = Object.keys(rc(t)).sort();
      // eslint-disable-next-line jest/valid-expect
      expect(got).toEqual(chromeKeys);
      void key;
    }
  });

  test("default theme preserves the historical Dark palette (byte-for-byte)", () => {
    expect(allThemes.defaultTheme.colors.panel).toBe("#1C1A15");
    expect(allThemes.defaultTheme.colors.well).toBe("#15130E");
    expect(allThemes.defaultTheme.colors.surface).toBe("#242019");
    expect(allThemes.defaultTheme.colors.border).toBe("#332D22");
    expect(allThemes.defaultTheme.colors.text).toBe("#F1EDE2");
  });

  test("applyTheme guards against missing document and returns the theme", () => {
    const t = applyTheme("winampClassic");
    expect(t.name).toBe("Winamp Classic");
  });

  test("skinning map classes all target defined --wd-* tokens", () => {
    for (const cls of Object.keys(SKINNING_MAP)) {
      expect(cls.startsWith("bg-[") || cls.startsWith("text-[") || cls.startsWith("border-[")).toBe(true);
    }
    for (const token of Object.values(SKINNING_MAP)) {
      expect(WD_TOKENS[token]).toBeDefined();
    }
  });

  test("required colors and contrast helper behave", () => {
    expect(REQUIRED_COLORS.length).toBe(8);
    // White vs black should be 21:1
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
    // Same color should be 1:1
    expect(contrastRatio("#ff0000", "#ff0000")).toBeCloseTo(1, 1);
  });
});
