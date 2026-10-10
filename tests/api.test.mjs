// Tests del API (Vercel Functions) con pool falso. Corre con: npm test
process.env.JWT_KEY = "clave-de-prueba-con-mas-de-32-caracteres-0123456789";
const proj = new URL("../api/", import.meta.url).href;
const { __setPool } = await import(`${proj}_db.js`);
const auth = await import(`${proj}_auth.js`);
const assert = (c, m) => { if (!c) throw new Error(`FAIL: ${m}`); console.log(`ok: ${m}`); };

// --- helpers puros ---
const h = auth.hashPassword("Admin1234");
assert(h.startsWith("pbkdf2-sha256$210000$"), "hash formato C#-compatible");
assert(auth.verifyPassword("Admin1234", h), "verify correcto");
assert(!auth.verifyPassword("otra", h), "verify rechaza");
const s = auth.signToken({ id: "u1", username: "juan", role: "cliente" });
assert(s.token.split(".").length === 3 && s.expiresAtUtc, "JWT firmado");
const me = auth.getAuthUser({ headers: { authorization: `Bearer ${s.token}` } });
assert(me && me.username === "juan" && me.id === "u1", "getAuthUser válido");
assert(auth.getAuthUser({ headers: {} }) === null, "sin token = null");
assert(auth.getAuthUser({ headers: { authorization: "Bearer malo" } }) === null, "token malo = null");
assert(auth.categoryToInt("PC") === 3 && auth.categoryToName(1) === "Videojuegos", "categorías");

