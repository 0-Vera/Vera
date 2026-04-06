# Vera Admin Panel – Proje Notları

## Proje Amacı
Cloudflare Pages + Functions + KV kullanan özel admin panel sistemi.

Login akışı:
username + password → email OTP → admin panel.

## Altyapı
- Platform: Cloudflare Pages
- Fonksiyonlar: Cloudflare Pages Functions
- Veri: Cloudflare KV
- KV binding: `AUTH_KV`
- KV namespace: `vera_auth`

## Repo Yapısı
- `index.html`
- `login.html`
- `admin/`
- `functions/api/login.js`
- `functions/api/verify.js`
- `functions/api/menu.js`
- `functions/api/logout.js`
- `functions/api/ping.js`
- `functions/admin.js`
- `_routes.json`
- `wrangler.toml`

## API Endpointleri
- `/api/login`
- `/api/verify`
- `/api/menu`
- `/api/logout`
- `/api/ping`

Test endpoint:
- `/api/ping`
- Beklenen cevap: `{ "ok": true }` veya aktif durum JSON cevabı

## Deploy
- Akış: `GitHub -> Cloudflare Pages`
- Branch: `main`
- Otomatik deploy için repo içinde `wrangler.toml` olmalı
- Bu dosya şu komutla indirildi:
  - `npx wrangler pages download config vera`

## Manuel Deploy (acil durum)
- `npx wrangler pages deploy . --project-name=vera`

## Cloudflare Ayarları
### Environment Variables
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_EMAIL`
- `RESEND_API_KEY`
- `SESSION_SECRET`

### Bindings
- `AUTH_KV`

## Login Akışı
1. username + password
2. `/api/login`
3. email OTP
4. `/api/verify`
5. session cookie
6. admin panel

Session verileri KV içinde tutulur.

## Sorun Giderme
Kontrol sırası:
1. `/api/ping` çalışıyor mu
2. KV binding doğru mu
3. environment variables var mı
4. `wrangler.toml` repo içinde mi
5. Cloudflare deploy log

## Planlanan Güvenlik Geliştirmeleri
Henüz eklenmedi:
- login rate limit
- OTP deneme limiti
- brute force koruması
- session timeout
- logout sertleştirme

## Çalışma Kuralı
Her çalışmaya başlamadan önce bu dosyayı kontrol et ve gerekirse güncelle.
