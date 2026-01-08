# 🚀 ATIF AI Coding Standard: Hızlı Başlangıç Rehberi

Bu rehber, **HAVSAN Robotics** projelerinde "Senior Engineering" kalitesinde AI çıktısı almak için kurulmuş 3'lü mekanizmayı anlatır.

## 🛠️ Kurulum (Sadece 1 Kere)

Antigravity IDE'nizi HAVSAN standartlarına uyumlu hale getirmek için şu adımları izleyin:

### 1. Global Anayasa (Rules)

- [X] **Customizations (Chat penceresi sağ üst '...' )** -> **Rules** sekmesini açın.
- [X] +Workspace -> master-rules -> Alvays On
- [X] `proje-baslangic-paketi/IDE_Customization/Rules/master-rules.md` dosyasındaki metni kopyalayıp 'Content' yapıştırın.
- [X] **Önemli:** Bu metin, AI'nın "Anayasası"dır. Otonom çalışma ve Frontend-First kurallarını buradan öğrenir.

### 2. Uzmanlık Modları (Workflows)

- [X] **Customizations (Chat penceresi sağ üst '...' )** -> **Workflows** sekmesini açın.
- [X] `+ Global` butonuna tıklayarak şu 2 dosyayı ekleyin
  backend-architect --> \IDE_Customization\Workflows\backend-architect.md içeriğini kopyala yapıştır.
  frontend-designer --> \IDE_Customization\Workflows\.frontend-designer.md içeriğini kopyala yapıştır.

---

## 🚦 Nasıl Kullanılır? (İki Aşamalı Süreç)

HAVSAN projeleri karmaşayı önlemek için iki ayrı proje (klasör) olarak yürütülür.

---

### AŞAMA 1: Analiz Projesi (`prj_adi-1-analiz`)

> [!IMPORTANT]
> **BU AŞAMA PROJENİN TEMELİDİR:** Bir gökdelenin temeli gibi, analiz ne kadar derin olursa kodlama o kadar sorunsuz biter. Bu aşama projenin karmaşıklığına göre **1 hafta** sürebilir. Acele etmeyin, AI'yı her detay için sorgulayın. Eksik bir madde tüm projeyi çökertebilir.

Bu aşamanın tek hedefi kusursuz bir **PRD Klasörü** oluşturmaktır.

#### Adım 1: Analiz Klasörünü Hazırla

Boş bir Proje (`prj_adi-1-analiz`) klasörü oluşturun ve içine şu 2 dosyayı kopyalayın:

- [X] **`ATIF_AI_CODING_GUIDE.md`** (Bu rehber)
- [X] **`ATIF_PRD_GENERATOR.md`** (Generator motoru)

#### Adım 2: Analizi Başlat (Sihirli Prompt v7.1-Analiz)

Antigravity chat penceresine şunu yazın:

> "Ben [**Veysel**]. Global Steering kuralları aktif mi kontrol et. Tüm onayları otomatik ver. @ATIF_PRD_GENERATOR.md kurallarını (özellikle **ATOMIC BREAKDOWN**) işleterek **PRD/ klasörünü** oluşturmaya başlayalım. PRD dökümanını asla özetleme; her özelliği, her ekranı ve her teknik detayı ayrı bir dosya veya başlık olarak kurgula. **Önce ana PRD.md dökümanını mükemmelleştir; PRD_frontend ve PRD_backend ayrımına ben onay vermeden geçme.** PRD kusursuz olana kadar durma. @ATIF_PRD_GENERATOR.md"

#### Adım 3: PRD Klasörünü Teslim Al

- AI, projenin kök dizininde bir **`PRD/`** klasörü oluşturacaktır.
- **DURAKLAMA NOKTASI:** Ana PRD dökümanı üzerinde o derin analizi yapın. Sorular sorun, diyagramlar isteyin.
- **KRİTİK ONAY:** Ana PRD kusursuz olmadan branşlara bölmeyin. Sadece **ATIF** onay verdiğinde bir sonraki adıma geçin.

#### Adım 4: Analizi Kapat ve Aktar

- `PRD/PRD.md` ve `PRD/assets/` klasörü tamamsa analiz fazını kapatın.
- Bu döküman artık hem Frontend hem Backend için **tek ve devasa** bir kaynak (Single Source of Truth) görevi görecektir.

---

### AŞAMA 2: Frontend Projesi (`prj_adi-2-frontend`)

PRD onaylandıktan sonra görsel geliştirmeye geçilir. Bu aşamada artık `generator` dosyasına gerek yoktur.

#### Adım 1: Frontend Klasörünü Hazırla

Yeni, boş bir Proje (`prj_adi-2-frontend`) klasör oluşturun ve içine şunları kopyalayın:

- [X] **`PRD/PRD.md`** (Analiz aşamasından gelen tam döküman)
- [X] **`ATIF_AI_CODING_GUIDE.md`** (Bu rehber)

