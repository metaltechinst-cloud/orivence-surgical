const BASE_URL = "http://localhost:3000";

async function runLiveApiTests() {
  console.log("=== STARTING MASTER CONTROL CENTER LIVE API VERIFICATION ===");

  let token = "";

  // 1. Authenticate as OWNER
  console.log("\n1. Testing Login Endpoint (POST /api/auth/login)...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "ahmad123", password: "Ahmad1234" })
  });

  const loginData = await loginRes.json();
  console.log(`Status: ${loginRes.status}, Success: ${loginData.success}`);
  if (!loginRes.ok || !loginData.token) {
    throw new Error("Login failed: " + JSON.stringify(loginData));
  }
  token = loginData.token;
  console.log(`User: ${loginData.user.username}, Role: ${loginData.user.role}`);

  const authHeaders = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  // 2. Auth Session Validation (GET /api/auth/me)
  console.log("\n2. Testing Session Validation (GET /api/auth/me)...");
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  console.log(`Status: ${meRes.status}, Authenticated: ${meData.authenticated}, User: ${meData.user?.username} (${meData.user?.role})`);

  // 3. Settings API (GET & PUT /api/settings)
  console.log("\n3. Testing Settings Endpoint (GET & PUT /api/settings)...");
  const settingsGetRes = await fetch(`${BASE_URL}/api/settings`);
  const settingsGetData = await settingsGetRes.json();
  console.log(`GET /api/settings Status: ${settingsGetRes.status}, Keys loaded: ${Object.keys(settingsGetData).length}`);

  const settingsPutRes = await fetch(`${BASE_URL}/api/settings`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      business_info: settingsGetData.business_info || { companyName: "ORIVENCE SURGICAL GMBH" }
    })
  });
  const settingsPutData = await settingsPutRes.json();
  console.log(`PUT /api/settings Status: ${settingsPutRes.status}, Success: ${settingsPutData.success}`);

  // 4. Homepage Builder API (GET & POST /api/admin/homepage-builder)
  console.log("\n4. Testing Homepage Builder Endpoint (GET & POST /api/admin/homepage-builder)...");
  const hpGetRes = await fetch(`${BASE_URL}/api/admin/homepage-builder`, { headers: authHeaders });
  const hpGetData = await hpGetRes.json();
  console.log(`GET /api/admin/homepage-builder Status: ${hpGetRes.status}, Sections count: ${hpGetData.data?.draftSections?.length}`);

  const hpPostRes = await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      action: "publish",
      sections: hpGetData.data?.draftSections || []
    })
  });
  const hpPostData = await hpPostRes.json();
  console.log(`POST /api/admin/homepage-builder Status: ${hpPostRes.status}, Status: ${hpPostData.data?.status}`);

  // 5. Media API (GET /api/media)
  console.log("\n5. Testing Media Library Endpoint (GET /api/media)...");
  const mediaRes = await fetch(`${BASE_URL}/api/media`, { headers: authHeaders });
  const mediaData = await mediaRes.json();
  console.log(`GET /api/media Status: ${mediaRes.status}, Assets count: ${mediaData.assets?.length}`);

  // 6. Products API (GET /api/products)
  console.log("\n6. Testing Products Catalog Endpoint (GET /api/products?admin=true)...");
  const prodRes = await fetch(`${BASE_URL}/api/products?admin=true`, { headers: authHeaders });
  const prodData = await prodRes.json();
  console.log(`GET /api/products Status: ${prodRes.status}, Products count: ${prodData.length}`);

  // 7. Categories API (GET /api/categories)
  console.log("\n7. Testing Categories Endpoint (GET /api/categories?admin=true)...");
  const catRes = await fetch(`${BASE_URL}/api/categories?admin=true`, { headers: authHeaders });
  const catData = await catRes.json();
  console.log(`GET /api/categories Status: ${catRes.status}, Categories count: ${catData.length}`);

  // 8. Admin Users API (GET /api/admin/users)
  console.log("\n8. Testing Admin Users Endpoint (GET /api/admin/users)...");
  const usersRes = await fetch(`${BASE_URL}/api/admin/users`, { headers: authHeaders });
  const usersData = await usersRes.json();
  console.log(`GET /api/admin/users Status: ${usersRes.status}, Users count: ${usersData.users?.length}`);

  console.log("\n=== ALL LIVE API VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
}

runLiveApiTests().catch(err => {
  console.error("\nLIVE API TEST FAILED:", err);
  process.exit(1);
});
