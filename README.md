<p align="center">
  <img src="public/icons/logo.png" alt="AnalyticsDev Ultra" width="160" />
</p>

<h1 align="center">AnalyticsDev Ultra</h1>
<p align="center">
  <strong>Enterprise Website Tracking, Analytics, Advertising & Conversion Audit Platform</strong><br>
  <em>Created by Analytics Dev Founder Sakib Hossain</em>
</p>

---

## 🎯 Executive Overview

**AnalyticsDev Ultra** transforms manual, error-prone tracking checks into a systematic, evidence-backed technical audit:
$$\text{Website} \longrightarrow \text{Scan} \longrightarrow \text{Collect Evidence} \longrightarrow \text{Detect} \longrightarrow \text{Validate} \longrightarrow \text{Analyze} \longrightarrow \text{Score} \longrightarrow \text{Recommend} \longrightarrow \text{Report}$$

Unlike basic pixel checkers that merely verify whether a snippet exists, AnalyticsDev Ultra inspects the multi-layer tracking reality:
- **Client & Server Deduplication:** Cross-references `event_id` and `transaction_id`.
- **Dual-Tagging & Duplicate Detection:** Catches concurrent direct script + GTM container implementations that inflate pageviews and conversions.
- **Privacy & Consent Signals:** Audits CMP presence (OneTrust, Cookiebot, Usercentrics, etc.) and validates Google Consent Mode v2 (`ad_user_data`, `ad_personalization`).
- **Client-Ready Deliverables:** Generates white-label branded PDF reports, standalone HTML audits, CSV spreadsheets, and structured JSON models.

---

## 🔒 Non-Negotiable Accuracy Rule & Technical Honesty

AnalyticsDev Ultra enforces a strict distinction between observable browser evidence and private account configuration:

| Status Badge | Technical Definition | Example Observable Signal |
| :--- | :--- | :--- |
| **Verified** | Script, runtime global, and outgoing network beacon all confirmed. | Meta Pixel ID initialized + active `PageView` request to `facebook.com/tr`. |
| **Detected** | Script or identifier parsed, but active network execution not yet witnessed. | GA4 `G-XXXXXXXXXX` present in HTML `gtag('config')`. |
| **Possible** | Architecture signals suggest implementation, but private container access is needed. | `event_id` in browser payload + first-party subdomain endpoint (Meta CAPI candidate). |
| **Requires Access** | Implementation cannot be verified from client browser boundary. | Server-side GTM container configuration, private cloud routing. |
| **Not Detected** | No evidence found in DOM, runtime, cookies, or network. | Platform tracking tag completely absent. |
| **Error** | Detector encountered an isolated exception during execution. | Resilient fault isolation prevents crashing the audit. |

> **Important Boundary Rule:** Browser-level extensions can never fabricate certainty. We never claim "Meta CAPI is configured" just because Meta Pixel is present, nor do we claim "Active ad campaign running" just because `fbclid` exists.

---

## 🚀 Quick Start: Loading in Google Chrome

### Prerequisites
- Google Chrome (Version 111+ recommended for Manifest V3 MAIN world support)
- Node.js v18+ and npm installed

### 1. Build the Extension
```bash
# Install dependencies
npm install

# Run Vitest test suite
npm run test

# Compile production bundle
npm run build
```

### 2. Load into Chrome
1. Open Google Chrome and navigate to: `chrome://extensions/`
2. Enable **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `dist/` directory inside this project:
   ```
   d:\Analytics Dev\Chrome Extention\AnalyticsDev Ultra\dist
   ```
5. The **AnalyticsDev Ultra** shield icon will appear in your Chrome toolbar!
6. Click the extension icon on any website to open the Popup audit widget or click **Dashboard** to launch the full-screen audit suite.

---

## 🧩 Architectural Layers

The scanner operates across 5 independent collection layers:

```
analyticsdev-ultra/
├── src/
│   ├── background/             # Service Worker & bounded network buffering
│   │   ├── serviceWorker.ts    # Passive network observer (150 requests/tab)
│   │   └── messageRouter.ts    # Inter-component IPC and tab audit executor
│   ├── content/                # Content Script coordination
│   │   ├── contentScript.ts    # Isolated world DOM & parameter extractor
│   │   ├── runtimeInspector.ts # MAIN world window.dataLayer & fbq inspector
│   │   ├── dataLayerInspector.ts # PII-redacted dataLayer push hook
│   │   └── domInspector.ts     # Safe script, iframe, and meta scanner
│   ├── collectors/             # Reusable layer collectors
│   │   ├── domCollector.ts
│   │   ├── scriptCollector.ts
│   │   ├── cookieCollector.ts
│   │   ├── dataLayerCollector.ts
│   │   ├── networkCollector.ts
│   │   └── runtimeCollector.ts
│   ├── detectors/              # Decoupled, modular platform detectors
│   │   ├── meta/ (Pixel, CAPI, MetaRules)
│   │   ├── google/ (GA4, GTM, Google Ads, GoogleRules)
│   │   ├── tiktok/ (TikTok Pixel, ttclid, _ttp)
│   │   ├── linkedin/ (Insight Tag, Partner ID, li_fat_id)
│   │   ├── pinterest/ (Pinterest Tag, epik)
│   │   ├── microsoft/ (Bing UET, msclkid)
│   │   ├── snapchat/ (Snap Pixel, ScCid)
│   │   ├── reddit/ (Reddit Pixel, rdt_cid)
│   │   ├── openai/ (Extensible module, strict no-fabrication)
│   │   ├── consent/ (OneTrust, Cookiebot, Consent Mode v2)
│   │   └── technology/ (WordPress, Shopify, Webflow, Next.js, etc.)
│   ├── engine/                 # Core Intelligence Engines
│   │   ├── detectionEngine.ts  # Fault-isolated parallel execution
│   │   ├── validationEngine.ts # Universal events & duplicate detection
│   │   ├── scoringEngine.ts    # Transparent 100-pt scorecard
│   │   ├── recommendationEngine.ts # Evidence -> Finding -> Impact -> Rec
│   │   └── auditEngine.ts      # Unified orchestrator
│   ├── report/                 # Client-Ready Reporting
│   │   ├── pdfGenerator.ts     # Client PDF with consultant branding
│   │   ├── htmlGenerator.ts    # Standalone HTML report
│   │   └── jsonExporter.ts     # Structured JSON and CSV summary exports
│   └── ui/                     # React Tailwind SaaS UI
│       ├── popup/              # Compact Chrome Popup widget
│       ├── dashboard/          # Full-screen multi-tab dashboard
│       └── components/         # Modular UI cards, gauges, matrices
```

