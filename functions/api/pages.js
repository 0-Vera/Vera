<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Admin Panel</title>
<style>
    * { box-sizing: border-box; font-family: Arial, sans-serif; }
    body { margin:0; background:#f9fafb; color:#1f2937; display:flex; min-height:100vh; }
    .sidebar { width:260px; background:#ffffff; border-right:1px solid #e5e7eb; padding:20px; }
    .sidebar h2 { margin-top:0; font-size:22px; color:#1f2937; }
    .sidebar h3 { font-size:15px; margin-top:20px; margin-bottom:10px; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; }
    .sidebar a, .sidebar .nav-link {
        display:block;
        color:#374151;
        text-decoration:none;
        margin-bottom:8px;
        padding:10px 12px;
        border-radius:8px;
        transition:background .2s,color .2s;
        cursor:pointer;
    }
    .sidebar a:hover, .sidebar .nav-link:hover, .sidebar .active-nav {
        background:#e0f2fe;
        color:#111827;
    }
    .content { flex:1; padding:24px; }
    .card {
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-radius:14px;
        padding:20px;
        margin-bottom:20px;
        box-shadow:0 1px 2px rgba(0,0,0,.05);
    }
    label { display:block; margin-top:12px; margin-bottom:6px; color:#4b5563; }
    input, textarea {
        width:100%;
        padding:10px 12px;
        border-radius:10px;
        border:1px solid #d1d5db;
        background:#f9fafb;
        color:#111827;
        resize:vertical;
    }
    textarea { min-height:220px; }
    button {
        margin-top:12px;
        padding:10px 14px;
        background:#2563eb;
        color:#fff;
        font-weight:bold;
        border:none;
        border-radius:10px;
        cursor:pointer;
    }
    .secondary-btn {
        background:#e5e7eb;
        color:#111827;
        margin-left:8px;
    }
    ul { list-style:none; padding:0; margin:0; }
    li {
        padding:10px 12px;
        cursor:pointer;
        border-radius:8px;
        color:#374151;
        margin-bottom:8px;
        border:1px solid #e5e7eb;
    }
    li.active, li:hover { background:#eff6ff; border-color:#93c5fd; }
    .actions { display:flex; gap:10px; flex-wrap:wrap; }
    .muted { color:#6b7280; font-size:14px; }
</style>
</head>
<body>
<div class="sidebar">
    <h2>CMS Panel</h2>

    <h3>Navigasyon</h3>
    <a href="/admin/" class="active-nav">Menü Yönetimi</a>
    <a href="/admin/pages.html">Sayfa Yönetimi</a>
    <a href="/" target="_blank">Siteyi Aç</a>
    <a id="logoutLink" href="#">Çıkış Yap</a>

    <h3>Menüler</h3>
    <ul id="menuList"></ul>
    <button id="newMenuBtn">Yeni Menü Ekle</button>
</div>

<div class="content">
    <div class="card">
        <h1>Menü Düzenle</h1>
        <p class="muted">Ana sitede görünecek menü öğelerini buradan yönetebilirsin.</p>

        <form id="menuForm">
            <label for="title">Başlık</label>
            <input id="title" type="text" placeholder="Menü başlığı" />

            <label for="slug">Slug</label>
            <input id="slug" type="text" placeholder="menu-slug" />

            <label for="content">İçerik</label>
            <textarea id="content" rows="6" placeholder="Sayfa içeriği"></textarea>

            <div class="actions">
                <button type="submit">Kaydet</button>
                <button type="button" class="secondary-btn" id="clearBtn">Temizle</button>
            </div>
        </form>
    </div>
</div>

<script>
let menus = [];
let currentIndex = -1;

async function loadMenus() {
    try {
        const res = await fetch('/api/menu');
        const data = await res.json();

        if (data.ok) {
            menus = data.menus || [];
            renderMenuList();
        } else {
            console.error(data);
        }
    } catch (err) {
        console.error(err);
    }
}

function renderMenuList() {
    const list = document.getElementById('menuList');
    list.innerHTML = '';

    if (!menus.length) {
        const empty = document.createElement('li');
        empty.textContent = 'Henüz menü yok';
        empty.style.cursor = 'default';
        list.appendChild(empty);
        return;
    }

    menus.forEach((m, i) => {
        const li = document.createElement('li');
        li.textContent = m.title;
        if (i === currentIndex) li.classList.add('active');

        li.addEventListener('click', () => {
            currentIndex = i;
            fillForm(m);
            renderMenuList();
        });

        list.appendChild(li);
    });
}

function fillForm(menu) {
    document.getElementById('title').value = menu.title || '';
    document.getElementById('slug').value = menu.slug || '';
    document.getElementById('content').value = menu.content || '';
}

function clearForm() {
    currentIndex = -1;
    document.getElementById('title').value = '';
    document.getElementById('slug').value = '';
    document.getElementById('content').value = '';
    renderMenuList();
}

document.getElementById('menuForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const slug = document.getElementById('slug').value.trim();
    const content = document.getElementById('content').value;

    if (!title || !slug) {
        alert('Başlık ve slug gereklidir.');
        return;
    }

    const body = { title, slug, content };

    try {
        const res = await fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (data.ok) {
            menus = data.menus || [];
            currentIndex = menus.findIndex((m) => m.slug === slug);
            renderMenuList();

            if (currentIndex >= 0) {
                fillForm(menus[currentIndex]);
            }

            alert('Menü kaydedildi.');
        } else {
            alert(data.error || 'Hata oluştu.');
        }
    } catch (err) {
        alert('Hata oluştu.');
    }
});

document.getElementById('newMenuBtn').addEventListener('click', clearForm);
document.getElementById('clearBtn').addEventListener('click', clearForm);

document.getElementById('logoutLink').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (err) {}
    window.location.href = '/login.html';
});

loadMenus();
</script>
</body>
</html>
