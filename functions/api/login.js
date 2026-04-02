async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,"0")).join("");
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  const username = body.username;
  const password = body.password;

  if (username !== env.ADMIN_USERNAME) {
    return new Response(JSON.stringify({ ok:false, error:"Kullanıcı adı yanlış" }), { status:401 });
  }

  const hash = await sha256(password);

  if (hash !== env.ADMIN_PASSWORD_HASH) {
    return new Response(JSON.stringify({ ok:false, error:"Şifre yanlış" }), { status:401 });
  }

  const code = Math.floor(100000 + Math.random()*900000).toString();

  await env.AUTH_KV.put(
    "login_code",
    code,
    { expirationTtl: 300 }
  );

  return new Response(JSON.stringify({
    ok:true,
    message:"Kod üretildi",
    code:code
  }));
}
