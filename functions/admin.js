function redirect(url) {
  return Response.redirect(url, 302);
}

function parseCookie(cookieHeader = "") {
  const out = {};
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (!k) continue;
    out[k] = v.join("=");
  }
  return out;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const cookies = parseCookie(request.headers.get("cookie") || "");
  const token = cookies.vera_session;

  if (!token) {
    return redirect("/login.html");
  }

  const raw = await env.AUTH_KV.get(`session:${token}`);
  if (!raw) {
    return redirect("/login.html");
  }

  return context.next();
}
