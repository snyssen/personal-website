# Project Review: Security Issues & Code Smells

This document provides a full review of the `personal-website` project, highlighting security
issues, code quality concerns, and operational improvements. Actions are ranked by a combination
of **urgency** (potential impact) and **ease of implementation**.

---

## ✅ Strengths

Before listing issues, it is worth noting what the project does well:

- **No database** – eliminates SQL injection and data-breach risks entirely.
- **Static-first architecture** – the attack surface is minimal.
- **Secrets management** – CI/CD credentials stored in platform secrets; none committed to code.
- **TypeScript strict mode** – catches many classes of bugs at compile time.
- **Automated dependency updates** – Renovate keeps dependencies current with auto-merge for
  minor/patch versions.
- **Content validation** – Zod schemas validate all blog post frontmatter at build time.
- **No external image sources** – `image.domains: []` in Astro config prevents SSRF via image
  processing.
- **Pre-commit hooks** – enforces basic hygiene (trailing whitespace, large files, conventional
  commits).

---

## 🔴 Critical / High – Fix immediately

### 1. High-severity transitive dependency vulnerabilities (`rollup`, `svgo`)

| Detail | Value |
|--------|-------|
| **Packages** | `rollup` 4.0.0–4.58.0, `svgo` 4.0.0 |
| **CVEs** | GHSA-mw96-cpmx-2vgc (arbitrary file write), GHSA-xpqw-6gx7-v673 (DoS / billion laughs) |
| **Severity** | High |
| **Ease** | ⭐ Trivial – `npm audit fix` |

**Status: Fixed** – `npm audit fix` was run and `package-lock.json` updated.

---

### 2. WebFinger upstream fetch has no timeout

| Detail | Value |
|--------|-------|
| **File** | `src/pages/.well-known/webfinger.ts` |
| **Risk** | A slow or hanging upstream server stalls the Node.js request handler indefinitely, enabling a trivial application-layer DoS. |
| **Ease** | ⭐⭐ Easy – wrap in `AbortController` with a 5-second timeout |

**Status: Fixed** – Each upstream `fetch()` now uses an `AbortController` with a 5-second
timeout, and errors are caught so the loop continues gracefully.

---

### 3. WebFinger upstream resource missing `acct:` URI scheme prefix

| Detail | Value |
|--------|-------|
| **File** | `src/pages/.well-known/webfinger.ts` (line 34 before fix) |
| **Risk** | Upstream Mastodon/ActivityPub servers receive a malformed `resource` query parameter (`user@domain` instead of `acct:user@domain`), causing look-ups to fail silently and always returning 404 for valid users. |
| **Ease** | ⭐ Trivial – prepend `acct:` to the interpolated value |

**Status: Fixed** – The forwarded `resource` parameter now correctly includes the `acct:` scheme.

---

## 🟡 Medium – Address in the near term

### 4. Missing security HTTP headers

| Detail | Value |
|--------|-------|
| **Risk** | Absence of `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` weakens defense-in-depth against content injection, clickjacking, and information leakage. |
| **Ease** | ⭐⭐ Easy – Astro middleware sets headers on every response |

**Status: Fixed** – `src/middleware.ts` now adds:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

> **Next step** – Configure a full Content-Security-Policy (CSP) once the external script sources
> (Umami analytics, Line Awesome icon CDN) are audited. A strict CSP requires knowing every
> permitted script/style/connect source.

---

### 5. Double semicolon in webfinger.ts

| Detail | Value |
|--------|-------|
| **File** | `src/pages/.well-known/webfinger.ts` (line 25 before fix) |
| **Risk** | Cosmetic / code quality. The extra `;` is harmless in JavaScript but indicates copy-paste error. |
| **Ease** | ⭐ Trivial |

**Status: Fixed** – Duplicate semicolon removed.

---

### 6. No Content-Security-Policy (CSP)

| Detail | Value |
|--------|-------|
| **Risk** | A missing CSP is the single most impactful missing defence against XSS. Even though the site is mostly static, external scripts (Umami analytics) and icon CDN assets widen the attack surface. |
| **Ease** | ⭐⭐⭐ Moderate – requires auditing all resource origins |

