// scratch/verify_env.js
const fs = require('fs');
const path = require('path');

const requiredVars = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
  "JWT_SECRET",
  "REFRESH_SECRET",
  "NEXT_PUBLIC_APP_URL"
];

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const envObj = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      envObj[key] = val;
    }
  });
  return envObj;
}

console.log("=== ENVIRONMENT VARIABLE DIAGNOSTIC ===");

['.env', '.env.local'].forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  console.log(`\nChecking file: ${file}`);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ ${file} does NOT exist!`);
    process.exit(1);
  }

  const parsed = parseEnv(fullPath);
  let missing = 0;

  requiredVars.forEach(v => {
    const val = parsed[v];
    if (val === undefined || val === null || val === '') {
      console.error(`  ❌ ${v}: UNDEFINED / MISSING`);
      missing++;
    } else {
      console.log(`  ✔ ${v}: PRESENT (${val.length} chars)`);
    }
  });

  if (missing === 0) {
    console.log(`✔ All ${requiredVars.length} required environment variables in ${file} exist and are defined.`);
  } else {
    console.error(`❌ ${missing} environment variables missing in ${file}`);
    process.exit(1);
  }
});

console.log("\n=== ALL ENVIRONMENT VARIABLES VERIFIED 100% ===");
