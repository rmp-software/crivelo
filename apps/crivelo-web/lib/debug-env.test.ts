import { describe, expect, it } from "vitest";
import { isDebugEnv } from "./debug-env";

describe("isDebugEnv", () => {
  it("is true in local development (no Vercel env present)", () => {
    expect(isDebugEnv("development", undefined)).toBe(true);
  });

  it("is true on Vercel preview deploys", () => {
    expect(isDebugEnv("production", "preview")).toBe(true);
  });

  it("is true on the Vercel development environment", () => {
    expect(isDebugEnv("production", "development")).toBe(true);
  });

  it("is true under the test runner (NODE_ENV=test)", () => {
    expect(isDebugEnv("test", undefined)).toBe(true);
  });

  it("is true on a local production build with no Vercel env (intentional: only a Vercel prod deploy is gated)", () => {
    expect(isDebugEnv("production", undefined)).toBe(true);
  });

  it("is false only on a Vercel production deploy", () => {
    expect(isDebugEnv("production", "production")).toBe(false);
  });
});
