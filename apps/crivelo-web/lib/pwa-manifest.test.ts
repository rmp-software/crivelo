import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { createManifest } from '@crivelo/pwa';
import type { PwaConfig } from '@crivelo/pwa';

/**
 * Unit contract for the locale-aware `createManifest(cfg, locale?)` builder.
 *
 * The builder is a pure function, so it is tested directly (no browser, no dev
 * server). Two fixtures: `cfg` carries an `i18n` block (en + pt, mirroring the
 * crivelo-web example in the spec) to exercise the localized paths;
 * `cfgWithoutI18n` is the same config minus `i18n` to prove the opt-in nature —
 * passing a locale to a config that declares none must degrade gracefully.
 *
 * The critical invariant is backward compatibility: `createManifest(cfg)` with
 * no locale must remain byte-identical to the pre-i18n output (`start_url: "/"`,
 * top-level `description`/`lang`, and NO `id`/`dir` keys).
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

// A locale whose entry sets `startUrl: ""` (valid per `string | undefined`).
// The builder must treat it as absent and fall back to `/${locale}`.
const cfgEmptyStartUrl: PwaConfig = {
  name: 'Crivelo',
  description: 'Tools for people who live coffee.',
  lang: 'en',
  themeColor: '#1C6E68',
  backgroundColor: '#FBF6EA',
  mark,
  i18n: {
    locales: {
      pt: { description: 'Ferramentas para quem vive café.', lang: 'pt-BR', startUrl: '' },
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

// The exact non-localized manifest the builder produced before i18n existed.
// Backward-compat paths must deep-equal this object.
const nonLocalized = {
  name: 'Crivelo',
  short_name: 'Crivelo',
  description: 'Tools for people who live coffee.',
  lang: 'en',
  start_url: '/',
  display: 'standalone',
  background_color: '#FBF6EA',
  theme_color: '#1C6E68',
  icons: [
    { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
    {
      src: '/pwa-icon/512-maskable',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

describe('createManifest', () => {
  it('with no locale, is byte-identical to the non-localized manifest (no id/dir, start_url "/")', () => {
    const manifest = createManifest(cfg);
    expect(manifest).toEqual(nonLocalized);
    // Assert the absent keys explicitly — toEqual treats `undefined` props as
    // absent, so guard against the builder accidentally emitting them.
    expect('id' in manifest).toBe(false);
    expect('dir' in manifest).toBe(false);
    expect(manifest.start_url).toBe('/');
  });

  it('localizes for a known locale ("pt"): start_url, id, lang, dir, description', () => {
    const manifest = createManifest(cfg, 'pt');
    expect(manifest.start_url).toBe('/pt');
    expect(manifest.id).toBe('/pt');
    expect(manifest.lang).toBe('pt-BR');
    expect(manifest.dir).toBe('ltr');
    expect(manifest.description).toBe('Ferramentas para quem vive café.');
    // Everything else stays from cfg.
    expect(manifest.name).toBe('Crivelo');
    expect(manifest.short_name).toBe('Crivelo');
    expect(manifest.theme_color).toBe('#1C6E68');
    expect(manifest.background_color).toBe('#FBF6EA');
    expect(manifest.icons).toEqual(nonLocalized.icons);
  });

  it('gives each locale a distinct id (separate installable apps)', () => {
    const en = createManifest(cfg, 'en');
    const pt = createManifest(cfg, 'pt');
    expect(en.start_url).toBe('/en');
    expect(en.id).toBe('/en');
    expect(en.id).not.toBe(pt.id);
  });

  it('treats an empty startUrl as absent: start_url and id fall back to "/<locale>"', () => {
    const manifest = createManifest(cfgEmptyStartUrl, 'pt');
    expect(manifest.start_url).toBe('/pt');
    expect(manifest.id).toBe('/pt');
  });

  it('falls back to the non-localized manifest for an unknown locale when i18n is configured', () => {
    const manifest = createManifest(cfg, 'fr');
    expect(manifest).toEqual(nonLocalized);
    expect('id' in manifest).toBe(false);
    expect('dir' in manifest).toBe(false);
  });

  it('falls back to the non-localized manifest when the config has no i18n (no crash)', () => {
    const manifest = createManifest(cfgWithoutI18n, 'pt');
    expect(manifest).toEqual(nonLocalized);
    expect('id' in manifest).toBe(false);
    expect('dir' in manifest).toBe(false);
  });
});
