# PROJE NOTLARI

## Proje
Vera sitesi için Cloudflare Pages + Functions + KV tabanlı hafif ama kapsamlı bir CMS yapısı.

## Mimari Hedef
- Site ayarları ile global alanları yönetmek
- Sayfa ayarları ile sayfa bazlı içerik ve yerleşim yönetmek
- Standart içerik modu ve tam kod modu sunmak
- Menü yönetimini sayfalardan bağımsız ama onlarla ilişkili tutmak
- Ön yüzde güvenli ve kontrollü render akışı sağlamak

## İçerik Modelleri

### 1. Site Settings
Global sabit alanlar:
- siteTitle
- siteDescription
- logoText
- logoUrl
- faviconUrl
- headerHtml
- footerHtml
- headCode
- footerCode
- iletişim/sosyal alanları
- global renkler
- container/layout ayarları

### 2. Pages
Her sayfa için:
- title
- slug
- status
- excerpt
- seoTitle
- seoDescription
- mode: standard | code
- template
- content
- html
- css
- js
- settings
- sections[]
- createdAt
- updatedAt

### 3. Menu
Her menü için:
- title
- slug
- type: page | url
- pageSlug
- url
- target
- parentSlug
- visible
- order

## Render Mantığı
- Site kabuğu her zaman global ayarlardan gelir.
- Standart sayfalar güvenli içerik alanı içinde render edilir.
- Kod modu sayfalar iframe `srcdoc` içinde izole edilir.
- Full page code modu aktifse sayfanın içerik alanı yerine tam ekran iframe render edilir.

## Güvenlik / Kontrol
- Admin yazma işlemlerinde session kontrolü var.
- Kod modu içerikleri doğrudan ana DOM içine basılmıyor, iframe içinde render ediliyor.
- GET endpointleri herkese açık, POST/DELETE yetkili oturum istiyor.

## Admin Panel Yapısı
- `/admin/` → Dashboard + menü yönetimi
- `/admin/pages.html` → gelişmiş sayfa editörü
- `/admin/settings.html` → global site ayarları

## Not
Bu sürüm WordPress benzeri kapsamlı ama bağımsız ve hafif CMS yaklaşımıyla hazırlandı.
