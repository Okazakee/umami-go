# Umami Go — Roadmap

## Vision
Build a fast, friendly mobile client for Umami that lets users connect to one or more instances (self-hosted or Umami Cloud) and check analytics on the go.

## Principles
- **Secure by default**: store sensitive secrets in `expo-secure-store`.
- **Offline-friendly**: cache last-known data and recover gracefully.
- **Multi-instance first**: make switching/adding instances a first-class flow.
- **Simple UX**: onboarding should be quick, reversible, and predictable.

## Milestones

### 0) Foundation (current)
- [x] Expo Router app structure with onboarding + app groups
- [x] Setup-type selection (Self-Hosted vs Cloud)
- [x] Self-hosted credential form + validation UX
- [x] Self-hosted connection verification screen (login → success/failure)
- [x] Persist onboarding completion + credentials/instance info
- [x] Dev-only `.env.local` support via `app.config.ts`

### 1) Stabilization (next)
- [ ] Fix “configured linking in multiple places” regression on restart (ensure single linking + no redirect loops)
- [ ] Make verify screen behavior deterministic (no retry loops, no accidental back navigation during verify)
- [ ] Add basic error taxonomy + better messages (DNS, TLS, timeout, 401, 404)
- [ ] Add “reset onboarding / sign out” that also clears stored credentials

### 2) Instance Management
- [ ] Store and list multiple instances (name, host, type)
- [ ] Migrate instance metadata to SQLite (`expo-sqlite`) and keep secrets in `expo-secure-store`
- [ ] Switch active instance
- [ ] Remove instance + clear its credentials safely
- [ ] “Edit instance” (host/name) and “Re-authenticate” flows

### 3) Analytics Dashboard v1
- [ ] Define core screens: Overview, Websites list, Website details
- [ ] Fetch + display key metrics (pageviews, uniques, sessions) for selected range
- [ ] Date range picker (Today / 7d / 30d / custom)
- [ ] Basic charts (simple line/bar) + loading/skeleton states

### 4) Umami Cloud Support
- [ ] Cloud auth flow (API key) + verify screen parity with self-hosted
- [ ] Store API key in `expo-secure-store`
- [ ] Cloud-specific error handling + docs link in-app

### 5) Background Refresh + Caching
- [ ] Cache last successful dashboard payload per instance
- [ ] Pull-to-refresh + stale indicator
- [ ] Optional periodic refresh when app resumes

### 6) Security & Privacy Hardening
- [ ] Minimize sensitive data in navigation params (avoid passing passwords via route params)
- [ ] Add “lock” option (biometrics / device auth) for opening the app
- [ ] Audit logs and remove any credential logging

### 7) UI/UX Polish
- [ ] Consistent theming (light/dark), typography, spacing, and surfaces
- [ ] Better empty states (no sites, no data, offline)
- [ ] Accessibility pass (contrast, font scaling, touch targets)

### 8) Release Prep
- [ ] Crash reporting + basic analytics (optional)
- [ ] App icon/splash polish, store screenshots, metadata
- [ ] E2E sanity checklist for onboarding + dashboard
- [ ] Versioning + changelog strategy

## Open Questions
- What is the “MVP dashboard” scope (top 3–5 metrics/screens)?
- Should cloud be “first-class” equal to self-hosted, or phased after dashboard v1?
- Multi-instance UX: tabs, drawer, or settings screen?

