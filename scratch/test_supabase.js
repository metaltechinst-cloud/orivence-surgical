// scratch/test_supabase.js

const supabaseUrl = "https://wonrbugnncrvabfxdckn.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbnJidWdubmNydmFiZnhkY2tuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg4NTg3MiwiZXhwIjoyMTAwNDYxODcyfQ.B1_GG7Y8-wxwFknMxlManAyVK1qo2vpoNOfD6tqMeoY";

async function run() {
  console.log("Connecting to Supabase project:", supabaseUrl);

  try {
    // 1. Check storage buckets
    const listRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (listRes.ok) {
      const buckets = await listRes.json();
      console.log("Existing Supabase buckets:", buckets.map(b => b.name));

      const exists = buckets.some(b => b.name === "orivence-media");
      if (!exists) {
        console.log("Creating public bucket 'orivence-media'...");
        const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: "orivence-media",
            name: "orivence-media",
            public: true,
          }),
        });

        if (createRes.ok) {
          console.log("SUCCESS: Created public Supabase Storage bucket 'orivence-media'! 🚀");
        } else {
          console.log("Bucket create output:", await createRes.text());
        }
      } else {
        console.log("Bucket 'orivence-media' already exists and is ready! 🚀");
      }
    } else {
      console.log("Failed to fetch buckets:", await listRes.text());
    }
  } catch (e) {
    console.error("Supabase test error:", e);
  }
}

run();
