import { getJsonKV, safeSlug } from "./_lib.js";

function renderTemplate({ settings, menu, page, code }) {
  const menuHtml = menu
    .map((item) => `<a href="${item.href}">${item.label}</a>`)
    .join(" ");

  const title = page?.seoTitle || page?.title || settings.siteTitle;
  const description = page?.seoDescription || settings.siteDescription || "";

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<style>
:root{--p:${settings.primaryColor || "#2563eb"};--s:${settings.secondaryColor || "#0f172a"}}
body{margin:0;font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a}
header{background:var(--s);color:white;padding:16px 20px;display:flex;justify-content:space-between;gap:20px;align-items:center}
nav a{color:white;text-decoration:none;margin-right:12px;font-weight:600}
main{max-width:1100px;margin:28px auto;padding:0 18px}
footer{background:#0f172a;color:#cbd5e1;padding:24px 20px;margin-top:40px}
button,.btn{background:var(--p);color:white;border:none;border-radius:8px;padding:10px 14px;font-weight:700}
${settings.customCss || ""}
${page?.css || ""}
</style>
${code.headerHtml || ""}
</head>
<body>
<header>
<div>${settings.logoUrl ? `<img src="${settings.logoUrl}" style="max-height:42px" alt="logo" />` : `<strong>${settings.siteTitle}</strong>`}</div>
<nav>${menuHtml}</nav>
</header>
<main>
${page?.html || `<h1>${settings.siteTitle}</h1><p>${settings.siteDescription || ""}</p>`}
</main>
<footer>${code.footerHtml || `<small>© ${new Date().getFullYear()} ${settings.siteTitle}</small>`}</footer>
${code.globalHtmlBeforeBodyEnd || ""}
<script>${settings.customJs || ""}\n${page?.js || ""}</script>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (
    path.startsWith("/api/") ||
    path.startsWith("/admin") ||
    path === "/login.html" ||
    path.startsWith("/functions")
  ) {
    return context.next();
  }

  const settings = await getJsonKV(env, "cms:settings", {
    siteTitle: "Vera Kurumsal Site",
    siteDescription: "Kurumsal içerik yönetimi",
    logoUrl: "",
    primaryColor: "#2563eb",
    secondaryColor: "#0f172a",
    customCss: "",
    customJs: ""
  });
  const menu = await getJsonKV(env, "cms:menu:main", [
    { label: "Ana Sayfa", href: "/" }
  ]);
  const code = await getJsonKV(env, "cms:code", {
    headerHtml: "",
    footerHtml: "",
    globalHtmlBeforeBodyEnd: ""
  });

  const slug = path === "/" ? "anasayfa" : safeSlug(path.replace(/^\//, ""));
  const page = await getJsonKV(env, `cms:page:${slug}`, null);

  if (!page && path !== "/") {
    return new Response("404 - Sayfa bulunamadı", { status: 404 });
  }

  return new Response(renderTemplate({ settings, menu, page, code }), {
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