---

## 📊 Transparent 100-Point Scoring Algorithm

Every score is explainable down to the exact technical signal:

$$\text{Tracking Health Score} = \sum (\text{Dimension Scores}) \quad \text{out of } 100$$

| Audit Dimension | Max Points | Technical Verification Criteria |
| :--- | :---: | :--- |
| **Platform Coverage** | **15** | Active Analytics (5 pts), Tag Management (5 pts), Advertising Pixels (5 pts). |
| **Conversion Tracking** | **20** | Purchase event (8 pts), Lead/Conversion (4 pts), Transaction ID (4 pts), Revenue & Currency (4 pts). |
| **Event Tracking** | **20** | $\ge 6$ standard/custom events (20 pts), $\ge 4$ events (16 pts), $\ge 2$ events (12 pts), $\ge 1$ (8 pts). |
| **Server-Side Tracking** | **15** | Confirmed sGTM/Stape endpoint (15 pts), event_id dedup + first-party host (12 pts), browser event_id only (8 pts), client-only (4 pts). |
| **DataLayer Architecture** | **10** | Initialized `window.dataLayer` (4 pts), active event pushes (2 pts), standard ecommerce schema (4 pts). |
| **Consent & Privacy** | **10** | Recognized CMP (5 pts), Google Consent Mode v2 (5 pts), legacy Consent Mode v1 (3 pts). |
| **Implementation Quality** | **10** | Deductions for duplicate GTM containers, dual-tagging GA4/Meta, or detector runtime failures. |

**Grading Scale:**
- **A+:** 90 – 100
- **A:** 80 – 89
- **B:** 70 – 79
- **C:** 60 – 69
- **D:** 50 – 59
- **F:** $< 50$

---

## 🛡️ Privacy & PII Protection Policy

AnalyticsDev Ultra is engineered with mandatory local-first privacy:
1. **Zero External Data Transmission:** Audits run locally on your browser. No website data, payloads, or cookies are sent to external servers.
2. **PII Sanitization:** The `DataLayerCollector` automatically scrubs email addresses, phone numbers, customer names, passwords, and credit card numbers from memory before display or export.
3. **Bounded Memory Buffers:** Network request logs are restricted to a maximum of 150 items per tab and automatically purged upon tab closure.

---

## 🧪 Automated Test Suite

AnalyticsDev Ultra includes a comprehensive Vitest test suite testing detectors, false positive resistance, scoring, duplicate tracking, and PDF export:

```bash
npm run test
```

Test coverage includes:
- **Meta-Only Website:** Tests pixel ID parsing, events, and enforces CAPI `requires_access` status.
- **GA4 + GTM Dual Tagging:** Validates detection of duplicate implementation paths and container conflicts.
- **Multiple GTM Containers:** Confirms duplicate warnings on multiple container IDs.
- **DataLayer Ecommerce:** Verifies transaction ID, revenue, currency, and item-level parsing.
- **Google Consent Mode v2:** Verifies capture of `ad_user_data` and `ad_personalization`.
- **False-Positive Baseline:** Verifies clean websites produce zero false platform detections and an explainable baseline score.
- **Report Generation:** Asserts headless PDF and HTML generation execute without error.

---

## 👤 Founder & Consultant Profile Settings

AnalyticsDev Ultra was created by **Sakib Hossain**, Founder of **Analytics Dev**.

It includes customizable white-label consultant branding for PDF and HTML reports:
- **Founder & Default Consultant:** Sakib Hossain
- **Title:** Founder, Analytics Dev
- **Company:** Analytics Dev
- **Customizable:** Name, Company, Logo, Website, Email, Phone, Brand Color, and Legal Footer Notice.

Editable in the **Settings** tab within the Dashboard, automatically stored in `chrome.storage.local`.

---

## 📄 License
MIT License. Built with strict engineering standards for analytics consultants and tracking professionals.
