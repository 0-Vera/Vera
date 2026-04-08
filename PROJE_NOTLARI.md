# PROJE NOTLARI

## 2026-04-08
- Admin panel ve canlı render omurgası incelendi.
- Kritik route sorunu `functions/[[path]].js` içinde trailing slash kaynaklıydı; `/login/` ve `/login` ayrımı yüzünden giriş kırılıyordu.
- Bu revizyonda mevcut çalışan özellikleri koruyup genişletme yaklaşımı benimsendi.
- İlk güvenli güçlendirme paketi:
  - blok ve menü aksiyon sistemi genişletildi
  - grid yerleşiminde otomatik akış güçlendirildi
  - `pages` GET erişimi yetkiye göre ayrıldı
  - canlı render ile homepage render tarafı yeni aksiyon tiplerini destekleyecek şekilde güncellendi

## Sonraki hedefler
1. Designer ile shared builder mantığını tekleştirmek
2. Header/footer builder ekranını genişletmek
3. Global tema ayarlarını ayrı sekmeye taşımak
4. Reusable section altyapısı eklemek


## 2026-04-08 / Rev2
- Site ayarları ekranı büyütüldü:
  - ayrı sekmeler: genel, header, footer, tema, özel kod, önizleme
  - footer kolonları ve sosyal linkler yönetilebilir hale getirildi
  - CTA stilleri `primary / secondary / ghost` olarak ayrıldı
- `site-settings` veri modeli genişletildi:
  - `header`, `footer`, `theme`, `custom`, `contactAddress`
  - eski alanlarla geriye uyum korunmaya çalışıldı
- Canlı render tarafı yeni global tema ve footer/header ayarlarını kullanacak şekilde genişletildi.
- `functions/[[path]].js` içinde render fonksiyonuna `pages` parametresi açık şekilde geçirildi.


## 2026-04-08 / Rev3
- Tasarım düzenleyici güçlendirildi:
  - yeni blok tipleri: `section`, `features`, `cards`
  - blok çoğaltma eklendi
  - `auto arrange` ile blokları satır bazında otomatik dizme eklendi
- Tasarım düzenleyicide aksiyon seçicisi geliştirildi:
  - buton ve hero aksiyonlarında `page` türü desteklenmeye başlandı
  - sayfa seçimi için mevcut sayfalar liste halinde çekiliyor
- Canlı render tarafı yeni blok tiplerini gösterecek şekilde genişletildi.
- `shared-page-builder.js` yeni blok tipleriyle hizalandı; ileride designer ile tekleştirme için altyapı genişletildi.


## 2026-04-08 / Rev4
- Tasarım düzenleyiciye şablon kütüphanesi eklendi:
  - hazır bölüm şablonları (hero/cta, özellik alanı, SSS, istatistik)
  - seçili bloğu tarayıcı bazlı tekrar kullanılabilir şablon olarak kaydetme
  - kayıtlı şablonu tek tıkla sayfaya ekleme / silme
- Designer inspector geliştirildi:
  - `htmlId`, `cssClass`, görünürlük, tam genişlik alanları eklendi
- Yeni blok tipleri eklendi:
  - `stats`
  - `faq`
- Buton eylem editörü geliştirildi:
  - `page` türü buton bloklarında da seçilebilir oldu
- `shared-page-builder.js` yeni blok tipleri ve gelişmiş buton eylemi ile hizalandı.
- `functions/[[path]].js` canlı tarafta `stats` ve `faq` bloklarını render edecek şekilde genişletildi.