**Recommendation:**

1. Identify every origin loaded in `BaseHead.astro` and layouts.
2. Construct a CSP header in `src/middleware.ts`, for example:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://umami.snyssen.be 'nonce-{RANDOM}';
  style-src 'self' https://maxst.icons8.com 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self' https://umami.snyssen.be;
  font-src 'self' https://maxst.icons8.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

The inline `<script is:inline>` block in `BaseHead.astro` (dark theme toggle) will need a nonce
or hash, or must be moved to an external file to allow a `script-src` without `'unsafe-inline'`.

---

### 7. No `npm audit` gate in CI

| Detail | Value |
|--------|-------|
| **Risk** | Vulnerable dependencies can be merged and shipped without automated detection. |
| **Ease** | ⭐⭐ Easy – add one step to the GitHub Actions workflow |

**Recommendation:** Add `npm audit --audit-level=high` to `.github/workflows/build-release.yaml`
before the build step, for example:

```yaml
- name: Audit dependencies
  run: npm audit --audit-level=high
```

---

### 8. External analytics script (`Umami`) loaded unconditionally

| Detail | Value |
|--------|-------|
| **File** | `src/components/BaseHead.astro` (line 45) |
| **Risk** | The script is always loaded from `https://umami.snyssen.be`, which is a self-hosted instance. If the server is compromised or unavailable, it affects every page load. The `data-website-id` is also publicly visible in the HTML source (by design for Umami, but worth noting). |
| **Ease** | ⭐ Trivial to add `defer` (already present); optional: move to an environment variable |

**Recommendation:** The `defer` attribute is already set, so page rendering is not blocked.
Consider conditionally omitting the script in development builds using an environment variable.

---

## 🟢 Low – Nice-to-have improvements

### 9. No linting / formatting tooling

| Detail | Value |
|--------|-------|
| **Risk** | Without ESLint or Prettier, style inconsistencies accumulate and bugs that a linter would catch are missed. |
| **Ease** | ⭐⭐ Easy – `npm init @eslint/config` and add Prettier |

**Recommendation:** Add ESLint with the Astro plugin (`eslint-plugin-astro`) and Prettier
(`prettier-plugin-astro`). Integrate into the pre-commit config:

```yaml
- repo: https://github.com/pre-commit/mirrors-prettier
  rev: v3.x.x
  hooks:
    - id: prettier
      additional_dependencies: [prettier-plugin-astro]
```

---

### 10. No automated tests

| Detail | Value |
|--------|-------|
| **Risk** | Regressions (e.g., the broken `acct:` prefix identified above) go undetected until production. |
| **Ease** | ⭐⭐⭐ Moderate – Playwright is already a dependency |

**Recommendation:** Since Playwright is already installed for PDF generation, add a small test
suite covering:

- WebFinger endpoint happy path and error cases (valid/invalid `resource`, timeout behaviour).
- A smoke test that the site builds successfully and key pages return 200.

Example Playwright API test for WebFinger:

```typescript
// tests/webfinger.spec.ts
import { test, expect } from "@playwright/test";

test("webfinger returns 400 for missing resource", async ({ request }) => {
    const res = await request.get("/.well-known/webfinger");
    expect(res.status()).toBe(400);
});

test("webfinger returns 404 for unsupported domain", async ({ request }) => {
    const res = await request.get("/.well-known/webfinger?resource=acct:user@unknown.example");
    expect(res.status()).toBe(404);
});
```

---

### 11. WebFinger regex does not handle hyphenated or multi-part domain labels

| Detail | Value |
|--------|-------|
| **File** | `src/pages/.well-known/webfinger.ts` (line 23) |
| **Risk** | The pattern `[\w\.]+` does not match hyphens, so a domain like `my-server.example` would be rejected with a 400 even if it were on the supported-domains list. Since the domain is validated against a hardcoded whitelist immediately after, this is low risk in practice today. |
| **Ease** | ⭐ Trivial – change to `[\w\.\-]+` or use `URL` parsing |

**Recommendation:**

