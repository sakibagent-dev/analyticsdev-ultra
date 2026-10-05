import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const OWNER = 'sakibagent-dev';
const REPO = 'analyticsdev-ultra';
const BRANCH = 'main';

// Read GITHUB_PERSONAL_ACCESS_TOKEN from mcp_config.json
let token = process.env.GITHUB_TOKEN;
if (!token) {
  try {
    const mcpConfig = JSON.parse(
      fs.readFileSync('C:\\Users\\hossa\\.gemini\\config\\mcp_config.json', 'utf8')
    );
    token = mcpConfig?.mcpServers?.github?.env?.GITHUB_PERSONAL_ACCESS_TOKEN;
  } catch (e) {
    console.error('Failed to read token from mcp_config.json:', e);
  }
}

if (!token) {
  console.error('No GitHub token found!');
  process.exit(1);
}

const headers = {
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'AnalyticsDev-Ultra-Deployer',
};

async function ghFetch(endpoint, options = {}) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API error ${res.status} on ${endpoint}: ${errorText}`);
  }
  return res.json();
}

function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    // Ignore list
    if (
      file === 'node_modules' ||
      file === '.git' ||
      file === 'dist' ||
      file === '.DS_Store' ||
      file === 'coverage' ||
      file.endsWith('.log')
    ) {
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

async function createBlob(filePath) {
  const isBinary = /\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$/i.test(filePath);
  let content;
  let encoding;

  if (isBinary) {
    content = fs.readFileSync(filePath).toString('base64');
    encoding = 'base64';
  } else {
    content = fs.readFileSync(filePath, 'utf8');
    encoding = 'utf-8';
  }

  const res = await ghFetch('/git/blobs', {
    method: 'POST',
    body: JSON.stringify({ content, encoding }),
  });
  return res.sha;
}

async function main() {
  console.log(`Starting GitHub deployment to https://github.com/${OWNER}/${REPO}...`);

  // 1. Get latest commit on branch
  let parentCommitSha = null;
  let baseTreeSha = null;
  try {
    const refData = await ghFetch(`/git/refs/heads/${BRANCH}`);
    parentCommitSha = refData.object.sha;
    const commitData = await ghFetch(`/git/commits/${parentCommitSha}`);
    baseTreeSha = commitData.tree.sha;
    console.log(`Found current head commit: ${parentCommitSha}`);
  } catch (err) {
    console.log(`Branch ${BRANCH} ref check:`, err.message);
  }

  // 2. Scan files
  const files = getAllFiles(rootDir);
  console.log(`Found ${files.length} files to synchronize...`);

  // 3. Create blobs in parallel batches
  const treeItems = [];
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (f) => {
        try {
          const sha = await createBlob(f.fullPath);
          treeItems.push({
            path: f.relPath,
            mode: '100644',
            type: 'blob',
            sha,
          });
          process.stdout.write('.');
        } catch (err) {
          console.error(`\nError creating blob for ${f.relPath}:`, err.message);
          throw err;
        }
      })
    );
  }
  console.log(`\nAll ${treeItems.length} blobs created.`);

  // 4. Create Tree
  console.log('Creating Git Tree...');
  const treePayload = {
    tree: treeItems,
    ...(baseTreeSha ? { base_tree: baseTreeSha } : {}),
  };
  const treeRes = await ghFetch('/git/trees', {
    method: 'POST',
    body: JSON.stringify(treePayload),
  });
  console.log(`Git Tree created: ${treeRes.sha}`);

  // 5. Create Commit
  console.log('Creating Commit...');
  const commitPayload = {
    message: 'Add brand logo across extension & attribute creator Analytics Dev Founder Sakib Hossain',
    tree: treeRes.sha,
    parents: parentCommitSha ? [parentCommitSha] : [],
  };
  const commitRes = await ghFetch('/git/commits', {
    method: 'POST',
    body: JSON.stringify(commitPayload),
  });
  console.log(`Commit created: ${commitRes.sha}`);

  // 6. Update Branch Ref
  console.log(`Updating ref refs/heads/${BRANCH}...`);
  if (parentCommitSha) {
    await ghFetch(`/git/refs/heads/${BRANCH}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: commitRes.sha,
        force: true,
      }),
    });
  } else {
    await ghFetch('/git/refs', {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${BRANCH}`,
        sha: commitRes.sha,
      }),
    });
  }

  console.log(`\n🎉 SUCCESS! Pushed to https://github.com/${OWNER}/${REPO}`);
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
