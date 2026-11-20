# Frame Parade kurulum görüşmesi

Kurulumu yürüten model: [KURULUM.md](../KURULUM.md) akışını izle. Bunlar 15 konu; hepsini tek form olarak gönderme. Bir mesajda tek konu sor, verilen cevapları yeniden isteme, örnekleri yararlıysa göster. Kullanıcının dilinde konuş; İngilizce metin [questions.md](questions.md) içindedir.

Zorunlu, karar gerektiği anlamına gelir: kullanıcı bilmiyorsa öner ve kabulünü al. İsteğe bağlılar atlanabilir. Örnekler kullanıcı tercihi değildir. Cevap olarak gizli bilgi isteme.

Eşlemeler gerçek `kanal.json` şemasına dayanır. Yalnız listelenen mevcut anahtarları yaz; türlerini koru. Diğer tercihler `yonetim/VIDEO-KIMLIGI.md`, `yonetim/referanslar.md` ve `yonetim/ROLLER.md` içinde tutulur. JSON eşlemesi yoksa yeni bayrak uydurma. Boş dizeleri ve dizileri null yapma. youtube.cocuklara_ozel alanındaki mevcut null, sahibi karar verene kadar korunur. Seçimler ücretli hizmeti veya yayını kendiliğinden başlatmaz.

## A. Kimlik

### 01 — Kanal kimliği · Zorunlu

**Soru:** Kanalınızın adı, ana konusu ve anlatım dili ne olsun? Seri adınız varsa ekleyebilirsiniz; yoksa boş bırakabiliriz.

**Neden:** Denemeyi ve metinleri aynı kimlikle hazırlayacağız.

**Örnek:** Merak Masası; gündelik bilim; Türkçe; henüz seri adı yok.

**Mevcut JSON anahtarları:** `ad`, `seri`, `dil`, `ekran_metinleri`

**Kayıt / koşullar:** Konuyu yonetim/VIDEO-KIMLIGI.md içine yaz. Geçerli dil etiketi kullan (tr/en); JSON anahtarlarını değiştirme, yerleşik ekran dili en/tr seçilir; ekran_metinleri isteğe bağlı düzeltmeleri tutar. Boş nesne varsayılanları korur. Gerekirse geçici adı kullanıcıyla kararlaştır.

### 02 — İzleyici · Zorunlu

**Soru:** Videoları kimler için hazırlıyorsunuz; izlediklerinde neyi anlamalarını veya yapabilmelerini istiyorsunuz?

**Neden:** Açıklama düzeyini buna göre seçeceğiz.

**Örnek:** Yapay zekâya yeni başlayan yetişkinler; modelin nasıl tahmin yaptığını anlasınlar.

**Mevcut JSON anahtarları:** Yok; yönetim belgelerini kullan.

**Kayıt / koşullar:** yonetim/VIDEO-KIMLIGI.md içinde İzleyici ve kazanım bölümüne yaz. Kodda izleyici alanı yok.

### 03 — Platformlar · Zorunlu seçim; hesap bağlantıları isteğe bağlı

**Soru:** Videolar nerede kullanılacak: YouTube, Shorts, Instagram Reels veya TikTok? Hazır hesap bağlantılarını ekleyebilirsiniz.

**Neden:** Kadrajı belirleyeceğiz. Yerel deneme için hesap gerekmiyor.

**Örnek:** YouTube ve Shorts; henüz hesabım yok.

**Mevcut JSON anahtarları:** Yok; yönetim belgelerini kullan.

**Kayıt / koşullar:** Platformları ve herkese açık hesap bağlantılarını yonetim/VIDEO-KIMLIGI.md içine yaz. Seçim entegrasyon veya yükleme izni değildir.

## B. Referans

### 04 — Referanslar ve kaçınılacaklar · İsteğe bağlı

**Soru:** Beğendiğiniz 3–5 hesap veya videoyu, her birinde neyi sevdiğinizi yazarak paylaşır mısınız? Daha az örnekle veya örneksiz başlayabiliriz; istemediklerinizi de ekleyebilirsiniz.

**Neden:** Görünüm ve anlatım tercihinizi somutlaştıracağız.

