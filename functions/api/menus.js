import { getJsonKV, json, putJsonKV, requireAuth } from "../_lib.js";

const DEFAULT_MENU = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" }
];

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  const items = await getJsonKV(env, "cms:menu:main", DEFAULT_MENU);
  return json({ ok: true, items });
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

  const items = Array.isArray(body.items)
    ? body.items.map((item) => ({
        label: String(item.label || "Menü"),
        href: String(item.href || "/")
      }))
    : DEFAULT_MENU;

  await putJsonKV(env, "cms:menu:main", items);
  return json({ ok: true, items });
}