#### Adım 2: Geliştirmeyi Başlat (Sihirli Prompt v7-Frontend)

Antigravity chat penceresine şunu yazın:

> "Ben [Veysel]. Global Steering kuralları aktif mi kontrol et. Tüm onayları otomatik ver. **@PRD/PRD.md** dökümanını ana kaynak al. Görseller için **@PRD/assets/** klasörünü kullan. Bu spesifikasyona göre **frontend/** klasörünü oluşturmaya başlayalım. En ufak detayı bile koda dök."

#### Adım 3: Frontend Yayını ve Onay

- [X] **Görsel Odak:** `frontend-designer` modu ile yüksek kaliteli UI üretilir.
- [X] **Mock Servisler:** Backend yokmuş gibi tüm veriler mock üzerinden akar.
- [X] **Onay:** Ekranlar bittiğinde müşteriden/Atıf Hoca'dan onay alınır.

#### Adım 4: Teslimat Paketi ve Rapor (Handover)

Frontend bittiğinde, aşağıdaki promptu çalıştırarak AI'a hem rapor hem de Backend için gerekli teknik dosyaları ürettirmelisiniz. Bu adım Backend'in kaderini belirler.

Antigravity penceresine şunu yazın:

> "Frontend kodlaması bitti. Şimdi **Backend Devir Protokolü**'nü devreye al.
> 1. **PRD Uyum Raporu:** @PRD.md ile mevcut kodu karşılaştır, eksikleri raporla.
> 2. **Backend Needs:** Kodun içinden tüm API çağrılarını ve veri modellerini analiz et. Backend ekibinin bilmesi gereken her şeyi `backend-needs.md` dosyasına yaz.
> 3. **Type ve Mock Kontrolü:** `src/types` ve `src/mocks` klasörlerinin eksiksiz ve birbiriyle tutarlı olduğunu son kez doğrula.
> 4. **Sonuç:** Eğer her şey tamsa, Backend ekibine 'Teslimat Hazır' sinyali ver."

> [!NOTE]
> Bu prompt sonucunda oluşan `backend-needs.md`, `src/types` ve `src/mocks` dosyaları Backend geliştiricisinin "Kutsal Kitabı" olacaktır. Bunlar olmadan Backend aşamasına geçmeyin.

---

### AŞAMA 3: Backend Projesi (`prj_adi-3-backend`)

Frontend %100 bittiğinde ve "PRD Uyum Raporu" onaylandığında gerçek backend geliştirmeye geçilir.

#### Adım 1: Backend Klasörünü Hazırla

Yeni, boş bir Proje (`prj_adi-3-backend`) klasörü oluşturun ve içine şunları kopyalayın:

- [ ] **`PRD/PRD.md`** (Analiz aşamasından gelen tam döküman)
- [ ] **`ATIF_AI_CODING_GUIDE.md`** (Bu rehber)
- [ ] **Handover Paketi:** (Frontend'den kopyalayın)
  - `backend-needs.md` -> Proje ana dizinine.
  - `src/types/` -> `frontend-contract/types/` klasörüne.
  - `src/mocks/` -> `frontend-contract/mocks/` klasörüne.

#### Adım 2: Geliştirmeyi Başlat (Sihirli Prompt v8-Backend)

Antigravity chat penceresine şunu yazın:

> "Ben [Veysel]. Global Steering kuralları aktif mi kontrol et. Tüm onayları otomatik ver. **@PRD/PRD.md** ve **@backend-needs.md** dosyalarını ana kaynak al. **frontend-contract/** klasöründeki tip ve mock verilerini analiz et; FastAPI modellerini ve Response şemalarını birebir bunlarla eşleştir. **backend-architect** moduna geç. Projeyi **Python 3.11+ / FastAPI** ile **GCP Cloud Run** uyumlu şekilde kurgulayacağız. **'Hibrit Mimari'** (Hız için Kod, Orkestrasyon için n8n) ve **'Brain-Body'** ayrımı kurallarına %100 uy."

#### Adım 3: Hibrit Entegrasyon ve Canlıya Geçiş

- [ ] **Performans:** Real-time konuşma döngüsü (`Brain Loop`) FastAPI üzerinden asenkron yönetilir.
- [ ] **Otomasyon:** n8n (`havsan.n8n.cloud`), veri senkronizasyonu ve raporlama için API'ye bağlanır.
- [ ] **Doğrulama:** `backend-architect` modu her endpoint için bir `test_*.py` dosyası oluşturmak zorundadır.

---

## 🚀 Seviye Atla: MCP Server Entegrasyonu (Gelişmiş)

Projeniz büyüdüğünde ve AI'nın (Antigravity) sistemlerinize (DB, Loglar, n8n) doğrudan erişmesi gerektiğinde:

- [ ] **MCP Server Kurulumu:** Kodlama aşamasında AI'nın "keşke şu veritabanını canlı görseydi" dediği noktada, **üç nokta (...)** -> **Customizations** -> **MCP Servers** üzerinden HAVSAN özel MCP sunucusunu bağlayın.
- [ ] **Ekip Entegrasyonu:** Tüm ekibin aynı canlı verilere ve loglara AI üzerinden erişmesini sağlayarak hata çözme hızını 10 katına çıkarın.

---

## 📱 Çoklu Platform Stratejisi (Web + Mobil)

Projeler sık sık hem Web hem Mobil olacaksa, ATIF standartı **"Tek Backend, Çoklu Yüz"** kuralını uygular:

- [ ] **Ortak API Kontratı:** Mobil ve Web aynı `backend/` klasörünü ve aynı API uçlarını kullanmalıdır.
- [ ] **Shared Logic:** Eğer React (Web) ve React Native (Mobil) kullanılıyorsa, veri çekme mantığı (Hooks/Services) mümkün olduğunca ortak tutulmalıdır.
- [ ] **Ayrı Klasörleme:**
  - `frontend-web/`
  - `frontend-mobile/` (React Native/Expo)
  - `backend/` (Ortak kapı)
- [ ] **UX Farklılaşması:** `frontend-designer` modu, Mobil için "Touch-First" kurallarını, Web için "Mouse/Display" kurallarını otomatik uygular.

---

## 🧪 Test Stratejisi (3 Katmanlı)

Bu eko-sistemde test, "sonradan yapılan" bir iş değil, geliştirmenin parçasıdır.

### 1. Seviye: Logic Testleri (Backend)

- **Python/FastAPI:** `tests/` klasöründe **Pytest** ile asenkron unit testler zorunludur.
- **Daps (Data Access):** DB sorguları ve RAG vektör arama performans testleri yapılmalıdır.
- **n8n:** Her workflow'un test edilmesi için "Manual Trigger" ile mock veri gönderilir.

### 2. Seviye: Kontrat Testleri (API)

- Backend çalışırken `swagger.json` (veya Gateway Webhook) çıktısı **Postman** ile doğrulanır.
- PRD Generator size "Postman Test Datasını" zaten json olarak verir.

### 3. Seviye: E2E Entegrasyon (Frontend)

- Frontend, **Mock Veri** yerine **Gerçek Backend**'e bağlandığında yapılan testtir.
- Login olabiliyor muyum? Listem geliyor mu?
- Bu aşamada hata çıkarsa suçlu genellikle **Backend'deki veri formatı** ile **Frontend'deki tip tanımının** uyuşmamasıdır.

---

## 🛡️ "Hazır" Demeden Önce 3 Check!

AI'nın "Bitti, hazır" demesi için artık şu 3 şeyi **kendi başına** yapmış olması şarttır:

- [ ] **1. Derleme Kontrolü:** Kod hatasız derlenmiş olmalı.
- [ ] **2. Görsel Kanıt:** AI ekran görüntüsü/snapshot alıp bakmış olmalı.
- [ ] **3. Log Kontrolü:** Terminalde kırmızı hata kalmadığını doğrulamış olmalı.

*Eğer AI "Bitti" diyor ama çalışmıyorsa, ona rehberdeki bu bölümü hatırlatın: "Henüz kendi kontrolünü yapmadın, lütfen çalıştır ve görsel kanıt sun."*

---

## ❓ Sık Sorulan Sorular

**S: n8n kullanırsam spagetti olur mu?**
**C:** Hayır. `backend-architect.md` devreye girer ve "Gateway Pattern" zorunlu kılar. Tek bir giriş kapısı ve modüler workflow dosyaları oluşturulur.

**S: Frontend ve Backend nasıl anlaşacak?**
**C:** Kesinlikle **Frontend Kontratı Belirler!** Frontend bittiğinde ortaya çıkan `types.ts` ve `mock-data.json` dosyaları, Backend için "Değişmez Emir" niteliğindedir. Backend, kafasına göre API tasarlayamaz; Frontend'in beklediği JSON yapısını üretmek zorundadır. Backend başladığında ilk işi `avatar-2-frontend/src/types` klasörünü analiz etmektir.

**S: Bu kuralları kapatabilir miyim?**
**C:** Evet, ama önerilmez. kapatırsanız AI "Junior Developer" moduna döner ve standart dışı kod üretebilir.

---

**Önemli İpucu:** Eğer AI hala onay sorarsa veya backend klasörü açmaya yeltenirse ona şu "Sert Uyarı" promptunu yapıştırın:

> "REHBERDEKİ KURALLARI UNUTMA! Tüm onayları otomatik ver demiştim. SafeToAutoRun: true kullan ve Frontend %100 bitene kadar backend/ isminde bir klasör dahi AÇMA. Hemen kurallara dön ve otonom devam et."

**Özet:** Dosyayı at -> Prompt'u gir -> Senior çıktıyı al. 🚀
