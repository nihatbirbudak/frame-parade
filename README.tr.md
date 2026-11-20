# Frame Parade

Yapay zekâ ajanlarıyla çalışan video stüdyosu. Tek prompt ile kurulum.

[English](README.md)

**Durum: temiz klasör kurulumu doğrulandı (Windows, 20 Kasım 2026; macOS ve Linux henüz denenmedi).** Denemede Node.js, Git ve Chrome önceden kuruluydu; yerel sessiz örnek üretildi. Eksik araçların kurulumu bu denemede sınanmadı.

## Ne işe yarar?

Varsayılan olarak aynı model metinleri ve görselleri hazırlar; sonucu siz incelersiniz. İkinci model isteğe bağlıdır.

Kanalınıza ait metinleri, görüntüleri, sesleri ve üretim kararlarını aynı proje içinde düzenlemenizi amaçlar. Claude Code size kanalınızı ve çalışma biçiminizi sorar; cevaplardan video kimliği ile görev dağılımını oluşturur. Sonra kanal adınızla kısa bir deneme videosu hazırlar.

Başlangıç kapsamı:

- Ders, açıklayıcı anlatım ve proje videoları için metin → sahne → animasyon → kontrol akışı.
- Yatay 16:9 ve dikey 9:16 şablonlar; başlık, kart, sayaç, ok ve düğme gibi temel öğeler.
- Metin yazarı, tasarım/üretim ve kontrol sorumluluklarını ayıran rol şablonları.
- İsteğe bağlı seslendirme, YouTube yükleme ve ölçüm araçları.

Kendi metinlerinizi, çekimlerinizi ve kimliğinizi eklersiniz. Dağıtılan kitte hazır kanal, kişisel ders arşivi, ses hesabı veya API anahtarı bulunmaz.

## Neler gerekir?

