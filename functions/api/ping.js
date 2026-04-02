export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "Functions aktif",
      time: new Date().toISOString()
    }),
    {
      headers: {
        "content-type": "application/json; charset=utf-8"
      }
    }
  );
}