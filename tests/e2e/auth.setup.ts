// Global setup: 1 solo POST /api/auth/login (el middleware limita
// /api/auth/* a 5/min por IP) y vuelca la cookie a storageState para
// que los tests de admin no tengan que loguearse por formulario.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const BASE = "http://127.0.0.1:3101";
const STATE = join(__dirname, ".auth", "state.json");

async function loginOnce(): Promise<Response> {
  return fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@sillage.com", password: "SillageAdmin#2026" }),
  });
}

export default async function globalSetup() {
  let res = await loginOnce();
  if (res.status === 429) {
    // Ventana de 60s del rate limiter: espera acotada y un solo reintento.
    await new Promise((r) => setTimeout(r, 65000));
    res = await loginOnce();
  }
  if (!res.ok) throw new Error(`globalSetup login falló: HTTP ${res.status}`);
  const setCookie = res.headers.get("set-cookie") ?? "";
  const token = setCookie.split(";")[0]?.split("=")[1];
  if (!token) throw new Error("globalSetup: sin cookie auth_token en la respuesta");
  mkdirSync(dirname(STATE), { recursive: true });
  writeFileSync(
    STATE,
    JSON.stringify({
      cookies: [{ name: "auth_token", value: token, domain: "127.0.0.1", path: "/" }],
      origins: [],
    }),
  );
  console.log("globalSetup: storageState escrito");
}