| Araç | Ne için? |
|---|---|
| [Claude Code](https://code.claude.com/docs/en/setup) ve kullanılabilir erişim | Kurulum görüşmesi ve proje içinde çalışma. |
| Node.js 20+ ve npm | package.json gereksinimi; denetimler KURULUM.md içinde. |
| ffmpeg-static (npm bağımlılıklarıyla kurulur) | Render için ffmpeg sağlar. ffprobe ayrıdır; sessiz örnek için gerekli değildir. |
| Google Chrome veya kitin algıladığı uyumlu bir tarayıcı | Animasyonları masaüstünü kullanmadan işleme; bildirilen denemede Chrome kullanıldı. |
| Git | Tek prompt akışında depoyu indirme. |
| İnternet ve boş disk alanı | Depo/bağımlılık indirme ve yerel çıktı dosyaları. Gereksinim denetimde raporlanır. |

Node.js bu kitin araçları içindir; Claude Code'un bütün kurulum yöntemleri için zorunlu olduğu anlamına gelmez. Claude Code'un kendi kurulum koşulları için yukarıdaki resmi rehberi kullanın.

**İsteğe bağlı:** Yapay ses için ElevenLabs; hesap üzerinden yükleme/ölçüm için YouTube API ve kullanıcı yetkilendirmesi; metin için ikinci model; modeller arası iletişim için ajan postası. Bunlar olmadan sessiz yerel deneme hedeflenir. Claude Code ve seçilen dış hizmetlerin kullanımı kendi hesap ve kota koşullarınıza bağlıdır; kit bunları sağlamaz.

## Tek prompt ile kurulum

Ücretli müşteri işi lisans dışı; ayrıntı [LICENSE §4](LICENSE).

1. Boş bir proje klasörü oluşturun ve Claude Code'u burada açın.
2. Aşağıda bağlantısı bulunan Frame Parade deposunu açın ve kurulum metnini Claude Code'a yapıştırın. Depoya erişilemiyorsa durup erişimi kontrol edin; başka bir indirme kaynağı seçmeyin.
3. Soruları sırayla yanıtlayın. İsteğe bağlıları atlayabilir, önerilen stili değiştirebilirsiniz.
4. Kanal adınızla üretilen 10 saniyelik dikey denemeyi inceleyin. Ses hazır değilse deneme sessiz olacaktır.

```text
Bu boş proje klasörüne https://github.com/nihatbirbudak/frame-parade deposundaki Frame Parade video kitini kur.

Yapay zekâya yeni başlayan biri olduğumu varsay. Her adımı sade dille açıkla, bir seferde tek iş iste ve teknik terimleri ilk kullandığında açıkla. Ücretli müşteri işi lisans dışı; ayrıntı LICENSE §4.

1. Hedef boş değilse veya depoya erişilemiyorsa dur ve durumu açıkla. Dosya silme, üzerine yazma veya başka depo seçme. Git yoksa kurulum yolunu göster; kurulduktan sonra devam et. Depoyu bu klasöre indir; önce depo kökündeki KURULUM.md, CLAUDE.md, KURALLAR.md ve LICENSE dosyalarını oku. Eksik rehber veya çelişki varsa varsayarak ilerleme.
2. İşletim sistemi, boş disk, Node.js 20+/npm, Chrome veya uyumlu bir tarayıcı ve Git gereksinimlerini denetle. Paketle gelen ffmpeg kurulumunu ve kontrolünü rehbere göre yap; ffprobe yalnız seçilen sonraki bir iş akışı gerektirirse denetlenir. Eksikleri ve yapılacak kurulumu göster; sistem yazılımı kurmadan veya paket kurulum betiklerini çalıştırmadan önce onayımı al. Yalnız rehberdeki mevcut komutları kullan; komut uydurma.
3. KURULUM.md akışında Türkçe için kurulum/sorular.md, İngilizce için kurulum/questions.md kullan; kullanıcının dilinde, bir mesajda tek konu sor. Daha önce verdiğim cevabı yeniden isteme. İsteğe bağlıları atlayabilirim; eksik tercihler için önerini açıkça belirt. Varsayılan olarak metin ve üretimi aynı model üstlensin, ben inceleyeyim; ikinci model ve ajan postası daha sonra seçebileceğim eklerdir. Mevcut çalışma ayarlarını kanal.json içine; kimlik, referans ve rolleri yonetim/VIDEO-KIMLIGI.md, yonetim/referanslar.md ve yonetim/ROLLER.md içine kaydet. Gerçek şemaya uy; JSON alanı uydurma. Kaynak dosyalarımı değiştirme.
4. Verdiğim referansları erişebildiğin ölçüde incele; erişemediğini belirt. Kısa bir stil kartı sun ve onayımı al. Anahtar veya jeton isteme, sohbete ya da günlüğe yazma; .env alanlarını göster, değerleri ben yerel olarak gireyim. Gizli dosyaları Git'e ekleme. Masaüstümde fare, klavye veya ekran kaydı kullanma; görselleri headless üret.
5. Onaylanan stille, kanal adımı içeren 10 saniyelik 9:16 deneme videosunu rehberdeki kalite kontrollerinden geçirip yerel çıktı olarak sun. Hazır ses yoksa sessiz yazıyla üret; ücretli ses çağrısı veya başka harcama öncesinde kapsamı ve tahmini kullanımı onaylat. Gerçek çıktı oluşmazsa başarı iddia etme; hatayı ve kalan adımı yaz.
6. Kurulumda yükleme veya yayın yapma. YouTube API, günlük ölçüm ve ajan postasını yalnız ben seçtiysem rehbere göre yapılandır; hesap yetkileri ve zamanlanmış görev için somut adımı önce onaylat. Görev başına ayrı posta kimliği kullan; mevcut izleyiciyi çoğaltma, boş kutu için model çağırma. Sonraki her yükleme ve yayın da açık onayımı gerektirir; --yes tek başına onay değildir.

Sonunda kurulanları, atlananları ve deneme videosunun yolunu özetle. Deneme videosunu incelememi bekle; ardından “İlk videonuzun konusu ne olsun?” diye sor.
```

## Kurulumda oluşacak dosyalar

| Dosya | İçerik |
|---|---|
| `kanal.json` | Mevcut kimlik, görünüm/ses parametreleri, YouTube metadata varsayılanları ve yollar. |
| `yonetim/VIDEO-KIMLIGI.md` | Onayladığınız anlatım ve görsel stil. |
| `yonetim/referanslar.md` | Referans bağlantıları ve sevdiğiniz özellikler. |
| `yonetim/ROLLER.md` | Metin, üretim, kontrol ve yayın sorumlulukları. |

Kök rehber [KURULUM.md](KURULUM.md); sorular [Türkçe](kurulum/sorular.md) ve [İngilizce](kurulum/questions.md). İş akışı tercihleri yukarıdaki üç yonetim/ belgesinde tutulur; ek JSON düğmeleri değildir. Çalışma kuralları [KURALLAR.md](KURALLAR.md) ve [CLAUDE.md](CLAUDE.md), çıktı denetimi [KALITE-KAPISI.md](KALITE-KAPISI.md) içindedir. Rehberdeki komutlar güncel kaynaktan okunmuştur. Bildirilen temiz kurulum denemesi, araçları önceden kurulmuş Windows ortamını kapsar; diğer sistemler ve eksik araçların kurulumu henüz sınanmadı.

## Güvenli çalışma

- Her yükleme ve yayın için açık onayınız gerekir. API bağlantısı yayın izni değildir. Yükleme araçlarının hedef varsayılanı prova; gerçek gönderim için onay ve bilinçli `--yes` kullanımı birlikte gerekir.
- API anahtarlarını yalnız yerel `.env` dosyasına kendiniz girin; sohbet veya günlüklerle paylaşmayın. OAuth istemci/jeton dosyaları gerekiyorsa rehberdeki yerel, Git dışında bırakılmış alanda tutulur. Gizli değerler `kanal.json` dosyasına yazılmaz.
- Fare, klavye ve masaüstü kaydı kullanılmaz. Render işlemi headless yürütülür.
- Sistem kurulumu, ücretli hizmet çağrısı ve zamanlanmış görev önce açıklanır ve onayınıza sunulur. Kaynak çekimler yerinde korunur.
- Üretilen metni, görüntüyü ve sesi siz inceleyin. Referans, müzik, yazı tipi ve diğer malzemelerin kullanım koşullarını koruyun.

## Sınırlar

Erken sürümün amacı, kendi video düzeninizi kurmaya başlangıç sağlamaktır. Kurulumun her bilgisayarda çalıştığı, bütün kurgu türlerinin desteklendiği veya içeriklerin belirli izlenme alacağı iddia edilmez. Otomatik kontroller içerik doğruluğunu, sesin kulağa doğal gelmesini ve tasarım kalitesini tek başına doğrulamaz.

Instagram/TikTok seçimi, o platformlara otomatik yayın entegrasyonu bulunduğu anlamına gelmez. İlk hedef yerel çıktı ve isteğe bağlı YouTube bağlantısıdır. [YouTube yükleme işlemi hesap yetkilendirmesi ister](https://developers.google.com/youtube/v3/docs/videos/insert); platform koşulları ayrıca geçerlidir. Günlük ölçüm ve ajan postası varsayılan olarak kapalıdır.

## Lisans

Frame Parade, [Frame Parade Community Use License 1.0](LICENSE) kapsamında **source-available** olarak sunulur. Esas metin İngilizcedir; [Türkçe özet](LISANS-OZET.tr.md) de bulunur.

| İşlem | Bu lisans kapsamında |
|---|---|
| Kendi projeleriniz, kanallarınız ve şirketinizin içerikleri için kullanım | İzinli |
| Kendi içeriğinizden reklam, abonelik veya kendi kursunuza erişim geliri | İzinli; müşteri için ticari üretim yasağı geçerlidir |
| Kendi kopyanızda değişiklik yapmak ve değişiklikleri özel tutmak | İzinli |
| Fork açmak, pull request göndermek veya değiştirilmiş sürümü ücretsiz paylaşmak | İzinli; aynı lisans, kaynak kodu ve bildirimler korunmalı |
| Ticari karşılık olmadan ücretsiz kurulum veya üretim yardımı | İzinli; ücretli işin, paketin veya satış promosyonunun parçası olmamalı |
| Kiti ya da türevini satmak veya ücretli pakete eklemek | İzin verilmez |
| Kiti ücretli barındırma, API, kurulum, özelleştirme veya destek hizmeti olarak sunmak | İzin verilmez |
| Ajans, serbest çalışma veya başka ticari hizmet kapsamında müşteriye içerik üretmek | İzin verilmez |
| Kitten lisansı, telif veya atıf bildirimlerini kaldırmak | İzin verilmez |

Ücretsiz paylaşımda lisans ve Frame Parade atfı korunur, değişiklikler belirtilir ve kitin kaynak kodu sağlanır. Koşullara uygun ücretsiz fork'unuzu anlatabilir ve bağlantısını paylaşabilirsiniz. Dolaylı ücret veya ücretli pakete bonus ekleme, yasağı ortadan kaldırmaz.

Hukuken hak doğabildiği ölçüde izinli videolarınız ve özgün içeriğiniz size aittir. Bu lisans bitmiş videoda gelir payı veya atıf istemez. Düzenlenebilir yazılım şablonları ve kod, kitin paylaşım koşullarına tabidir. Müşteri için ücretli üretim, kendi hesabınızda yayımlansa da yasaktır.

Üçüncü taraf bileşenler ve malzemeler kendi lisanslarını korur; bağımsız haklar kaldırılmaz. Tam koşullar için [LICENSE](LICENSE) geçerlidir.

## Katkıda bulunma

Hata düzeltmeleri, belge ve çeviri katkıları, şablonlar ve üretim akışı iyileştirmeleri bekliyoruz. Depoyu fork ederek tek konuya odaklanan bir pull request gönderebilirsiniz. Ayrıntılar: [CONTRIBUTING.md](CONTRIBUTING.md).

Katkınız aynı lisansla sunulur; **nihatbirbudak** tarafından Frame Parade içinde aynı lisans altında kullanılmasına, değiştirilmesine, birleştirilmesine ve dağıtılmasına izin verirsiniz. Katkınızın sahipliği sizde kalır; telif devri veya ayrıca başka lisansa geçirme izni istenmez.