// --- pool falso ---
const db = {
  products: [{ Id: "gta", Name: "GTA VI", Price: "4950.00", Category: 1, ImageUrl: "x", Description: "d", Stock: 50, Hidden: false }],
  users: [],
  orders: [],
  refresh: [],
  queries: [],
};
function client() {
  return {
    queries: [],
    async query(t, p) {
      this.queries.push(t.split("\n")[0].trim());
      if (t === "BEGIN" || t === "COMMIT" || t === "ROLLBACK") return { rows: [], rowCount: 0 };
      return fakeQuery(t, p);
    },
    release() {},
  };
}
async function fakeQuery(t, p) {
  db.queries.push(t.split("\n")[0].trim());
  const one = t.replace(/\s+/g, " ");
  if (one.startsWith('SELECT COUNT')) return { rows: [{ total: db.products.length }], rowCount: 1 };
  if (one.startsWith('SELECT "Id","Name","Price"')) {
    if (one.includes("LIMIT")) {
      const lim = p[p.length - 2], off = p[p.length - 1];
      const rows = db.products.slice(off, off + lim);
      return { rows, rowCount: rows.length };
    }
    return { rows: db.products, rowCount: db.products.length };
  }
  if (one.includes('FROM "Users" WHERE lower')) {
    const rows = db.users.filter((u) => u.Username.toLowerCase() === String(p[0]).toLowerCase());
    return { rows, rowCount: rows.length };
  }
  if (one.startsWith('INSERT INTO "Users"')) { db.users.push({ Id: p[0], Username: p[1], PasswordHash: p[2], Role: "cliente" }); return { rows: [], rowCount: 1 }; }
  if (one.startsWith('UPDATE "Products" SET "Stock"')) {
    const r = db.products.find((x) => x.Id === p[1]); r.Stock -= p[0]; return { rows: [], rowCount: 1 };
  }
  if (one.startsWith('INSERT INTO "Products"')) {
    const r = { Id: "new-1", Name: p[0], Price: String(p[1]), Category: p[2], ImageUrl: p[3], Description: p[4], Stock: p[5] };
    db.products.push(r); return { rows: [r], rowCount: 1 };
  }
  if (one.startsWith('UPDATE "Products"')) {
    const r = db.products.find((x) => x.Id === p[6]); if (!r) return { rows: [], rowCount: 0 };
    Object.assign(r, { Name: p[0], Price: String(p[1]), Category: p[2], ImageUrl: p[3], Description: p[4], Stock: p[5] });
    return { rows: [r], rowCount: 1 };
  }
  if (one.startsWith('DELETE FROM "Products"')) {
    const i = db.products.findIndex((x) => x.Id === p[0]); if (i < 0) return { rows: [], rowCount: 0 };
    db.products.splice(i, 1); return { rows: [], rowCount: 1 };
  }
  if (one.includes('FROM "Products" WHERE "Id"=$1 FOR UPDATE')) {
    const rows = db.products.filter((x) => x.Id === p[0]); return { rows, rowCount: rows.length };
  }
  if (one.startsWith('INSERT INTO "Orders"')) { db.orders.push({ id: p[0], by: p[2], total: Number(p[3]) }); return { rows: [], rowCount: 1 }; }
  if (one.startsWith('INSERT INTO "OrderItems"')) return { rows: [], rowCount: 1 };
  if (one.startsWith('SELECT "Id","Total"')) return { rows: [], rowCount: 0 };
  if (one.startsWith('INSERT INTO "RefreshTokens"')) {
    db.refresh.push({ Id: "r", UserId: p[0], TokenHash: p[1], CreatedAtUtc: new Date().toISOString(), ExpiresAtUtc: p[2], RevokedAtUtc: null });
    return { rows: [], rowCount: 1 };
  }
  if (one.includes('FROM "RefreshTokens" WHERE "TokenHash"')) {
    const rows = db.refresh.filter((x) => x.TokenHash === p[0]);
    return { rows, rowCount: rows.length };
  }
  if (one.includes('SET "RevokedAtUtc"=now() WHERE "TokenHash"')) {
    const r = db.refresh.find((x) => x.TokenHash === p[0]);
    if (r) r.RevokedAtUtc = new Date().toISOString();
    return { rows: [], rowCount: 1 };
  }
  if (one.includes('WHERE "UserId"=$1 AND "RevokedAtUtc" IS NULL')) {
    let n = 0;
    for (const r of db.refresh) if (r.UserId === p[0] && !r.RevokedAtUtc) { r.RevokedAtUtc = new Date().toISOString(); n++; }
    return { rows: [], rowCount: n };
  }
  if (one.includes('FROM "Users" WHERE "Id"')) {
    const rows = db.users.filter((u) => u.Id === p[0]);
    return { rows, rowCount: rows.length };
  }
  if (one.includes('FROM "Orders" ORDER BY')) {
    const rows = db.orders.map((o) => ({ Id: o.id, UserId: "u9", Username: o.by, Total: o.total, ShippingZone: "santo-domingo", ShippingCost: 250, CreatedAtUtc: new Date().toISOString() }));
    return { rows, rowCount: rows.length };
  }
  if (one.includes('FROM "OrderItems" WHERE "OrderId"')) {
    return { rows: [{ ProductName: "GTA VI", UnitPrice: 4950, Quantity: 1 }], rowCount: 1 };
  }
  throw new Error("query no contemplada: " + one.slice(0, 80));
}
__setPool({ query: fakeQuery, connect: async () => client() });

function mockReq(method, query = {}, body = {}, headers = {}) {
  return { method, query, body, headers };
}
function mockRes() {
  return { _c: null, _o: null, _h: {}, status(c) { this._c = c; return this; }, json(o) { this._o = o; return this; }, setHeader(k, v) { this._h[k] = v; }, end() {} };
}

