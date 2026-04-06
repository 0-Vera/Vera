import { getJsonKV, json, putJsonKV, requireAuth } from "../_lib.js";

const DEFAULT_CODE = {
  headerHtml: "",
  footerHtml: "",
  globalHtmlBeforeBodyEnd: ""
};

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }
  const code = await getJsonKV(env, "cms:code", DEFAULT_CODE);
  return json({ ok: true, code });
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

  const code = {
    headerHtml: String(body.headerHtml || ""),
    footerHtml: String(body.footerHtml || ""),
    globalHtmlBeforeBodyEnd: String(body.globalHtmlBeforeBodyEnd || "")
  };

  await putJsonKV(env, "cms:code", code);
  return json({ ok: true, code });
}
