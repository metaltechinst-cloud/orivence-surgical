// C:\Users\AHMAD\.gemini\antigravity-ide\brain\651e8ef6-e264-40b8-a826-2e77144361cc\scratch\phase1_step4_tests.js
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "orivance-surgical-super-secret-key-1827";

const adminToken = jwt.sign(
  { userId: "user-ahmad123", username: "ahmad123", role: "OWNER" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const authHeaders = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${adminToken}`,
  "Cookie": `admin_token=${adminToken}`
};

async function runStep4Tests() {
  const report = {};
  console.log("=== PHASE 1 - STEP 4: COMPREHENSIVE BACKEND CRUD TEST SUITE ===");

  // Ensure category and product exist for testing relations
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Test Category " + Date.now(), slug: "test-cat-" + Date.now() }
    });
  }

  let product = await prisma.product.findFirst({ where: { categoryId: category.id } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: "Test Surgical Scissor " + Date.now(),
        slug: "test-scissor-" + Date.now(),
        sku: "ORV-SCI-" + Date.now(),
        description: "High precision surgical grade scissors",
        imagesJson: "[]",
        categoryId: category.id
      }
    });
  }

  // =========================================================================
  // 1. PRODUCTS MODULE (Create, Read, Update, Delete)
  // =========================================================================
  console.log("\n1. Testing Products CRUD...");
  try {
    const testSku = "SKU-STEP4-" + Date.now();
    const testName = "Step 4 Surgical Forceps " + Date.now();

    // Create
    const createRes = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: testName,
        sku: testSku,
        description: "Test description for Step 4 CRUD verification",
        categoryId: category.id,
        status: "PUBLISHED"
      })
    });
    const createData = await createRes.json();
    const productId = createData?.data?.id;

    // Verify DB insertion
    const dbProduct = productId ? await prisma.product.findUnique({ where: { id: productId } }) : null;

    // Read
    const readRes = await fetch(`${BASE_URL}/api/products`);
    const readData = await readRes.json();

    // Update
    const updateRes = await fetch(`${BASE_URL}/api/products`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        id: productId,
        name: testName + " (Updated)",
        sku: testSku,
        description: "Updated description",
        categoryId: category.id,
        status: "PUBLISHED"
      })
    });
    const dbProductUpdated = productId ? await prisma.product.findUnique({ where: { id: productId } }) : null;

    // Delete
    const deleteRes = await fetch(`${BASE_URL}/api/products?id=${productId}`, {
      method: "DELETE",
      headers: authHeaders
    });
    const dbProductDeleted = productId ? await prisma.product.findUnique({ where: { id: productId } }) : null;

    report.products = {
      createStatus: createRes.status,
      readStatus: readRes.status,
      updateStatus: updateRes.status,
      deleteStatus: deleteRes.status,
      dbInserted: !!dbProduct,
      dbUpdated: dbProductUpdated?.name?.includes("(Updated)"),
      dbDeleted: dbProductDeleted === null,
      pass: createRes.status === 201 && readRes.ok && updateRes.ok && deleteRes.ok && !!dbProduct && dbProductDeleted === null
    };
  } catch (err) {
    report.products = { pass: false, error: err.message };
  }

  // =========================================================================
  // 2. CATEGORIES MODULE (Create, Read, Update, Delete)
  // =========================================================================
  console.log("\n2. Testing Categories CRUD...");
  try {
    const catName = "Test Cat " + Date.now();

    // Create
    const createRes = await fetch(`${BASE_URL}/api/categories`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: catName, description: "Category for Step 4 CRUD" })
    });
    const createData = await createRes.json();
    const catId = createData?.data?.id;
    const dbCat = catId ? await prisma.category.findUnique({ where: { id: catId } }) : null;

    // Read
    const readRes = await fetch(`${BASE_URL}/api/categories`);

    // Update
    const updateRes = await fetch(`${BASE_URL}/api/categories`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ id: catId, name: catName + " (Updated)", description: "Updated category desc" })
    });
    const dbCatUpdated = catId ? await prisma.category.findUnique({ where: { id: catId } }) : null;

    // Delete
    const deleteRes = await fetch(`${BASE_URL}/api/categories?id=${catId}`, {
      method: "DELETE",
      headers: authHeaders
    });
    const dbCatDeleted = catId ? await prisma.category.findUnique({ where: { id: catId } }) : null;

    report.categories = {
      createStatus: createRes.status,
      readStatus: readRes.status,
      updateStatus: updateRes.status,
      deleteStatus: deleteRes.status,
      dbInserted: !!dbCat,
      dbUpdated: dbCatUpdated?.name?.includes("(Updated)"),
      dbDeleted: dbCatDeleted === null,
      pass: createRes.status === 201 && readRes.ok && updateRes.ok && deleteRes.ok && !!dbCat && dbCatDeleted === null
    };
  } catch (err) {
    report.categories = { pass: false, error: err.message };
  }

  // =========================================================================
  // 3. WEBSITE SETTINGS MODULE (Read, Save, Update)
  // =========================================================================
  console.log("\n3. Testing Website Settings CRUD...");
  try {
    const testPhone = "+49 7461 " + Math.floor(100000 + Math.random() * 899999);

    // Save/Update (PUT)
    const updateRes = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        contact_info: { phone: testPhone, email: "step4@orivence.de" }
      })
    });

    // Verify DB write
    const dbSetting = await prisma.websiteSetting.findUnique({ where: { key: "contact_info" } });

    // Read (GET)
    const readRes = await fetch(`${BASE_URL}/api/settings`);
    const readData = await readRes.json();

    report.websiteSettings = {
      updateStatus: updateRes.status,
      readStatus: readRes.status,
      dbSaved: !!dbSetting && dbSetting.value.includes(testPhone),
      readReturnedValue: readData?.contact_info?.phone === testPhone,
      pass: updateRes.ok && readRes.ok && !!dbSetting && dbSetting.value.includes(testPhone)
    };
  } catch (err) {
    report.websiteSettings = { pass: false, error: err.message };
  }

  // =========================================================================
  // 4. MEDIA MODULE (Upload Image, Read Image, Delete Image)
  // =========================================================================
  console.log("\n4. Testing Media CRUD...");
  try {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const body = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="folder"\r\n\r\n/\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="step4_test_image.jpg"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n` +
      `dummy step4 image content\r\n` +
      `--${boundary}--\r\n`;

    // Upload
    const uploadRes = await fetch(`${BASE_URL}/api/media`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Cookie": `admin_token=${adminToken}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });
    const uploadData = await uploadRes.json();
    const mediaId = uploadData?.data?.[0]?.id;
    const dbMedia = mediaId ? await prisma.mediaAsset.findUnique({ where: { id: mediaId } }) : null;

    // Read
    const readRes = await fetch(`${BASE_URL}/api/media`);

    // Delete
    const deleteRes = await fetch(`${BASE_URL}/api/media?id=${mediaId}`, {
      method: "DELETE",
      headers: authHeaders
    });
    const dbMediaDeleted = mediaId ? await prisma.mediaAsset.findUnique({ where: { id: mediaId } }) : null;

    report.media = {
      uploadStatus: uploadRes.status,
      readStatus: readRes.status,
      deleteStatus: deleteRes.status,
      dbInserted: !!dbMedia,
      dbDeleted: dbMediaDeleted === null,
      pass: uploadRes.status === 201 && readRes.ok && deleteRes.ok && !!dbMedia && dbMediaDeleted === null
    };
  } catch (err) {
    report.media = { pass: false, error: err.message };
  }

  // =========================================================================
  // 5. INQUIRIES MODULE (Create Inquiry, Read Inquiry, Update Inquiry, Delete Inquiry)
  // =========================================================================
  console.log("\n5. Testing Inquiries CRUD...");
  try {
    // Create Inquiry with valid product ID
    const createRes = await fetch(`${BASE_URL}/api/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dr. Step4 Tester",
        country: "Germany",
        email: "tester@step4.de",
        phone: "+49 171 998877",
        message: "Requesting quotation for surgical instruments",
        items: [{ productId: product.id, quantity: 2 }]
      })
    });
    const createData = await createRes.json();
    const inquiryId = createData?.data?.id;
    const dbInquiry = inquiryId ? await prisma.inquiry.findUnique({ where: { id: inquiryId } }) : null;

    // Read Inquiry
    const readRes = await fetch(`${BASE_URL}/api/inquiries`, { headers: authHeaders });

    // Update Inquiry
    const updateRes = await fetch(`${BASE_URL}/api/inquiries`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        id: inquiryId,
        status: "IN_REVIEW",
        internalNotes: "Verified for Step 4 test"
      })
    });
    const dbInquiryUpdated = inquiryId ? await prisma.inquiry.findUnique({ where: { id: inquiryId } }) : null;

    // Delete Inquiry
    const deleteRes = await fetch(`${BASE_URL}/api/inquiries?id=${inquiryId}`, {
      method: "DELETE",
      headers: authHeaders
    });
    const dbInquiryDeleted = inquiryId ? await prisma.inquiry.findUnique({ where: { id: inquiryId } }) : null;

    report.inquiries = {
      createStatus: createRes.status,
      readStatus: readRes.status,
      updateStatus: updateRes.status,
      deleteStatus: deleteRes.status,
      dbInserted: !!dbInquiry,
      dbUpdated: dbInquiryUpdated?.status === "IN_REVIEW",
      dbDeleted: dbInquiryDeleted === null,
      pass: createRes.status === 201 && readRes.ok && updateRes.ok && deleteRes.ok && !!dbInquiry && dbInquiryDeleted === null
    };
  } catch (err) {
    report.inquiries = { pass: false, error: err.message };
  }

  // =========================================================================
  // 6. USERS MODULE (Read User, Update User)
  // =========================================================================
  console.log("\n6. Testing Users CRUD...");
  try {
    let existingUser = await prisma.user.findFirst();
    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: { username: "ahmad123", passwordHash: "dummyhash", role: "OWNER" }
      });
    }

    // Read User
    const readRes = await fetch(`${BASE_URL}/api/admin/users`, { headers: authHeaders });
    const readData = await readRes.json();

    // Update User (Logged-in user credentials update)
    const updateRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ username: existingUser.username })
    });

    report.users = {
      readStatus: readRes.status,
      updateStatus: updateRes.status,
      readReturnedUsers: Array.isArray(readData?.users) && readData.users.length > 0,
      pass: readRes.ok && updateRes.ok && Array.isArray(readData?.users)
    };
  } catch (err) {
    report.users = { pass: false, error: err.message };
  }

  console.log("\n=== STEP 4 COMPREHENSIVE TEST RESULTS ===");
  console.log(JSON.stringify(report, null, 2));

  await prisma.$disconnect();
}

runStep4Tests();