// --- products GET ---
const products = (await import(`${proj}products.js`)).default;
{
  const res = mockRes();
  await products(mockReq("GET"), res);
  assert(res._c === 200 && res._o.items[0].category === "Videojuegos" && res._o.items[0].price === 4950, "GET paginado mapea (numeric string->number, int->nombre)");
  assert(res._o.total === 1 && res._o.limit === 12 && res._o.offset === 0, "GET paginado devuelve total/limit/offset");
  assert(String(res._h["Cache-Control"] || "").includes("s-maxage=60"), "GET paginado fija Cache-Control CDN");
}
// --- products POST sin auth ---
{
  const res = mockRes();
  await products(mockReq("POST", {}, { name: "X", price: 1, category: "PC", stock: 1 }), res);
  assert(res._c === 401, "POST sin token = 401");
}
// --- register + duplicado + login ---
const register = (await import(`${proj}auth/register.js`)).default;
const login = (await import(`${proj}auth/login.js`)).default;
{
  let res = mockRes();
  await register(mockReq("POST", {}, { username: "ab", password: "123" }), res);
  assert(res._c === 400, "register corto = 400");
  res = mockRes();
  await register(mockReq("POST", {}, { username: "maria", password: "secreta123" }), res);
  assert(res._c === 201 && res._o.accessToken && res._o.refreshToken, "register 201 con access+refresh");
  res = mockRes();
  await register(mockReq("POST", {}, { username: "MARIA", password: "otra1234" }), res);
  assert(res._c === 409, "register duplicado (insensible a mayúsculas) = 409");
  res = mockRes();
  await login(mockReq("POST", {}, { username: "maria", password: "mal" }), res);
  assert(res._c === 401, "login mal = 401");
  res = mockRes();
  await login(mockReq("POST", {}, { username: "maria", password: "secreta123" }), res);
  assert(res._c === 200 && res._o.username === "maria" && res._o.accessToken && res._o.refreshToken, "login OK con access+refresh");
  var TOK = res._o.accessToken;
  var REF = res._o.refreshToken;
}
// --- refresh: rota, el viejo muere; logout revoca ---
const refresh = (await import(`${proj}auth/refresh.js`)).default;
const logout = (await import(`${proj}auth/logout.js`)).default;
{
  let res = mockRes();
  await refresh(mockReq("POST", {}, { refreshToken: REF }), res);
  assert(res._c === 200 && res._o.accessToken && res._o.refreshToken !== REF, "refresh rota (par nuevo)");
  const REF2 = res._o.refreshToken;
  res = mockRes();
  await refresh(mockReq("POST", {}, { refreshToken: REF }), res);
  assert(res._c === 401, "refresh viejo reutilizado = 401");
  res = mockRes();
  await logout(mockReq("POST", {}, { refreshToken: REF2 }, { authorization: `Bearer ${TOK}` }), res);
  assert(res._c === 204, "logout 204");
  res = mockRes();
  await refresh(mockReq("POST", {}, { refreshToken: REF2 }), res);
  assert(res._c === 401, "refresh tras logout = 401");
}
// --- rate limit: ráfaga con IP propia ---
{
  const ip = { "x-forwarded-for": "9.9.9.9" };
  let last = 0;
  for (let i = 0; i < 21; i++) {
    const res = mockRes();
    await register(mockReq("POST", {}, { username: `rl${i}`, password: "secreta123" }, ip), res);
    last = res._c;
  }
  assert(last === 429, "ráfaga 21 en 1 min = 429 al final");
}
// --- checkout: ok, oversell, sin auth ---
const orders = (await import(`${proj}orders.js`)).default;
{
  let res = mockRes();
  await orders(mockReq("POST", {}, { items: [{ productId: "gta", quantity: 2 }] }), res);
  assert(res._c === 401, "checkout sin token = 401");
  res = mockRes();
  await orders(mockReq("POST", {}, { items: [{ productId: "gta", quantity: 2 }] }, { authorization: `Bearer ${TOK}` }), res);
  assert(res._c === 201 && res._o.total === 9900 + 250 && res._o.shippingCost === 250, "checkout suma envío SD (9900+250)");
  assert(db.products[0].Stock === 48, "stock 50->48");
  res = mockRes();
  await orders(mockReq("POST", {}, { items: [{ productId: "gta", quantity: 1 }], zoneId: "pickup" }, { authorization: `Bearer ${TOK}` }), res);
  assert(res._c === 201 && res._o.total === 4950 && res._o.shippingCost === 0, "pickup sin envío");
  res = mockRes();
  await orders(mockReq("POST", {}, { items: [{ productId: "gta", quantity: 1 }], zoneId: "interior" }, { authorization: `Bearer ${TOK}` }), res);
  assert(res._c === 201 && res._o.total === 4950 + 450, "interior suma 450");
  res = mockRes();
  await orders(mockReq("POST", {}, { items: [{ productId: "gta", quantity: 40 }, { productId: "gta", quantity: 9 }] }, { authorization: `Bearer ${TOK}` }), res);
  assert(res._c === 400 && db.products[0].Stock === 46, "oversell duplicado bloqueado, stock intacto");
}
// --- mine ---
const mine = (await import(`${proj}orders/mine.js`)).default;
{
  const res = mockRes();
  await mine(mockReq("GET", {}, {}, { authorization: `Bearer ${TOK}` }), res);
  assert(res._c === 200, "mine 200 (lista vacía en falso, pero ruta OK)");
}
// --- upload: método, auth, validación ---
const upload = (await import(`${proj}upload.js`)).default;
{
  let res = mockRes();
  await upload(mockReq("GET"), res);
  assert(res._c === 405, "upload GET = 405");
  res = mockRes();
  await upload(mockReq("POST", {}, {}, {}), res);
  assert(res._c === 401, "upload sin token = 401");
}
{
  delete process.env.BLOB_READ_WRITE_TOKEN;
  const adminTok501 = auth.signToken({ id: "a8", username: "admin", role: "admin" }).token;
  const res = mockRes();
  await upload(mockReq("POST", {}, {}, { authorization: `Bearer ${adminTok501}` }), res);
  // 501 antes de parsear: sin Storage no se toca el body
  assert(res._c === 501, "upload sin Storage = 501");
}
const ADMINTOK = auth.signToken({ id: "a9", username: "admin", role: "admin" }).token;
{
  const r2 = mockRes();
  await upload(mockReq("POST", {}, {}, { authorization: `Bearer ${TOK}` }), r2);
  assert(r2._c === 403, "upload como cliente = 403");
  process.env.BLOB_READ_WRITE_TOKEN = "dummy-para-test";
  const { Readable } = await import("node:stream");
  function multipartReq(file) {
    const boundary = "----testboundary123";
    const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.filename}"\r\nContent-Type: ${file.type}\r\n\r\n`);
    const tail = Buffer.from("\r\n--" + boundary + "--\r\n");
    const body = Buffer.concat([head, file.data, tail]);
    const stream = Readable.from([body]);
    stream.headers = { "content-type": `multipart/form-data; boundary=${boundary}`, "content-length": String(body.length) };
    stream.method = "POST";
    stream.url = "/api/upload";
    return stream;
  }
  const authH = { authorization: `Bearer ${ADMINTOK}` };
  function withAuth(stream) {
    stream.query = {};
    stream.body = undefined;
    stream.headers = { ...stream.headers, ...authH };
    return stream;
  }
  let res = mockRes();
  await upload(withAuth(multipartReq({ filename: "a.txt", type: "text/plain", data: Buffer.from("hola") })), res);
  assert(res._c === 400, "upload no-imagen = 400");
  res = mockRes();
  await upload(withAuth(multipartReq({ filename: "big.jpg", type: "image/jpeg", data: Buffer.alloc(5 * 1024 * 1024) })), res);
  assert(res._c === 400, "upload >4MB = 400");
  delete process.env.BLOB_READ_WRITE_TOKEN;
}
// --- registro admin: GET /api/orders (solo rol admin por username) ---
{
  db.orders.push({ id: "o-1", by: "maria", total: 5400 });
  const adminTok = auth.signToken({ id: "a1", username: "admin", role: "admin" }).token;
  const { default: ordersGet } = await import(`${proj}orders.js`);
  let res = mockRes();
  await ordersGet(mockReq("GET", {}, {}, {}), res);
  assert(res._c === 401, "GET orders sin token = 401");
  res = mockRes();
  await ordersGet(mockReq("GET", {}, {}, { authorization: `Bearer ${TOK}` }), res);
  assert(res._c === 403, "GET orders como cliente = 403");
  res = mockRes();
  await ordersGet(mockReq("GET", {}, {}, { authorization: `Bearer ${adminTok}` }), res);
  assert(res._c === 200 && res._o.some((o) => o.username === "maria"), "GET orders como admin ve quién compró");
}
console.log("API_NODE_TESTS_OK");