**Örnek:** Bir bağlantı: çizimler adım adım oluşuyor. Diğeri: fazla yazı var.

**Mevcut JSON anahtarları:** Yok; yönetim belgelerini kullan.

**Kayıt / koşullar:** yonetim/referanslar.md: bağlantı, kullanıcı notu, incelenen bölüm ve erişim durumu. Onaylanan stili yonetim/VIDEO-KIMLIGI.md içine yaz. Atlanırsa iki sade yön öner. Erişilemeyen videoyu izlemiş gibi yorumlama; yeniden kullanım izni varsayma.

## C. İçerik

### 05 — İçerik türü · Zorunlu

**Soru:** Ağırlıklı olarak ders, açıklayıcı anlatım, kendi işinizin tanıtımı, çekim kurgusu veya hareketli grafiklerden hangisini hazırlayacaksınız?

**Neden:** İlk üretim akışını seçeceğiz.

**Örnek:** Hareketli çizimlerle teknik dersler.

**Mevcut JSON anahtarları:** Yok; yönetim belgelerini kullan.

**Kayıt / koşullar:** yonetim/VIDEO-KIMLIGI.md içinde İçerik ve akış bölümüne yaz. İzinli kullanım için LICENSE geçerli. Desteklenmeyen ihtiyaçları kaydet; tam kurgu uygulaması vaat etme.

### 06 — Biçim ve üretim sıklığı · Zorunlu biçim; sıklık isteğe bağlı

**Soru:** Yatay video, kısa dikey video veya ikisini mi hazırlayacaksınız? Denemek istediğiniz bir üretim sıklığı var mı?

**Neden:** Şablonları ve iş sırasını belirleriz; yayın başlatılmaz.

**Örnek:** İkisi de; haftada bir uzun video ve iki Shorts.

**Mevcut JSON anahtarları:** Yok; yönetim belgelerini kullan.

**Kayıt / koşullar:** Biçimleri yonetim/VIDEO-KIMLIGI.md, sıklığı yonetim/ROLLER.md içine yaz. Kadraj kanal.json içinde değil, proje.json dosyasında bicim=dikey veya yatay olarak tutulur. Kurulum örneği dikey kalır. Sıklık atlanırsa kararlaştırılmadı yaz; önce tek deneme.

## D. Malzeme

### 07 — Kaynak malzeme · Zorunlu çalışma alanı; mevcut malzeme isteğe bağlı

**Soru:** Çekim veya metinlerinizi nereden okuyalım; yeni malzemeleri nerede toplayalım? Hazır malzeme olmadan başlayabiliriz.

**Neden:** Kaynakları koruyup üretilen dosyaların yerini belirleyeceğiz.

**Örnek:** Harici diskteki çekimleri oku; yeni malzeme burada malzeme/ klasörüne gelsin.

**Mevcut JSON anahtarları:** `klasorler.projeler`, `klasorler.gecici`

**Kayıt / koşullar:** Kaynak yerlerini ve erişimi yonetim/VIDEO-KIMLIGI.md içine yaz. Örnekte projeler ve boş geçici yol varsayılanını koru. JSON alanları kaynak kataloğu değil, çalışma yollarıdır. Gerekirse malzeme/ öner. Kaynak taşıma, üzerine yazma veya silme.

### 08 — Görsel kimlik · İsteğe bağlı

**Soru:** Logo, renk veya yazı tipiniz var mı? Yoksa referanslardan bir görünüm önerebiliriz.

**Neden:** Videoların tutarlı görünmesini sağlayacağız.

**Örnek:** Logo yok; koyu zemin ve turuncu vurgu.

**Mevcut JSON anahtarları:** `logo`, `renkler.zemin`, `renkler.yuzey`, `renkler.cizgi`, `renkler.ik`, `renkler.metin`, `renkler.vu`, `renkler.abone_dugmesi`, `yazitipleri.baslik`, `yazitipleri.sayi`

**Kayıt / koşullar:** Onaylanan stili yonetim/VIDEO-KIMLIGI.md içine yaz. Font adı dosyasını yüklemez; alternatifin hakkı, yüklenmesi ve görünümü doğrulanana kadar paketli Inter Variable ve JetBrains Mono Variable kalsın. Logo yoksa boş dize. Render öncesi stil onayı al.

