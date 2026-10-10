// Verifica guards de método. Corre con: node --import tsx/esm tests/methods.test.mjs
const proj = new URL("../api/", import.meta.url).href;
const assert = (c, m) => { if (!c) throw new Error(`FAIL: ${m}`); console.log(`ok: ${m}`); };
function mockRes() {
  return { _c: null, _o: null, status(c) { this._c = c; return this; }, json(o) { this._o = o; return this; }, setHeader() {}, end() {} };
}
for (const f of ["auth/register.js", "auth/login.js", "auth/me.js"]) {
  const h = (await import(`${proj}${f}`)).default;
  const res = mockRes();
  await h({ method: "GET", query: {}, body: {}, headers: {} }, res);
  console.log(`${f} con GET -> ${res._c} ${JSON.stringify(res._o)}`);
}
console.log("METHODS_OK");
