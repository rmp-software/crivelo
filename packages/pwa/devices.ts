/**
 * The canonical Apple device matrix for iOS `apple-touch-startup-image` link
 * tags — a SET of UNIQUE logical geometries, keyed by
 * `device-width × device-height × device-pixel-ratio` (portrait points).
 *
 * Deduping by geometry (not by marketing model) is the key simplification: new
 * phones that reuse an existing W×H×DPR triple cost nothing (e.g. iPhone 17 /
 * 17 Pro reuse 402×874@3 from the 16 Pro, and 17 Pro Max reuses 440×956@3 from
 * the 16 Pro Max). Only a genuinely new geometry earns a new entry (e.g. the
 * iPhone Air's 420×912@3).
 *
 * Each entry yields TWO startup images downstream (portrait + landscape); the
 * media query uses these logical points while the route renders at the physical
 * pixel size (cssW*dpr × cssH*dpr).
 */
export interface SplashDevice {
  /** Human label, e.g. "iphone-402x874@3" — for comments/debugging only. */
  id: string;
  /** Logical width in points (portrait). */
  cssW: number;
  /** Logical height in points (portrait). */
  cssH: number;
  /** Device pixel ratio. */
  dpr: number;
}

/**
 * Unique portrait geometries (one entry per W×H×DPR triple, never per model).
 * The comment on each entry names representative marketing models.
 */
/**
 * Default `cfg.splash?.basePath` — the route path the startup-image URLs point at.
 */
export const DEFAULT_SPLASH_BASE_PATH = "/pwa-splash";

export const splashDevices: SplashDevice[] = [
  // iPhones
  { id: "iphone-375x667@2", cssW: 375, cssH: 667, dpr: 2 }, // SE (2nd/3rd), 8
  { id: "iphone-414x736@3", cssW: 414, cssH: 736, dpr: 3 }, // 8 Plus
  { id: "iphone-375x812@3", cssW: 375, cssH: 812, dpr: 3 }, // X, XS, 11 Pro, 12/13 mini
  { id: "iphone-414x896@2", cssW: 414, cssH: 896, dpr: 2 }, // XR, 11
  { id: "iphone-414x896@3", cssW: 414, cssH: 896, dpr: 3 }, // XS Max, 11 Pro Max
  { id: "iphone-390x844@3", cssW: 390, cssH: 844, dpr: 3 }, // 12, 12 Pro, 13, 13 Pro, 14
  { id: "iphone-428x926@3", cssW: 428, cssH: 926, dpr: 3 }, // 12/13 Pro Max, 14 Plus
  { id: "iphone-393x852@3", cssW: 393, cssH: 852, dpr: 3 }, // 14 Pro, 15, 15 Pro, 16
  { id: "iphone-430x932@3", cssW: 430, cssH: 932, dpr: 3 }, // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  { id: "iphone-402x874@3", cssW: 402, cssH: 874, dpr: 3 }, // 16 Pro, 17, 17 Pro
  { id: "iphone-440x956@3", cssW: 440, cssH: 956, dpr: 3 }, // 16 Pro Max, 17 Pro Max
  { id: "iphone-420x912@3", cssW: 420, cssH: 912, dpr: 3 }, // iPhone Air

  // iPads (all @2)
  { id: "ipad-768x1024@2", cssW: 768, cssH: 1024, dpr: 2 }, // iPad mini, iPad 9.7"
  { id: "ipad-810x1080@2", cssW: 810, cssH: 1080, dpr: 2 }, // iPad 10.2"
  { id: "ipad-820x1180@2", cssW: 820, cssH: 1180, dpr: 2 }, // iPad 10th gen, iPad Air 11" (M2)
  { id: "ipad-834x1112@2", cssW: 834, cssH: 1112, dpr: 2 }, // iPad Air/Pro 10.5"
  { id: "ipad-834x1194@2", cssW: 834, cssH: 1194, dpr: 2 }, // iPad Pro 11"
  { id: "ipad-1024x1366@2", cssW: 1024, cssH: 1366, dpr: 2 }, // iPad Pro 12.9"
  { id: "ipad-1032x1376@2", cssW: 1032, cssH: 1376, dpr: 2 }, // iPad Pro 13" (M4)
];
