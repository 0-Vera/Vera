export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.AUTH_KV;

  if (request.method === 'GET') {
    const data = await kv.get('pages', { type: 'json' }) || [];
    return new Response(JSON.stringify({ ok: true, pages: data }), { headers: { 'content-type': 'application/json' } });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const pages = (await kv.get('pages', { type: 'json' })) || [];

    const existingIndex = pages.findIndex(p => p.slug === body.slug);

    if (existingIndex >= 0) {
      pages[existingIndex] = body;
    } else {
      pages.push(body);
    }

    await kv.put('pages', JSON.stringify(pages));

    return new Response(JSON.stringify({ ok: true, pages }), { headers: { 'content-type': 'application/json' } });
  }

  return new Response(JSON.stringify({ ok:false }), { status: 400 });
}
