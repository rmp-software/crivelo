import { describe, it, expect } from 'vitest';
import { criveloPwa } from '../app/pwa.config';
import { pwaMetadata } from '@crivelo/pwa';

/**
 * Integration contract for the iOS launch-image head tags.
 *
 * `pwaMetadata(criveloPwa).appleWebApp.startupImage` is the exact data the App
 * Router serialises into `<link rel="apple-touch-startup-image">` tags in the
 * root layout `<head>`. Asserting it here pins the integration without booting a
 * browser: the link count (19 unique geometries × 2 orientations) and the one
 * new-in-17-family geometry, the iPhone Air `420×912@3` portrait+landscape pair
 * (physical pixels `1260×2736` / `2736×1260`).
 */
type AppleImage = { url: string; media: string };

function startupImages(): AppleImage[] {
  const meta = pwaMetadata(criveloPwa);
  const appleWebApp = meta.appleWebApp;
  if (typeof appleWebApp !== 'object' || appleWebApp === null) {
    throw new Error('appleWebApp metadata missing');
  }
  return (appleWebApp.startupImage ?? []) as AppleImage[];
}

describe('pwa-splash startup-image head tags', () => {
  it('emits a portrait + landscape link per geometry (38 total)', () => {
    const imgs = startupImages();
    expect(imgs.length).toBe(38);
    expect(imgs.filter((i) => i.media.includes('orientation: portrait'))).toHaveLength(19);
    expect(imgs.filter((i) => i.media.includes('orientation: landscape'))).toHaveLength(19);
  });

  it('every link carries a -webkit-device-pixel-ratio and an orientation', () => {
    for (const img of startupImages()) {
      expect(img.media).toContain('-webkit-device-pixel-ratio');
      expect(img.media).toMatch(/orientation:\s*(portrait|landscape)/);
    }
  });

  it('emits the legacy apple-mobile-web-app-capable meta (required for iOS splash)', () => {
    // iOS only honors apple-touch-startup-image when this legacy meta is present.
    // Next 15 dropped it from appleWebApp.capable (it now emits only
    // mobile-web-app-capable), so pwaMetadata must re-add it via `other`.
    const meta = pwaMetadata(criveloPwa);
    expect(meta.other?.['apple-mobile-web-app-capable']).toBe('yes');
  });

  it('includes the iPhone Air 420×912@3 portrait + landscape pair', () => {
    const imgs = startupImages();

    const portrait = imgs.find((i) => i.url === '/pwa-splash/1260x2736');
    expect(portrait).toBeDefined();
    expect(portrait!.media).toBe(
      '(device-width: 420px) and (device-height: 912px) and ' +
        '(-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
    );

    const landscape = imgs.find((i) => i.url === '/pwa-splash/2736x1260');
    expect(landscape).toBeDefined();
    expect(landscape!.media).toBe(
      '(device-width: 420px) and (device-height: 912px) and ' +
        '(-webkit-device-pixel-ratio: 3) and (orientation: landscape)'
    );
  });
});
