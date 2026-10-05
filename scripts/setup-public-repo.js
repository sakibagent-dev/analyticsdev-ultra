import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const OWNER = 'sakibagent-dev';
const REPO = 'analyticsdev-ultra';

// Read token
const mcpConfig = JSON.parse(
  fs.readFileSync('C:\\Users\\hossa\\.gemini\\config\\mcp_config.json', 'utf8')
);
const token = mcpConfig.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN;

const headers = {
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'AnalyticsDev-Ultra-PublicSetup',
};

async function run() {
  console.log('1. Updating repository metadata on GitHub...');
  const repoRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Enterprise Chrome Extension for Website Tracking, Google Tag Manager, Meta CAPI, GA4, TikTok & Conversion Audits — Created by Analytics Dev Founder Sakib Hossain',
      homepage: 'https://github.com/sakibagent-dev/analyticsdev-ultra',
      has_issues: true,
      has_projects: true,
      has_wiki: true,
    }),
  });
  if (!repoRes.ok) {
    console.error('Failed to update repo metadata:', await repoRes.text());
  } else {
    console.log('Repository metadata updated successfully!');
  }

  console.log('2. Updating topics/tags...');
  const topicsRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/topics`, {
    method: 'PUT',
    headers: {
      ...headers,
      Accept: 'application/vnd.github.mercy-preview+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      names: [
        'chrome-extension',
        'conversion-tracking',
        'google-tag-manager',
        'google-analytics-4',
        'meta-pixel',
        'meta-capi',
        'tracking-audit',
        'marketing-analytics',
        'analytics-dev',
      ],
    }),
  });
  if (!topicsRes.ok) {
    console.error('Failed to update topics:', await topicsRes.text());
  } else {
    console.log('Topics updated successfully!');
  }

  console.log('3. Creating GitHub Release v1.0.0...');
  const releaseRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: 'v1.0.0',
      target_commitish: 'main',
      name: 'AnalyticsDev Ultra v1.0.0 — Official Public Release',
      body: `## 🚀 AnalyticsDev Ultra v1.0.0
**Enterprise Website Tracking, Analytics, Advertising & Conversion Audit Platform**
*Created with excellence by Analytics Dev Founder Sakib Hossain*

### 📥 1-Click Installation (Anyone Can Use — No Coding or Terminal Required)
1. Download **\`AnalyticsDev-Ultra-v1.0.0.zip\`** from the Assets list below.
2. Unzip/Extract the downloaded file on your computer.
3. Open **Google Chrome** and navigate to \`chrome://extensions/\` in your address bar.
4. Toggle **Developer mode** ON (switch in the top-right corner).
5. Click the **Load unpacked** button in the top-left corner.
6. Select the extracted folder containing \`manifest.json\`.
7. **Done!** The AnalyticsDev Ultra shield icon is now pinned to your toolbar ready to audit any website!

---

### 🛡️ Features Included in v1.0.0:
- **Multi-Platform Audit:** Meta Pixel, Meta CAPI, Google Ads, GA4, GTM, TikTok, LinkedIn, Pinterest, Bing UET, Snapchat, Reddit.
- **Client & Server Deduplication:** Real-time checking of \`event_id\` and \`transaction_id\` across browser beacons and server candidates.
- **DataLayer Inspector:** Deep inspection of e-commerce payloads with automatic PII redaction.
- **Consent Mode v2:** Validates Google Consent Mode v2 (\`ad_user_data\`, \`ad_personalization\`) and CMP detection.
- **Client-Ready Reports:** 1-Click PDF exports with executive summary and transparent 100-pt scorecard, Standalone HTML reports, and CSV spreadsheets.
- **White-Label Branding:** Branded with Analytics Dev and founder Sakib Hossain credentials.`,
      draft: false,
      prerelease: false,
    }),
  });

  const release = await releaseRes.json();
  if (!releaseRes.ok) {
    console.error('Failed to create release:', release);
    return;
  }
  console.log(`Release v1.0.0 created: ${release.html_url}`);

  console.log('4. Uploading pre-built ZIP asset to Release...');
  const zipPath = path.resolve(rootDir, 'AnalyticsDev-Ultra-v1.0.0.zip');
  const zipBuffer = fs.readFileSync(zipPath);

  const uploadUrl = release.upload_url.replace('{?name,label}', `?name=AnalyticsDev-Ultra-v1.0.0.zip`);
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'AnalyticsDev-Ultra-PublicSetup',
      'Content-Type': 'application/zip',
      'Content-Length': zipBuffer.length.toString(),
    },
    body: zipBuffer,
  });

  if (!uploadRes.ok) {
    console.error('Failed to upload asset:', await uploadRes.text());
  } else {
    const asset = await uploadRes.json();
    console.log(`Asset uploaded successfully! Download URL: ${asset.browser_download_url}`);
  }
}

run().catch(console.error);