## E. Ses

### 09 — Anlatım · Zorunlu seçim

**Soru:** Kendi sesinizle mi, yapay sesle mi, yoksa sessiz mi başlayalım? Yapay ses için tonu ve ElevenLabs erişiminiz olup olmadığını söyleyin; anahtar paylaşmayın.

**Neden:** Ses işini ve olası hizmet kullanımını belirleyeceğiz.

**Örnek:** Önce sessiz; sonra kendi kaydım.

**Mevcut JSON anahtarları:** `ses.saglayici`, `ses.kimlik`, `ses.model`, `ses.hece_sn`, `ses.lufs`

**Kayıt / koşullar:** Sessiz/kendi/yapay ses, ton ve onayları yonetim/VIDEO-KIMLIGI.md içine yaz. JSON ses parametreleri açma düğmesi değildir. Yapılandırılmadıysa kimlik boş kalsın; sessiz kurulumda ses araçlarını çalıştırma. Seçilirse gerçek ses kimliği ve kullanılabilir model belirle. Anahtar JSON alanına yazılmaz. Ücretli örnek izni ve dinleme onayı ayrıdır; KURULUM.md sınırlarına uy.

### 10 — Müzik ve efekt · İsteğe bağlı

**Soru:** Müzik veya ses efekti ister misiniz? Kullanmak istediğiniz dosyaları belirtebilirsiniz.

**Neden:** Seslerin kullanım hakkı ve dinleyerek onayı gerekiyor.

**Örnek:** Müzik yok; birkaç hafif tıklama olabilir.

**Mevcut JSON anahtarları:** Yok; yönetim belgelerini kullan.

**Kayıt / koşullar:** Tercihleri ve onaylı dosya yollarını yonetim/VIDEO-KIMLIGI.md içine yaz. Atlanırsa kapalı. ses.muzik veya ses.efekt bayrağı yok. Dinlenmeyen aday onaylı sayılmaz. Ücretli efekt ayrıca kapsam/maliyet onayı ister.

## F. Metin

### 11 — Metni hazırlayan · Varsayılan: aynı model

**Soru:** Önce metinleri, ardından görselleri bu model hazırlasın; siz inceleyin. Böyle başlayalım mı? İsterseniz metinleri kendiniz yazabilir veya daha sonra ikinci bir model ekleyebilirsiniz.

**Neden:** Metin, tasarım ve kontrol sorumlularını belirleyeceğiz.

**Örnek:** Aynı model önce metni, sonra tasarımı yapsın; ben inceleyeyim.

**Mevcut JSON anahtarları:** Yok; yönetim belgelerini kullan.

**Kayıt / koşullar:** yonetim/ROLLER.md: yönetici, yazar, üretim, kontrol ve yayın sorumlusu. Varsayılan yazar ve üretici aynı modeldir; bu işleri sırayla yapar, kullanıcı sonucu inceler. Verilmiş tercihi yeniden sorma. Codex gibi ikinci model yalnız kullanıcı seçerse eklenir. Ajan postası isteğe bağlıdır; ilk kurulumun önkoşulu yapılmaz. Otomatik olarak ek ücretli oturum açma.

## 12–15 için verilen cevapları kullan

Bu konuları tek bir yayın ve araçlar kontrol adımı olarak ele al; yalnız eksik kararı, bir seferde bir tane sor. Kullanıcı "yayından önce inceleme" ve "ekleri atla" dediyse 12, 13 ve 14'ü yeniden sorma. Yerel önizlemeyi kaydet, YouTube bağlantısını sonraya bırak, günlük ölçüm ve ajan postasını kapalı tut; verilmiş kullanım sınırlarını kullan. 15'teki makine denetimlerini yine yerel olarak yap. Sınırı yalnız sıradaki somut işi etkileyen eksik bir karar varsa sor; plan veya kota uydurma. Bu kayıt yükleme veya harcama izni vermez.

## G. Yayın ve onay

### 12 — İnceleme yöntemi · Zorunlu

