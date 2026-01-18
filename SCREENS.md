# Umami Go — Expected UX Scope (Screens)

This document describes the **intended product scope** only: what each screen should do, which settings/controls it owns, and the required UX states. It intentionally avoids implementation details.

## Global scope (applies everywhere)

- **Navigation groups**
  - **Onboarding**: only for first-time setup or reconnect
  - **App**: main usage
- **Instances**
  - Support **multiple instances** (self-hosted and cloud)
  - Exactly **one active instance** at a time (default selection)
- **Authentication**
  - Users should be “always connected when needed”
  - If **host is down**: show non-blocking warning + retry path
  - If **credentials changed / invalid**: prompt to reconnect
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
- **Purpose**: Verify the provided credentials and create an instance.
- **Settings/controls**
  - None (operation screen)
- **Required states**
  - Loading/progress state
  - Success → enter app
  - Failures:
    - Host unreachable → show actionable error + back to form
    - Unauthorized → show actionable error + back to form
    - Other → show message + back to form

### Reconnect (expected UX, may reuse onboarding)
- **Purpose**: Recover from invalid credentials or missing secrets without confusing the user.
- **Settings/controls**
  - Update credentials for an existing instance (preferred)
  - Or re-add as new instance (fallback)
- **Required states**
  - Clear messaging: what failed and what user needs to do

---

## Main app (top-level tabs)

### Instances (Home)
- **Purpose**: Manage and enter instances.
- **Settings/controls**
  - Add instance
  - Select active instance (tap)
  - (Later) edit / delete / reconnect per instance
- **Required states**
  - Empty list state (no instances)
  - List state with active indicator
  - Error state if instance metadata is corrupted/unavailable

### App Settings
- **Purpose**: Global app preferences.
- **Expected settings**
  - Default time range
  - Refresh interval defaults
  - Data usage / background refresh preferences (if supported)
  - Troubleshooting shortcuts (reset onboarding / clear cache) (optional)

### Debug (dev-only)
- **Purpose**: Developer diagnostics and maintenance actions.
- **Expected controls**
  - Refresh diagnostic info
  - Clear local data / reset onboarding
  - Inspect active instance + auth state (dev-only)

---

## Instance area (per-instance tabs)

### Instance shell (Tabs)
- **Purpose**: Provide stable navigation inside an instance.
- **Required behaviors**
  - Ensure instance exists; if not, return to instances list
  - Ensure session/auth is valid before data calls
  - Non-blocking notifications for host down
  - Actionable prompt for reconnect when unauthorized

### Overview
- **Purpose**: Default dashboard landing for an instance.
- **Expected content**
  - High-level KPIs (visitors, pageviews, sessions, bounce, etc.)
  - Time range selector
  - Website selector (or “All sites”)
- **Required states**
  - Loading
  - No websites / no data yet
  - Host down
  - Unauthorized → reconnect CTA

### Websites
- **Purpose**: Manage/select websites for the instance.
- **Expected content**
  - List of websites (name + domain)
  - Select website to drive other tabs
  - (Later) search/filter
- **Required states**
  - Loading
  - Empty (no websites)
  - Host down / unauthorized

### Realtime
- **Purpose**: Live analytics for a selected website (or all).
- **Expected content**
  - Live visitors
  - Current pages
  - Referrers / countries / devices (as feasible)
  - Polling interval & pause
- **Required states**
  - Loading
  - Host down / unauthorized

### Instance Settings
- **Purpose**: Manage a specific instance.
- **Expected settings**
  - Rename instance
  - Update host
  - Reconnect / rotate credentials (password/apiKey)
  - Remove instance
  - Set as active (if multiple entry paths exist)

---

## “Done” criteria (UX-level)

- **First run**: onboarding is linear, understandable, and errors are actionable.
- **Returning user**: lands in app and can enter an instance in one tap.
- **Always-connected**:
  - transparent re-auth when possible
  - clear reconnect when not possible
- **Failure states** are consistent:
  - Host unreachable → warn + retry
  - Unauthorized → reconnect CTA
  - Missing instance → safe redirect to Instances list

