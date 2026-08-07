async function debugApi() {
  const res = await fetch("http://localhost:3000/api/settings");
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log("Body preview:", text.slice(0, 300));
}
debugApi();
