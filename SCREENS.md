# Umami Go — Expected UX Scope (Screens)

This document describes the **intended product scope** only: what each screen should do, which settings/controls it owns, and the required UX states. It intentionally avoids implementation details.

## Global scope (applies everywhere)

- **Navigation groups**
  - **Onboarding**: first-time setup only
  - **App**: main usage
- **Single instance**
  - The app supports **exactly one Umami connection** at a time (self-hosted *or* cloud).
  - “Connecting again” is **blocked** unless the user first disconnects/reset in Settings.
- **Websites**
  - The connection can contain multiple websites.
  - The app has one “Current website” selection that drives Overview + Realtime.
- **Authentication**
  - Users should be “always connected when needed”.
  - If **host is down**: show non-blocking warning + retry path.
  - If **credentials changed / invalid**: prompt to disconnect and reconnect (reset-first).
- **Global UX states**
  - Loading
  - Empty states
  - Error states (host down, unauthorized, unknown)

---

## Root / App shell

### App entry / gate
- **Purpose**: Decide whether user lands in onboarding or app.
- **Settings/controls**
  - None (logic-only).
- **Required states**
  - Splash/loading while state is determined
  - Safe redirect if state is inconsistent

---

## Onboarding flow

### Welcome
- **Purpose**: First-launch greeting and CTA into onboarding.
- **Settings/controls**
  - Primary CTA: start onboarding

### Features
- **Purpose**: Explain the product in 2–4 bullets.
- **Settings/controls**
  - Primary CTA: continue

### Setup choice
- **Purpose**: Choose between:
  - **Self-hosted** (host + username + password)
  - **Umami Cloud** (host + API key)
- **Settings/controls**
  - Setup type selection
  - “More info” link for Cloud API key guidance
- **Required states**
  - Persist selection for later steps

### Credentials form
- **Purpose**: Collect credentials for the chosen setup type.
- **Settings/controls**
  - Inputs:
    - Self-hosted: host, username, password
    - Cloud: host, apiKey
  - Primary CTA: verify connection
- **Required states**
  - Field validation (required + basic format)
  - Disabled primary CTA until valid

### Verify / Connect
- **Purpose**: Verify the provided credentials and save the single connection.
- **Settings/controls**
  - None (operation screen)
- **Required states**
  - Loading/progress state
  - Success → enter app
  - Failures:
    - Host unreachable → show actionable error + back to form
    - Unauthorized → show actionable error + back to form
    - Other → show message + back to form
  - If already connected → show “Already connected. Disconnect in Settings to connect again.”

---

## Main app (top-level tabs)

### Overview
- **Purpose**: Default dashboard landing.
- **Expected content**
  - High-level KPIs for the **Current website** (visitors, pageviews, etc.)
  - Time range selector (uses default from Settings; later can be inline override)
  - Current website summary (selected label, website count)
- **Required states**
  - Not connected → “Connect” CTA
  - Loading
  - No websites / no data yet
  - Host down
  - Unauthorized → “Disconnect & reconnect” (reset-first)

### Websites
- **Purpose**: Choose the “Current website” for the app.
- **Expected content**
  - List of websites (name + domain)
  - Select website to drive other tabs
  - (Later) search/filter
- **Required states**
  - Not connected → “Connect” CTA
  - Loading
  - Empty (no websites)
  - Host down / unauthorized

### Realtime
- **Purpose**: Live analytics for the Current website.
- **Expected content**
  - Live visitors
  - (Later) current pages / referrers / countries / devices
  - (Later) polling interval & pause
- **Required states**
  - Not connected → “Connect” CTA
  - Loading
  - No website selected → “Choose website”
  - Host down / unauthorized

### Settings
- **Purpose**: App preferences + connection management.
- **Expected settings**
  - **Connection**
    - Show connected instance details (name, type, host)
    - Disconnect / reset (required to connect again)
  - **Preferences**
    - Default time range
    - Refresh interval defaults
  - **Data & background**
    - Data usage / background refresh preferences (if supported)
  - **Troubleshooting**
    - Docs links
    - Connect/change instance (if connected → prompt disconnect first)

### Debug (dev-only)
- **Purpose**: Developer diagnostics and maintenance actions.
- **Expected controls**
  - Refresh diagnostic info
  - Clear local data / reset onboarding
  - Inspect stored connection + auth state (dev-only)

---

## “Done” criteria (UX-level)

- **First run**: onboarding is linear, understandable, and errors are actionable.
- **Returning user**: lands in app and sees Overview immediately.
- **Always-connected**:
  - transparent re-auth when possible
  - clear disconnect/reconnect when not possible
- **Failure states** are consistent:
  - Host unreachable → warn + retry
  - Unauthorized → disconnect + reconnect CTA
  - Missing connection → safe redirect to onboarding

