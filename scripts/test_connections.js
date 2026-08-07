const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== TESTING DATABASE CONNECTION ===");
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test, current_database(), current_user;`;
    console.log("DB Query Succeeded:", result);
  } catch (err) {
    console.error("DB Query Failed:", err.message);
  }

  console.log("\n=== TESTING WEBSITE SETTINGS IN DB ===");
  try {
    const settings = await prisma.websiteSetting.findMany();
    console.log(`Found ${settings.length} WebsiteSetting rows in DB:`);
    settings.forEach(s => {
      console.log(`- Key: "${s.key}", Value length: ${s.value ? s.value.length : 0}`);
      try {
        const parsed = JSON.parse(s.value);
        console.log(`  Parsed JSON keys: ${Object.keys(parsed).join(", ")}`);
      } catch (e) {
        console.log(`  Raw value (non-JSON): ${s.value ? s.value.slice(0, 50) : ''}...`);
      }
    });
  } catch (err) {
    console.error("WebsiteSetting fetch failed:", err.message);
  }

  console.log("\n=== TESTING USERS IN DB ===");
  try {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} User rows:`, users.map(u => ({ username: u.username, role: u.role })));
  } catch (err) {
    console.error("User fetch failed:", err.message);
  }

  console.log("\n=== TESTING SUPABASE STORAGE BUCKET ===");
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wonrbugnncrvabfxdckn.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "orivence-media";

    const endpoint = `${supabaseUrl}/storage/v1/bucket/${bucket}`;
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${supabaseKey}` }
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`Supabase Storage Bucket '${bucket}' status: OK`, data);
    } else {
      const text = await res.text();
      console.log(`Supabase Storage Bucket '${bucket}' status code ${res.status}:`, text);
      if (res.status === 404) {
        console.log(`Bucket '${bucket}' not found. Attempting to create bucket...`);
        const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: bucket,
            name: bucket,
            public: true
          })
        });
        const createData = await createRes.json();
        console.log("Bucket creation result:", createRes.status, createData);
      }
    }
  } catch (err) {
    console.error("Supabase Storage check failed:", err.message);
  }

  await prisma.$disconnect();
}

main();
