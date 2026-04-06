import { getJsonKV, json, putJsonKV, requireAuth } from "../_lib.js";

const DEFAULT_SETTINGS = {
  siteTitle: "Vera Kurumsal Site",
  siteDescription: "Kurumsal içerik yönetimi",
  logoUrl: "",
  primaryColor: "#2563eb",
  secondaryColor: "#0f172a",
  customCss: "",
  customJs: ""
};

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }
  const settings = await getJsonKV(env, "cms:settings", DEFAULT_SETTINGS);
  return json({ ok: true, settings });
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Geçersiz JSON" }, 400);
  }

  const next = {
    ...DEFAULT_SETTINGS,
    ...body,
    siteTitle: String(body.siteTitle || DEFAULT_SETTINGS.siteTitle).slice(0, 120),
    siteDescription: String(body.siteDescription || "").slice(0, 240),
    customCss: String(body.customCss || ""),
    customJs: String(body.customJs || "")
  };

  await putJsonKV(env, "cms:settings", next);
  return json({ ok: true, settings: next });
}
