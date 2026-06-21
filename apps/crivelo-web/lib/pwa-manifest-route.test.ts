import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { createManifestRoute } from '@crivelo/pwa';
import type { PwaConfig } from '@crivelo/pwa';

/**
 * Contract for the `createManifestRoute(cfg)` factory — the locale-aware sibling
 * of `createSplashRoute`. The factory owns the route logic so the app wrapper is
 * `export const { GET } = createManifestRoute(cfg)`; these tests invoke the
 * returned `GET` directly with a Request + the Next 15 async `params` object
 * (`{ params: Promise<{ locale: string }> }`), no dev server.
 *
 * Status policy under test:
 *  - known locale → 200, `application/manifest+json`, localized body.
 *  - unknown locale with i18n configured → 404.
 *  - i18n absent → 200, non-localized body (graceful degrade, never a 404).
 */

const mark = (): ReactElement => null as unknown as ReactElement;

const cfg: PwaConfig = {
  name: 'Crivelo',
  description: 'Tools for people who live coffee.',
  lang: 'en',
  themeColor: '#1C6E68',
  backgroundColor: '#FBF6EA',
  mark,
  i18n: {
    locales: {
      en: { description: 'Tools for people who live coffee.', lang: 'en' },
      pt: { description: 'Ferramentas para quem vive café.', lang: 'pt-BR' },
    },
  },
};

const cfgWithoutI18n: PwaConfig = {
  name: 'Crivelo',
  description: 'Tools for people who live coffee.',
  lang: 'en',
  themeColor: '#1C6E68',
  backgroundColor: '#FBF6EA',
  mark,
};

/** Invoke a factory's GET with a request to `/manifest/<locale>`. */
function invoke(
  cfgIn: PwaConfig,
  locale: string,
): Promise<Response> {
  const { GET } = createManifestRoute(cfgIn);
  const req = new Request(`https://example.com/manifest/${locale}`);
  return GET(req, { params: Promise.resolve({ locale }) });
}

describe('createManifestRoute', () => {
  it('known locale ("pt"): 200, application/manifest+json, localized body', async () => {
    const res = await invoke(cfg, 'pt');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/manifest+json');
    const body = await res.json();
    expect(body.start_url).toBe('/pt');
    expect(body.id).toBe('/pt');
    expect(body.lang).toBe('pt-BR');
    expect(body.description).toBe('Ferramentas para quem vive café.');
  });

  it('known locale ("en"): 200 with its own distinct id', async () => {
    const res = await invoke(cfg, 'en');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/manifest+json');
    const body = await res.json();
    expect(body.start_url).toBe('/en');
    expect(body.id).toBe('/en');
    expect(body.lang).toBe('en');
  });

  it('unknown locale ("fr") with i18n configured → 404', async () => {
    const res = await invoke(cfg, 'fr');
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).not.toBe('application/manifest+json');
  });

  it('prototype key ("toString") with i18n configured → 404 (no prototype bypass)', async () => {
    const res = await invoke(cfg, 'toString');
    expect(res.status).toBe(404);
  });

  it('cfg without i18n: 200 non-localized manifest (graceful degrade, no 404)', async () => {
    const res = await invoke(cfgWithoutI18n, 'pt');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/manifest+json');
    const body = await res.json();
    expect(body.start_url).toBe('/');
    expect('id' in body).toBe(false);
    expect('dir' in body).toBe(false);
  });
});