```typescript
// Before
const matches = resource.match(/acct:([\w\.]+)@([\w\.]+)/);
// After
const matches = resource.match(/acct:([\w.+-]+)@([\w.-]+)/);
```

---

### 12. `SITE_IMAGE` points to a non-existent placeholder

| Detail | Value |
|--------|-------|
| **File** | `src/config.ts` (line 7) |
| **Risk** | `SITE_IMAGE = "/placeholder-hero.jpg"` is used as the default OG/Twitter card image. If the file is not present in `public/`, social media previews will show broken images. |
| **Ease** | ⭐ Trivial – replace with a real image path or ensure the file exists |

---

### 13. Drone CI `branches_docker` pipeline triggers on every push

| Detail | Value |
|--------|-------|
| **File** | `.drone.yml` |
| **Risk** | Every branch push (including work-in-progress branches) triggers a Docker build and pushes an image to the registry. This wastes resources and pollutes the registry with interim images. |
| **Ease** | ⭐⭐ Easy – add a branch filter |

**Recommendation:** Restrict the trigger to specific branches, e.g.:

```yaml
trigger:
  event:
    - push
  branch:
    - main
    - develop
```

---

### 14. Drone CI uses `DRONE_COMMIT_AUTHOR` as registry username

| Detail | Value |
|--------|-------|
| **File** | `.drone.yml` (lines 13, 50) |
| **Risk** | The registry username is derived from the commit author's username. If the Gitea account differs from the author's username, or if the registry requires a specific service account, builds will fail with authentication errors. |
| **Ease** | ⭐ Trivial – use a fixed service-account username stored as a secret |

---

### 15. `generate-pdf.js` launches Chromium with `--no-sandbox`

| Detail | Value |
|--------|-------|
| **File** | `scripts/generate-pdf.js` (line 9) |
| **Risk** | `--no-sandbox` is required in most CI environments, but running the browser with reduced sandboxing is a security concern if the page content is untrusted. Since the page is the local resume page (fully trusted), the risk is **low in practice**. |
| **Ease** | N/A – this is a CI constraint; document the reason |

**Recommendation:** Add a comment explaining why `--no-sandbox` is needed (CI environment without
user namespaces), so future maintainers understand the intent.

---

## Summary Table

| # | Issue | Urgency | Ease | Status |
|---|-------|---------|------|--------|
| 1 | High-severity npm vulnerabilities (rollup, svgo) | 🔴 Critical | ⭐ Trivial | ✅ Fixed |
| 2 | WebFinger fetch has no timeout | 🔴 High | ⭐⭐ Easy | ✅ Fixed |
| 3 | WebFinger missing `acct:` URI prefix | 🔴 High | ⭐ Trivial | ✅ Fixed |
| 4 | Missing security HTTP headers | 🟡 Medium | ⭐⭐ Easy | ✅ Fixed |
| 5 | Double semicolon in webfinger.ts | 🟡 Medium | ⭐ Trivial | ✅ Fixed |
| 6 | No Content-Security-Policy | 🟡 Medium | ⭐⭐⭐ Moderate | ⬜ Pending |
| 7 | No `npm audit` in CI | 🟡 Medium | ⭐⭐ Easy | ⬜ Pending |
| 8 | Umami script always loaded | 🟡 Medium | ⭐ Trivial | ⬜ Pending |
| 9 | No linting / formatting tooling | 🟢 Low | ⭐⭐ Easy | ⬜ Pending |
| 10 | No automated tests | 🟢 Low | ⭐⭐⭐ Moderate | ⬜ Pending |
| 11 | WebFinger regex misses hyphens in domains | 🟢 Low | ⭐ Trivial | ⬜ Pending |
| 12 | `SITE_IMAGE` placeholder may not exist | 🟢 Low | ⭐ Trivial | ⬜ Pending |
| 13 | Drone CI triggers on every branch push | 🟢 Low | ⭐⭐ Easy | ⬜ Pending |
| 14 | Drone CI uses commit author as registry username | 🟢 Low | ⭐ Trivial | ⬜ Pending |
| 15 | PDF generator uses `--no-sandbox` without explanation | 🟢 Low | ⭐ Trivial | ⬜ Pending |
