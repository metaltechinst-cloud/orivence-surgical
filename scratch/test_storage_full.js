// scratch/test_storage_full.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStorageFull() {
  console.log("--- TESTING SUPABASE STORAGE & MEDIA ASSET SYNC ---");
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wonrbugnncrvabfxdckn.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbnJidWdubmNydmFiZnhkY2tuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg4NTg3MiwiZXhwIjoyMTAwNDYxODcyfQ.B1_GG7Y8-wxwFknMxlManAyVK1qo2vpoNOfD6tqMeoY";
  const bucketName = "orivence-media";

  // 1. Upload Test File
  const testBuffer = Buffer.from("Hello Orivence Surgical Storage Test " + Date.now());
  const filename = `test_file_${Date.now()}.txt`;
  const filePath = `test/${filename}`;

  const uploadEndpoint = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;
  const uploadRes = await fetch(uploadEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "text/plain",
      "x-upsert": "true",
    },
    body: new Uint8Array(testBuffer),
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.statusText} - ${await uploadRes.text()}`);
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
  console.log("✅ UPLOAD PASS:", publicUrl);

  // 2. Download / Fetch Public URL
  const fetchRes = await fetch(publicUrl);
  if (!fetchRes.ok) {
    throw new Error(`Download/Public URL failed: ${fetchRes.status}`);
  }
  const content = await fetchRes.text();
  console.log("✅ DOWNLOAD / PUBLIC URL PASS:", content.slice(0, 30));

  // 3. Sync to MediaAsset DB
  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      filename: filename,
      url: publicUrl,
      type: "text/plain",
      size: testBuffer.length,
      folder: "/test",
      altText: "Test Alt",
      title: "Test Title",
    },
  });
  console.log("✅ DB MEDIA ASSET CREATED PASS:", mediaAsset.id);

  // 4. Replace File
  const updatedBuffer = Buffer.from("Updated Content " + Date.now());
  const replaceRes = await fetch(uploadEndpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "text/plain",
    },
    body: new Uint8Array(updatedBuffer),
  });

  if (!replaceRes.ok) {
    throw new Error(`Replace failed: ${replaceRes.statusText} - ${await replaceRes.text()}`);
  }
  console.log("✅ REPLACE PASS");

  // 5. Delete Storage File & DB MediaAsset
  const deleteRes = await fetch(uploadEndpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!deleteRes.ok) {
    throw new Error(`Delete failed: ${deleteRes.statusText} - ${await deleteRes.text()}`);
  }
  console.log("✅ STORAGE DELETE PASS");

  await prisma.mediaAsset.delete({ where: { id: mediaAsset.id } });
  console.log("✅ DB MEDIA ASSET DELETE PASS");

  console.log("--- SUPABASE STORAGE FULL TEST PASSED 100% ---");
}

testStorageFull()
  .catch(err => {
    console.error("Storage Test Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
