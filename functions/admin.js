import { getSession } from "./_lib.js";

function redirect(url) {
  return Response.redirect(url, 302);
}

function html() {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Vera Kurumsal CMS</title>
<style>
:root{--bg:#0f172a;--panel:#111827;--soft:#1f2937;--text:#e5e7eb;--muted:#9ca3af;--brand:#3b82f6}
*{box-sizing:border-box} body{margin:0;font-family:Inter,Arial,sans-serif;background:var(--bg);color:var(--text)}
.layout{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
aside{background:#020617;padding:18px;border-right:1px solid #1f2937}
.logo{font-weight:800;font-size:20px;margin-bottom:18px;color:#60a5fa}
.navbtn{display:block;width:100%;text-align:left;background:#0b1220;color:#cbd5e1;border:1px solid #1f2937;padding:10px;border-radius:10px;margin-bottom:8px;cursor:pointer}
.navbtn.active{background:#1d4ed8;color:#fff}
main{padding:22px;overflow:auto}
.card{background:var(--panel);border:1px solid #334155;border-radius:14px;padding:16px;margin-bottom:14px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
label{display:block;color:#cbd5e1;font-size:13px;margin:8px 0 4px}
input,textarea,select{width:100%;background:#030712;border:1px solid #334155;color:#e5e7eb;border-radius:8px;padding:10px}
textarea{min-height:120px;resize:vertical}
button{background:var(--brand);border:0;color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;font-weight:700}
button.secondary{background:#334155} .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.table{width:100%;border-collapse:collapse}.table th,.table td{border-bottom:1px solid #334155;padding:8px;text-align:left}
.muted{color:var(--muted)} .hidden{display:none}
@media(max-width:940px){.layout{grid-template-columns:1fr}aside{position:sticky;top:0;z-index:5}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="layout">
<aside>
  <div class="logo">Vera CMS Pro</div>
  <button class="navbtn active" data-tab="dashboard">Dashboard</button>
  <button class="navbtn" data-tab="pages">Sayfalar</button>
  <button class="navbtn" data-tab="content">İçerik</button>
  <button class="navbtn" data-tab="menus">Menüler</button>
  <button class="navbtn" data-tab="media">Medya</button>
  <button class="navbtn" data-tab="settings">Ayarlar</button>
  <button class="navbtn" data-tab="code">Kod Müdahale</button>
  <button class="navbtn" id="logoutBtn">Çıkış</button>
</aside>
<main>
  <section data-view="dashboard" class="card">
    <h2>Kurumsal CMS Yönetim Paneli</h2>
    <p class="muted">WordPress benzeri içerik yönetimi, menüler, medya, stiller, butonlar ve ham kod düzenleme özellikleri tek panelde.</p>
    <div id="summary" class="row"></div>
  </section>

  <section data-view="pages" class="card hidden">
    <h2>Sayfa Yönetimi</h2>
    <div class="grid">
      <div>
        <label>Başlık</label><input id="p_title" />
        <label>Slug</label><input id="p_slug" placeholder="ornek-sayfa" />
        <label>Durum</label><select id="p_status"><option value="published">Yayında</option><option value="draft">Taslak</option></select>
        <label>SEO Başlık</label><input id="p_seo_title" />
        <label>SEO Açıklama</label><textarea id="p_seo_desc"></textarea>
      </div>
      <div>
        <label>HTML İçerik</label><textarea id="p_html" style="min-height:170px"></textarea>
        <label>Sayfaya özel CSS</label><textarea id="p_css"></textarea>
        <label>Sayfaya özel JS</label><textarea id="p_js"></textarea>
      </div>
    </div>
    <div class="row" style="margin-top:10px">
      <button id="savePage">Sayfayı Kaydet</button>
      <button id="deletePage" class="secondary">Sayfayı Sil</button>
    </div>
    <h3>Mevcut Sayfalar</h3>
    <table class="table"><thead><tr><th>Başlık</th><th>Slug</th><th>Durum</th><th>İşlem</th></tr></thead><tbody id="pageRows"></tbody></table>
  </section>

  <section data-view="content" class="card hidden">
    <h2>İçerik Tipleri / Yazılar</h2>
    <div class="grid">
      <div>
        <label>Tip</label><input id="c_type" placeholder="blog, duyuru, ürün" />
        <label>Başlık</label><input id="c_title" />
        <label>Etiketler (virgülle)</label><input id="c_tags" />
        <label>Bağlantı</label><input id="c_link" />
      </div>
      <div>
        <label>İçerik</label><textarea id="c_body" style="min-height:190px"></textarea>
        <label><input type="checkbox" id="c_featured" /> Öne çıkar</label>
      </div>
    </div>
    <button id="saveContent">İçeriği Kaydet</button>
    <h3>İçerik Listesi</h3>
    <div id="contentRows"></div>
  </section>

  <section data-view="menus" class="card hidden">
    <h2>Menü Yönetimi</h2>
    <p class="muted">Her satır: Menü Metni | /baglanti</p>
    <textarea id="menuText" style="min-height:200px"></textarea>
    <button id="saveMenu">Menüyü Kaydet</button>
  </section>

  <section data-view="media" class="card hidden">
    <h2>Medya Kütüphanesi (URL tabanlı)</h2>
    <div class="grid">
      <div>
        <label>Dosya adı</label><input id="m_name" />
        <label>Dosya URL</label><input id="m_url" placeholder="https://..." />
      </div>
      <div>
        <label>MIME türü</label><input id="m_mime" placeholder="image/png" />
        <label>Boyut (bytes)</label><input id="m_size" type="number" />
      </div>
    </div>
    <button id="saveMedia">Medya Kaydet</button>
    <div id="mediaRows"></div>
  </section>

  <section data-view="settings" class="card hidden">
    <h2>Site Ayarları</h2>
    <label>Site Başlığı</label><input id="s_title" />
    <label>Açıklama</label><textarea id="s_desc"></textarea>
    <div class="grid">
      <div><label>Logo URL</label><input id="s_logo" /></div>
      <div><label>Ana Renk</label><input id="s_primary" /></div>
    </div>
    <label>İkincil Renk</label><input id="s_secondary" />
    <label>Global CSS</label><textarea id="s_css"></textarea>
    <label>Global JS</label><textarea id="s_js"></textarea>
    <button id="saveSettings">Ayarları Kaydet</button>
  </section>

  <section data-view="code" class="card hidden">
    <h2>Gelişmiş Kod Müdahale</h2>
    <p class="muted">Bu alanlar gerçek sayfa çıktısına doğrudan enjekte edilir.</p>
    <label>Header HTML</label><textarea id="code_header"></textarea>
    <label>Footer HTML</label><textarea id="code_footer"></textarea>
    <label>Body Sonu Enjeksiyon</label><textarea id="code_bottom"></textarea>
    <button id="saveCode">Kodları Kaydet</button>
  </section>
</main>
</div>
<script>
const views=[...document.querySelectorAll('[data-view]')];
const nav=[...document.querySelectorAll('.navbtn[data-tab]')];
let selectedSlug='';

function show(tab){views.forEach(v=>v.classList.toggle('hidden',v.dataset.view!==tab));nav.forEach(n=>n.classList.toggle('active',n.dataset.tab===tab));}
nav.forEach(b=>b.onclick=()=>show(b.dataset.tab));

async function api(path,options={}){const r=await fetch(path,{headers:{'content-type':'application/json'},...options});return r.json();}

function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}

async function loadPages(){
 const {pages=[]}=await api('/api/pages');
 const rows=document.getElementById('pageRows');
 rows.innerHTML=pages.map(p=>`<tr><td>${esc(p.title)}</td><td>${esc(p.slug)}</td><td>${esc(p.status)}</td><td><button onclick="editPage('${p.slug}')">Düzenle</button></td></tr>`).join('');
 document.getElementById('summary').innerHTML='<span>Sayfa: '+pages.length+'</span>';
 window._pages=pages;
}
window.editPage=function(slug){const p=(window._pages||[]).find(x=>x.slug===slug); if(!p) return; selectedSlug=slug; p_title.value=p.title||''; p_slug.value=p.slug||''; p_status.value=p.status||'published'; p_html.value=p.html||''; p_css.value=p.css||''; p_js.value=p.js||''; p_seo_title.value=p.seoTitle||''; p_seo_desc.value=p.seoDescription||''; show('pages');}

savePage.onclick=async()=>{const body={slug:selectedSlug||p_slug.value,title:p_title.value,status:p_status.value,html:p_html.value,css:p_css.value,js:p_js.value,seoTitle:p_seo_title.value,seoDescription:p_seo_desc.value}; await api('/api/pages',{method:'POST',body:JSON.stringify(body)}); selectedSlug=''; loadPages(); alert('Sayfa kaydedildi');}
deletePage.onclick=async()=>{const slug=p_slug.value.trim(); if(!slug) return alert('Slug girin'); await fetch('/api/pages?slug='+encodeURIComponent(slug),{method:'DELETE'}); selectedSlug=''; loadPages(); alert('Silindi');}

saveSettings.onclick=async()=>{await api('/api/settings',{method:'POST',body:JSON.stringify({siteTitle:s_title.value,siteDescription:s_desc.value,logoUrl:s_logo.value,primaryColor:s_primary.value,secondaryColor:s_secondary.value,customCss:s_css.value,customJs:s_js.value})}); alert('Ayarlar kaydedildi');}
async function loadSettings(){const r=await api('/api/settings'); const s=r.settings||{}; s_title.value=s.siteTitle||''; s_desc.value=s.siteDescription||''; s_logo.value=s.logoUrl||''; s_primary.value=s.primaryColor||''; s_secondary.value=s.secondaryColor||''; s_css.value=s.customCss||''; s_js.value=s.customJs||'';}

saveMenu.onclick=async()=>{const items=menuText.value.split('\n').map(x=>x.trim()).filter(Boolean).map(line=>{const [label,href]=line.split('|').map(x=>x.trim()); return {label:label||'Menü',href:href||'/'};}); await api('/api/menus',{method:'POST',body:JSON.stringify({items})}); alert('Menü kaydedildi');}
async function loadMenu(){const r=await api('/api/menus'); menuText.value=(r.items||[]).map(i=>`${i.label} | ${i.href}`).join('\n');}

saveMedia.onclick=async()=>{await api('/api/media',{method:'POST',body:JSON.stringify({fileName:m_name.value,url:m_url.value,mimeType:m_mime.value,size:Number(m_size.value||0)})}); loadMedia();}
async function loadMedia(){const r=await api('/api/media'); mediaRows.innerHTML=(r.assets||[]).map(a=>`<div class='card'><b>${esc(a.fileName)}</b><div>${esc(a.url)}</div><small>${esc(a.mimeType)} - ${a.size} bytes</small></div>`).join('');}

saveContent.onclick=async()=>{await api('/api/content',{method:'POST',body:JSON.stringify({type:c_type.value,title:c_title.value,body:c_body.value,tags:c_tags.value.split(',').map(t=>t.trim()).filter(Boolean),featured:c_featured.checked,link:c_link.value})}); loadContent(); alert('İçerik kaydedildi');}
async function loadContent(){const r=await api('/api/content'); contentRows.innerHTML=(r.entries||[]).map(e=>`<div class='card'><b>${esc(e.title)}</b> <small>${esc(e.type)}</small><div>${esc((e.body||'').slice(0,180))}</div><div class='muted'>Etiket: ${esc((e.tags||[]).join(', '))}</div></div>`).join('');}

saveCode.onclick=async()=>{await api('/api/code',{method:'POST',body:JSON.stringify({headerHtml:code_header.value,footerHtml:code_footer.value,globalHtmlBeforeBodyEnd:code_bottom.value})}); alert('Kod kayıt edildi');}
async function loadCode(){const r=await api('/api/code');const c=r.code||{}; code_header.value=c.headerHtml||''; code_footer.value=c.footerHtml||''; code_bottom.value=c.globalHtmlBeforeBodyEnd||'';}

logoutBtn.onclick=async()=>{await api('/api/logout',{method:'POST'}); location.href='/login.html';}

(async()=>{await Promise.all([loadPages(),loadSettings(),loadMenu(),loadMedia(),loadContent(),loadCode()]);})();
</script>
</body></html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await getSession(request, env);
  if (!session) {
    return redirect("/login.html");
  }

  return new Response(html(), {
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
