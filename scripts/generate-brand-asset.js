import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const icon48Path = path.resolve(__dirname, '../public/icons/icon48.png');
const icon128Path = path.resolve(__dirname, '../public/icons/icon128.png');
const logoPath = path.resolve(__dirname, '../public/icons/logo.png');

const icon48Base64 = fs.readFileSync(icon48Path).toString('base64');
const icon128Base64 = fs.readFileSync(icon128Path).toString('base64');
const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString('base64') : icon128Base64;

const outDir = path.resolve(__dirname, '../src/assets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const content = `// AnalyticsDev Ultra Brand Assets
// Created by Analytics Dev Founder Sakib Hossain

export const BRAND_ICON_48_BASE64 = 'data:image/png;base64,${icon48Base64}';
export const BRAND_ICON_128_BASE64 = 'data:image/png;base64,${icon128Base64}';
export const BRAND_LOGO_BASE64 = 'data:image/png;base64,${logoBase64}';
export const FOUNDER_NAME = 'Sakib Hossain';
export const FOUNDER_ROLE = 'Founder, Analytics Dev';
export const BRAND_NAME = 'AnalyticsDev Ultra';
export const BRAND_CREDIT = 'Created by Analytics Dev Founder Sakib Hossain';
`;

fs.writeFileSync(path.join(outDir, 'brandLogo.ts'), content, 'utf8');
console.log('Successfully generated src/assets/brandLogo.ts');
