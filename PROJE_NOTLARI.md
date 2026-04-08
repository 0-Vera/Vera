# PROJE_NOTLARI

## 2026-04-08
- Admin panelin temel refactor aşaması başlatıldı.
- Route tarafında `/login/` sorunu `functions/[[path]].js` normalize edilerek çözüldü.
- Phase 1 kapsamında aşağıdaki hedefler kodlandı:
  - Sayfa veri modeli güçlendirildi.
  - Action sistemi eklendi: `url`, `page`, `anchor`, `email`, `phone`, `none`
  - Grid yerleşimi çakışmaya daha dayanıklı hale getirildi (`grid-auto-flow: dense`)
  - Header / footer / üst CTA alanları `site-settings` üzerinden genişletildi.
  - Menü sistemi link dışında sayfa, anchor, mail ve telefon hedeflerini destekleyecek şekilde genişletildi.
  - `admin/designer.html` yeniden yazıldı; blok listesi + inspector + viewport önizleme ile daha stabil bir düzenleyici oluşturuldu.
  - `admin/shared-page-builder.js` ortak helper çekirdeği olarak güncellendi.
  - Ana sayfa `index.html`, `site:pages` + `site:settings` odaklı yeni render mantığına geçirildi.
- Bilinçli olarak login / verify / logout akışına bu pakette dokunulmadı.
- Sonraki olası aşamalar:
  - Header/footer için daha görsel sürükle-bırak kurgu
  - Yeni blok tipleri (accordion, cards, stats, faq, form)
  - Reusable section / template sistemi
  - Güvenlik sertleştirmeleri (rate limit, public GET ayrımı, CSRF / origin kontrolleri)