**Soru:** Her videoyu yüklemeden ve yayımlamadan önce size sunacağız. İnceleme için yerel önizleme uygun mu?

**Neden:** Gerçek metni, görüntüyü ve sesi inceleyebilmelisiniz.

**Örnek:** Evet; video, başlık ve açıklamayı yerel dosyada göreyim.

**Mevcut JSON anahtarları:** Yok; yönetim belgelerini kullan.

**Kayıt / koşullar:** Önizleme yöntemi ve açık yükleme/yayın onayını yonetim/ROLLER.md içine yaz. JSON onay anahtarı yok. API erişimi, sessizlik veya --yes onay değildir. Dış hizmete önizleme göndermeden izin al.

### 13 — YouTube bağlantısı · İsteğe bağlı

**Soru:** YouTube API bağlantısını şimdi mi hazırlayalım, sonraya mı bırakalım, yoksa kendiniz mi yükleyeceksiniz?

**Neden:** Yerel üretim için hesap bağlamak gerekmiyor.

**Örnek:** Şimdilik elle yüklerim.

**Mevcut JSON anahtarları:** `youtube.oynatma_listesi`, `youtube.kategori`, `youtube.etiketler`, `youtube.yayin_saatleri`, `youtube.utc_farki`, `youtube.yapay_zeka_beyani`, `youtube.cocuklara_ozel`, `youtube.aciklama_zorunlu`

**Kayıt / koşullar:** Şimdi/sonra/manuel seçimini yonetim/ROLLER.md içine yaz; atlanırsa sonra. JSON alanları metadata varsayılanıdır, hesap bilgisi veya otomasyon düğmesi değildir. Türleri koru; gerekirse liste/kategori/etiket/saat/UTC farkı/beyan ayrıntılarını al. Beyanı video başına doğrula. youtube.cocuklara_ozel karar verilene kadar null kalır; yükleyici sahibin açık true/false seçimini ister. OAuth için KURULUM.md kapsamları onaylanır; örnek yüklenmez.

### 14 — Ek araçlar · İsteğe bağlı

**Soru:** Günlük YouTube ölçümü veya ajan postası ister misiniz? İkisini de denemeden sonraya bırakabiliriz.

**Neden:** Bunlar isteğe bağlı eklerdir.

**Örnek:** Sonra; önce denemeyi görelim.

**Mevcut JSON anahtarları:** Yok; yönetim belgelerini kullan.

**Kayıt / koşullar:** Seçimleri yonetim/ROLLER.md içine yaz; atlanırsa kapalı. Ölçüm OAuth ve onaylı zamanlama ister; betik kendini zamanlamaz. Posta ayrı entegrasyondur: mevcut kurulumu doğrula, benzersiz kimlik ve tek yerel izleyici kullan, boş kutuda model çağırma. Kurulum aracı uydurma.

## H. Makine

### 15 — Makine ve kullanım sınırı · Zorunlu denetim; kullanım tercihi isteğe bağlı

**Soru:** Araçları ve boş diski yerel kontrol edeceğim. Uymamı istediğiniz hesap, kota veya çalışma sınırı var mı?

**Neden:** Denemeyi küçük tutup eksik araçları belirleyeceğiz.

**Örnek:** Aynı anda tek iş; önce sessiz deneme.

**Mevcut JSON anahtarları:** `chrome`

**Kayıt / koşullar:** Sistem, mimari, sürümler, boş disk, denetim zamanı ve sınırları yonetim/ROLLER.md içine yaz. Özel Chrome yolu için kanal.json.chrome veya süreç ortamında / yerel .env içinde CHROME_YOLU kullan. Mevcut süreç değişkeni .env değerinden önceliklidir. İlk eşzamanlı iş bir olsun. Ölçülmeyen bilgi bilinmiyor kalır; plan/kota tahmin etme.

## Görüşme sonrası

Dört dosyayı özetle ve stil kartını sun. Onaydan sonra KURULUM.md içindeki 10 saniyelik yerel denemeye geç. Atlananları ve kalan sınırları belirt. Kullanıcı denemeyi inceleyince ilk gerçek videonun konusunu sor.
