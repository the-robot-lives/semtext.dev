# Threat Model Summary — semtext app

Two-container stack (Phoenix + Hologram backend `:semtext`, nginx proxy) behind k8s ingress TLS (`semtext-dev-tls`; live-dev lane `dev.semtext.dev` / `semtext-live-dev-tls`), serving `semtext.dev` + `www` and `proposals.semtext.dev`. Trust boundaries: internet→edge (TLS at ingress, nginx :80 internal), edge→backend (nginx adds no auth), host isolation (HostDispatch before routing; host-only cookies; HostGuard 404s cross-host resolution), inbound GitHub webhook (HMAC trust), backend→stores (credential-isolated Postgres/Redis on shared Docker network), cluster→sandbox (Samba/supervisord lane), process→third parties (Authentik OIDC, GitHub OAuth/GraphQL, SMTP, webhook egress, PostHog, fleet ingest). Crown jewels: Postgres data, session/JWT signing secrets, GitHub webhook/App-key secrets. Hydrated from the `hologram-start-app` scaffold (2026-10-14); controls inherited, product-era surfaces modeled on their own merits.

## Register (12 entries: 7 mitigated · 4 partial · 1 open)

| ID | Sev | STRIDE | Component | Status |
|----|-----|--------|-----------|--------|
| T-001 | High | Spoofing | SSO domain trust + auto-approve | Mitigated (allowlist + pending approval default) |
| T-002 | High | Elevation | PBAC wildcard policies | Partial (deny-overrides; broad wildcard honored) |
| T-003 | Med | Spoofing | Auth brute force | Mitigated (Hammer rate limits) |
| T-004 | Med | Tampering | Webhooks unsigned when secret nil | Partial (HMAC when secret set) |
| T-005 | Med | DoS/Info | Unauthenticated /otel/ proxy | Open |
| T-006 | Med | Tampering | Media upload/transform | Partial |
| T-007 | High | Elevation | Sandbox Samba share | Mitigated (cluster-internal, SMB2, valid users) |
| T-008 | Low | Info | PII in JSON/OTel logs | Partial |
| T-009 | Med | DoS | Single backend, WS churn | Partial (HPA/PDB) |
| T-010 | Low | Tampering | tobor_kit_hologram path dep | Mitigated (monorepo-local) |
| T-011 | Med | Spoof/Tamper | Inbound GitHub webhook | Mitigated (constant-time HMAC over raw body + two-layer replay dedupe; 503 on missing secret) |
| T-012 | Low | Spoofing | Cross-host session confusion | Mitigated (host-only cookies + HostDispatch + HostGuard) |

Session cross-cutting: signed SameSite=Lax SSO flow cookie, fails closed on state mismatch; Guardian JWT secrets from runtime/Infisical; prod raises on missing signing secrets; proposals moderation gates on `users.role == "moderator"`.

## Residual Risk

Shared Docker network isolation is credential-based (dev); /otel/ openness accepted for zero-config browser RUM; GitHub webhook/App secrets rotate manually; scaffold-inherited defaults should be re-reviewed when the auth surface changes.
