# Vera CMS Geliştirme Notları

Bu proje, WordPress benzeri kapsamlı bir içerik yönetim sistemi sunmak için yeniden yapılandırıldı. Aşağıdaki başlıklar altında projenin mimari kararları ve önemli noktalar özetlenmektedir:

- **Site Ayarları**: Global alanlar (logo, favicon, renkler, maksimum genişlik, nav yuvarlaklığı vb.) ve SEO özellikleri `functions/api/settings.js` aracılığıyla yönetilir. `admin/settings.html` bu ayarları düzenlemek için kullanılır.
- **Sayfa Yönetimi**: Her sayfa başlık, slug, SEO başlık/açıklama, bölüm listesi veya tam kod (HTML/CSS/JS) modundan oluşur. `admin/pages.html` sayfa editörü hem görsel bölüm düzenleyicisi hem de tam kod editörü içerir.
- **Menü Yönetimi**: `admin/index.html` menüleri yönetmek için kullanılır; sayfalara veya harici linklere bağlanabilir, üst menü ve sıra belirlenebilir.
- **Ön Yüz**: `index.html` site ayarlarını, menüleri ve sayfa verisini yükleyerek kullanıcıya sunar. Sayfalar standart modda oluşturulmuşsa bölümleri belirlenen ayarlara göre render eder, kod modunda ise HTML/CSS/JS içeriğini iframe içinde izole şekilde gösterir.

Bu notlar, geliştiricilerin projeyi daha rahat anlayıp geliştirebilmeleri için hazırlanmıştır.
