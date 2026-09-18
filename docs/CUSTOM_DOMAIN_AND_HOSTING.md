# 🌐 Production Domain & Hosting Guide: Oxygen Orbis Hotel & Resort

This guide outlines the production deployment architecture, DNS configurations, SSL certificates, and CI/CD pipelines for **Oxygen Orbis Hotel & Resort** (Moniya, Ibadan).

---

## 1. Domain Names Strategy

| Domain | Role | Target / Record |
|---|---|---|
| `oxygenorbis.com` | **Primary Production Domain** | Apex `A` Record -> `76.76.21.21` (Vercel Anycast IP) |
| `www.oxygenorbis.com` | Primary Subdomain | `CNAME` -> `cname.vercel-dns.com` (Auto 301 to Apex) |
| `oxygenorbisresort.com`| Secondary Brand Shield | `CNAME` -> 301 Permanent Redirect to `https://oxygenorbis.com` |

---

## 2. DNS Zone Configuration (Cloudflare / Namecheap / GoDaddy)

Configure the following records in your domain registrar DNS manager:

```dns
Type:    A
Name:    @ (or oxygenorbis.com)
Value:   76.76.21.21
TTL:     3600 (Auto)

Type:    CNAME
Name:    www
Value:   cname.vercel-dns.com
TTL:     3600 (Auto)

Type:    TXT
Name:    _vercel
Value:   vc-domain-verify=oxygenorbis.com,...
TTL:     3600
```

---

## 3. SSL / TLS Certificate Automation

- **Certificate Authority:** Let's Encrypt / DigiCert Wildcard SSL.
- **Protocols:** TLS 1.3 & TLS 1.2 strictly enforced.
- **HTTP Redirection:** All plaintext `http://` requests are permanently redirected (301) to `https://`.
- **HSTS Enforced:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2-year preload list eligible).

---

## 4. Security Headers Matrix

Configured in `vercel.json`, `public/_headers`, and `nginx.conf`:

| Security Header | Directive / Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Defeats SSL-stripping man-in-the-middle attacks. |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing exploits. |
| `X-Frame-Options` | `SAMEORIGIN` | Blocks unauthorized iframe embedding (anti-clickjacking). |
| `X-XSS-Protection` | `1; mode=block` | Legacy browser reflected XSS filter. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects sensitive booking URLs from leaking in referrer headers. |
| `Content-Security-Policy` | Whitelists `'self'`, `js.paystack.co`, `api.paystack.co`, Google Fonts | Guarantees safe script execution while allowing Paystack payment processing. |

---

## 5. Performance & Sub-1.2s Load Speeds

1. **Vite Minification & Tree-Shaking:** Client JS bundle compiled to ~132 kB gzipped.
2. **Global CDN Edge Caching:** Static assets (`/assets/*`) cached with `Cache-Control: public, max-age=31536000, immutable`.
3. **Brotli & Gzip Compression:** Enabled on all text, CSS, JS, and SVG assets.
4. **Pre-connect & DNS Prefetch:** Whitelists `https://js.paystack.co` and `https://fonts.googleapis.com` in `index.html`.

---

## 6. Continuous Deployment (CI/CD Pipeline)

GitHub Actions workflow located at `.github/workflows/production-deploy.yml`:
1. Runs full 7-module automated test suite (`npm test`).
2. Compiles Vite production bundle (`npm run build`).
3. Audits performance budget (< 1.2s load speed target).
4. Deploys zero-downtime atomic release to Vercel production edge with domain alias `oxygenorbis.com`.
