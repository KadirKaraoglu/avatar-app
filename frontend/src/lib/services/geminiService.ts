export class GeminiService {
    private socket: WebSocket | null = null;
    private onAudioData: (base64Audio: string) => void;
    private onInterrupt: (() => void) | null = null;
    private onAvatarSpeakingStart: (() => void) | null = null;
    private onAvatarSpeakingEnd: (() => void) | null = null;
    private url = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent";
    private unmuteTimer: NodeJS.Timeout | null = null; // Failsafe timer for unmute
    private predictedSpeechEndTime: number = 0; // Timestamp when audio playback is expected to end

    constructor(
        onAudioData: (base64Audio: string) => void,
        onInterrupt?: () => void,
        onAvatarSpeakingStart?: () => void,
        onAvatarSpeakingEnd?: () => void
    ) {
        this.onAudioData = onAudioData;
        this.onInterrupt = onInterrupt || null;
        this.onAvatarSpeakingStart = onAvatarSpeakingStart || null;
        this.onAvatarSpeakingEnd = onAvatarSpeakingEnd || null;
    }

    public connect(apiKey: string) {
        const wsUrl = `${this.url}?key=${apiKey}`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log("Connected to Gemini Live API");
            // Initial Setup
            this.sendInitialSetup();

            // Send greeting immediately after setup
            // Using a small delay to ensure setup is processed on server side first
            setTimeout(() => {
                this.sendGreeting();
            }, 500);
        };

        this.socket.onmessage = (event) => {
            this.handleMessage(event);
        };

        this.socket.onerror = (error) => {
            console.error("Gemini WebSocket Error:", error);
        };

        this.socket.onclose = (event) => {
            console.log("Gemini WebSocket Closed - Code:", event.code, "Reason:", event.reason, "Clean:", event.wasClean);
        };
    }

    private sendGreeting() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        // Command Gemini to speak the specific welcome message
        // using "Sadece ... söyle" pattern to prevent extra conversational filler
        const greetingPrompt = 'Sadece şu metni seslendir ve başka bir şey söyleme: "Elaziğ organize sanayi bölgesi müdürlüğüne hoş geldiniz nasıl yardımcı olabilirim"';
        this.sendText(greetingPrompt);
        console.log("✓ Greeting trigger sent to Gemini");
    }

    private sendInitialSetup() {
        if (!this.socket) return;

        // Request AUDIO output - TURKISH voice
        const setupMsg = {
            setup: {
                model: "models/gemini-2.0-flash-exp",
                system_instruction: {
                    parts: [{
                        text: `Sen Türkçe konuşan yapay zeka asistanısın. 
Kimlik ve Rol
Sen, Havsanın değerli mühendisleri tarafından geliştirilen, Doğu Anadolu'nun en stratejik üretim merkezlerinden biri olan Elazığ Organize Sanayi Bölgesi'nin (EOSB) resmi kurumsal asistanısın. Görevin; yatırımcılara, mevcut sanayicilere, akademik çevreye ve bölge halkına EOSB'nin operasyonel gücü, genişleme projeleri, sektörel derinliği ve sunduğu avantajlar hakkında profesyonel, veri odaklı ve vizyoner bilgi sağlamaktır.
1. Kurumsal Yapı, Tarihçe ve Yönetim Felsefesi
Tarihsel Gelişim: EOSB'nin temelleri 1986'da atılmış, 1. Bölge 1992'de tamamlanarak sanayicilerin hizmetine sunulmuştur. Bölge, geçen yıllar içinde sürekli büyüyerek 5 ana bölgeye ulaşmıştır.
Demokratik Yönetim Modeli: 05.01.2010 tarihinden itibaren EOSB, "Müteşebbis Heyet" yapısından çıkarak tamamen katılımcıların oylarıyla belirlenen "Genel Kurul" yöntemiyle yönetilmeye başlanmıştır. Bu model, bölgenin daha hızlı karar almasını ve sanayicinin doğrudan söz sahibi olmasını sağlar.
Yönetim Kadrosu: * Yönetim Kurulu Başkanı: Suat Öztürk (Bölgenin sanayileşme vizyonunun lideridir).
Başkan Vekili: Muhyettin Kaya.
Yönetim Kurulu Üyeleri: Sami Pirinççi, İzzet Özen, İhsan Güler, Muhammed Ali Akdağ, Oya Düşmez, Ramazan Saka, Ubeydullah Tuzsuzoğlu.
Bölge Müdürü: Mehmet Yaşar Demirel.
2. Fiziksel Kapasite, Genişleme ve Altyapı
Bölgesel Dağılım:
1. ve 2. Bölgeler: Olgunlaşmış bölgelerdir; doluluk oranları %95'in üzerindedir.
3. ve 4. Bölgeler: Yeni nesil fabrikaların yoğunlaştığı alanlardır.
5. Bölge: 55 sanayi parselinin tamamı tahsis edilmiş durumdadır; inşaat ve üretim süreçleri hızla devam etmektedir.
Stratejik 6. İlave Alan: 3.350.000 m² büyüklüğündeki bu alan, EOSB'nin geleceğini temsil etmektedir. Yer seçimi kesinleşmiş, imar ve parselasyon çalışmalarıyla Elazığ'ın önümüzdeki 20 yıllık sanayi ihtiyacını karşılaması planlanmaktadır.
Teknik Donanım: Bölge müdürlüğü; 5 binek araç, 4 pikap, 3 traktör, 3 çöp toplama aracı, forkliftler ve yükleyici kepçelerden oluşan geniş bir iş makinesi filosuyla 7/24 hizmet vermektedir.
3. Sektörel Güç Odakları ve Markalaşmış Firmalar
EOSB, çok sektörlü (karma) bir yapıya sahip olup bazı alanlarda küresel bir oyuncudur:
Mermer ve Doğal Taş (Amiral Gemisi): Elazığ Vişne mermeri başta olmak üzere, dünya pazarlarına ihracat yapan Akdağ Granit, Alacakaya Mermer, Mesta Traverten ve Gölalan Mermer gibi dev tesisler bulunmaktadır.
Tekstil Kümelenmesi: Bölge, "Tekstil-Endüstri Park Prestij Yatırım Merkezi" projesiyle (14 adet modern tekstil ünitesi) binlerce kişilik ek istihdam yaratmaktadır. SMM Tekstil, Berrak Tekstil, Saka Holding ve Taha Giyim öne çıkan yatırımcılardır.
Yapı Kimyasalları ve Mobilya: Sanica (Fatinoğlu Holding), Redboard (ED Yalıtım), Desen Mobilya ve Myfix Yapı Kimyasalları bölgenin inşaat sektöründeki gücünü yansıtır.
Gıda ve Tarım Teknolojileri: Coca-Cola, İsaş Grup, Yılsüt ve Turay Gıda gibi markalar bölgenin gıda arzındaki önemini pekiştirir.
4. Eğitim, Ar-Ge ve İnovasyon Ekosistemi
EOSB, "Nitelikli Eleman" sorununu kökten çözmeyi hedefler:
Akademik Entegrasyon: Bölge içinde faaliyet gösteren Fırat Üniversitesi EOSB Meslek Yüksekokulu, öğrencilerin teorik eğitimi üretim sahasında almasını sağlar.
Teknik Liseler: Zeycan Yıldırım Mesleki ve Teknik Anadolu Lisesi ile Özel Elazığ OSB Bilim Teknik ve İnovasyon Koleji, sanayinin ihtiyaç duyduğu teknik personeli yetiştirir.
Tasarım ve İnovasyon Merkezi: Modern CNC tezgahları ve tasarım laboratuvarları ile donatılmış olan bu merkez, firmaların yedek parça tasarımı, tersine mühendislik ve inovatif ürün geliştirme süreçlerine teknik destek sunar.
5. Lojistik ve Sosyal Yaşam Avantajları
Stratejik Konum: Elazığ, Doğu Anadolu'yu Batı'ya bağlayan yolların kavşağındadır (TRB1 Bölgesi: Bingöl, Malatya, Tunceli komşuluğu).
Ulaşım Kanalları: Şehir merkezine 10 km, havalimanına 4 km mesafededir. En büyük avantajı, bölgenin içinden geçen aktif TCDD demiryolu hattı ve lojistik yükleme merkezidir.
Sosyal ve İdari Tesisler: Bölge içerisinde Gümrük Müdürlüğü, PTT şubesi, 112 Acil Yardım Merkezi, Jandarma Karakolu, OSB Camii ve misafirlerin ağırlandığı Gedik Restoran gibi donatılar mevcuttur.
6. Sürdürülebilirlik ve "Yeşil OSB" Vizyonu
Çevre Politikası: 250.000'den fazla ağaç dikimi ile Türkiye'nin en yeşil OSB'lerinden biridir.
Atık Yönetimi: İleri biyolojik atık su arıtma tesisi ve düzenli katı atık depolama alanları ile doğaya saygılı üretim yapılmaktadır.
Gelecek Hedefi: Karbon ayak izi raporlaması ve Yeşil OSB sertifikasyon süreçleri ile Avrupa Yeşil Mutabakatı'na uyumlu bir sanayi yapısı oluşturulmaktadır.
7. Yatırımcıya Sunulan "Tek Durak Ofis" Hizmeti
Bürokrasisiz Süreç: Yatırımcılar; ruhsat, yapı denetim, enerji aboneliği ve çevre izinleri gibi tüm bürokratik işlemleri başka kuruma gitmeden doğrudan OSB Bölge Müdürlüğü bünyesinde çözebilir.
Teşvik Avantajları: Elazığ'ın 6. Bölge teşvikleri kapsamında yer alması (vergi indirimi, SGK prim desteği vb.) yatırımcılar için büyük bir maliyet avantajı sunar.
Yanıt Verme ve İletişim Kuralları
Dil ve Üslup: Her zaman çözüm odaklı, vizyoner ve kurumsal bir dil kullan. Elazığ'ın misafirperverliğini profesyonellikle harmanla.
Veri Hassasiyeti: İstihdam rakamlarını (şu an ~13.500, hedef 25.000) ve parsel bilgilerini brifingdeki en güncel halleriyle paylaş.
Başkanın Mesajı: Bölge Başkanı Suat Öztürk'ün "üretim, istihdam ve ihracat" üçlüsüne verdiği önemi ve "Tek Durak Ofis" felsefesini vurgula.
Hata Yönetimi: Bilinmeyen bir detay sorulduğunda, kullanıcıyı EOSB Bölge Müdürlüğü'ne yönlendir.

KURALLAR:
1. Her zaman Türkçe cevap ver
2. HİÇBİR ZAMAN kısaltma kullanma (örn: "vs.", "vb.", "örn." gibi)
3. Tüm kelimeleri tam halıyle yaz ve oku
4. Kısa ve net cevaplar ver
5. Doğal Türkçe kullan, çeviri gibi konuşma

ÖRNEKLER:
- "vs." yerine "ve benzeri" yaz
- "örn." yerine "örneğin" yaz  
- "Dr." yerine "Doktor" yaz
- "km" yerine "kilometre" yaz`
                    }]
                },
                generation_config: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: {
                                voice_name: "Kore"  // Turkish-sounding voice
                            }
                        },
                        language_code: "tr-TR"  // Turkish language
                    }
                }
            }
        };
        this.socket.send(JSON.stringify(setupMsg));
    }

    private async handleMessage(event: MessageEvent) {
        let data;
        if (event.data instanceof Blob) {
            const text = await event.data.text();
            data = JSON.parse(text);
        } else {
            data = JSON.parse(event.data);
        }

        // Log full message structure for debugging
        console.log("📨 Gemini message:", JSON.stringify(data).substring(0, 200));
        console.log("🔍 [DEBUG] serverContent:", data.serverContent);
        console.log("🔍 [DEBUG] turnComplete:", data.serverContent?.turnComplete);

        // Check for server-side interruption (Barge-in)
        // Note: The specific field for interruption might vary, but turnComplete often signals end of turn
        // or a new turn starting abruptly. 
        // Also check if server sends "interrupted" flag if available in newer API versions.

        // If we receive a new model turn while we are playing audio, it might mean interruption
        // For now, let's rely on the client-side VAD fallback if server doesn't send explicit flag.
        // BUT, if server sends empty audio or specific metadata, we should handle it.

        // Actually, reliable barge-in with Gemini Live API often sends a specific message.
        // Let's add a log to see what the server sends when I interrupt.

        if (data.serverContent?.interrupted) {
            console.log("🛑 Gemini detected interruption (Barge-in)! Server sent 'interrupted' flag.");
            // This method should be passed from page.tsx or via event
            if (this.onInterrupt) {
                this.onInterrupt();
            }
        }

        // Check for setup completion
        if (data.setupComplete) {
            console.log("✓ Gemini setup complete!");
        }

        // Check for errors
        if (data.error) {
            console.error("❌ Gemini error:", data.error);
        }

        // Check for turn completion (avatar finished speaking)
        if (data.serverContent?.turnComplete) {
            console.log("🎤 [GEMINI] Turn complete - Generation finished (still playing audio)");
            // We DO NOT unmute here anymore. We wait for the audio playback timer to expire.
            // This ensures we don't unmute while the avatar is still speaking the generated audio.
        }

        // Parse server content - prioritize AUDIO for CUSTOM mode
        if (data.serverContent?.modelTurn?.parts) {
            for (const part of data.serverContent.modelTurn.parts) {
                // Handle audio (primary for CUSTOM mode)
                if (part.inlineData && part.inlineData.mimeType.startsWith("audio/")) {
                    const base64Audio = part.inlineData.data;
                    console.log("✓ Gemini audio received - Length:", base64Audio.length, "chars");

                    // Notify that avatar is about to speak (mute microphone)
                    if (this.onAvatarSpeakingStart) {
                        this.onAvatarSpeakingStart();
                    }

                    // Calculate accurate duration
                    // Base64 (4 chars = 3 bytes) -> PCM 16-bit (2 bytes/sample) -> 24kHz (24000 samples/sec)
                    const byteLength = base64Audio.length * 0.75;
                    const sampleRate = 24000; // Gemini default for this model
                    const audioDurationMs = (byteLength / (sampleRate * 2)) * 1000;

                    // Accumulate duration logic (Queue System)
                    const now = Date.now();
                    // If we are already playing (predicted end is in future), add to it. 
                    // If not (predicted end is past), start from now.
                    this.predictedSpeechEndTime = Math.max(now, this.predictedSpeechEndTime) + audioDurationMs;

                    const timeUntilUnmute = this.predictedSpeechEndTime - now;
                    const unmuteDelayMs = timeUntilUnmute + 1500; // Add 1.5s buffer for network/HeyGen latency

                    console.log(`⏱️ [TIMER] Chunk: ${audioDurationMs.toFixed(0)}ms | Queue: ${timeUntilUnmute.toFixed(0)}ms | Unmute in: ${unmuteDelayMs.toFixed(0)}ms`);

                    // Clear any existing timer - we are extending the deadline
                    if (this.unmuteTimer) {
                        clearTimeout(this.unmuteTimer);
                    }

                    // Set timer to unmute after TOTAL audio duration specific to this stream
                    this.unmuteTimer = setTimeout(() => {
                        console.log("⏰ [TIMER] Audio Playback Timer expired -> Unmuting Microphone");
                        this.predictedSpeechEndTime = 0; // Reset
                        if (this.onAvatarSpeakingEnd) {
                            this.onAvatarSpeakingEnd();
                        }
                    }, unmuteDelayMs);

                    // Only process if socket still connected (session active)
                    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                        this.onAudioData(base64Audio);
                    } else {
                        console.warn("⚠️ Audio ignored - session closed");
                    }
                }
                // Handle text as fallback
                else if (part.text) {
                    const text = part.text;
                    console.log("✓ Gemini text received:", text);
                    this.onAudioData(text);
                }
            }
        }
    }

    public sendAudioChunk(audioChunk: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected, skipping audio chunk");
            return;
        }

        // Send RealtimeInput
        const msg = {
            realtimeInput: {
                mediaChunks: [
                    {
                        mimeType: "audio/pcm", // Assuming we send PCM
                        data: audioChunk
                    }
                ]
            }
        };
        this.socket.send(JSON.stringify(msg));
    }

    public interrupt() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected, cannot interrupt");
            return;
        }

        console.log("🛑 Interrupting Gemini...");

        // Send turn_complete to stop Gemini's current response
        const interruptMsg = {
            client_content: {
                turn_complete: true
            }
        };
        this.socket.send(JSON.stringify(interruptMsg));
    }

    public sendText(text: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        const msg = {
            clientContent: {
                turns: [
                    {
                        role: "user",
                        parts: [{ text: text }]
                    }
                ],
                turnComplete: true
            }
        };

        this.socket.send(JSON.stringify(msg));
    }

    public disconnect() {
        console.log("🔌 Disconnecting Gemini...");

        // Clear unmute timer
        if (this.unmuteTimer) {
            clearTimeout(this.unmuteTimer);
            this.unmuteTimer = null;
        }

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        // Clear callback to prevent any further audio processing
        this.onAudioData = () => { };

        console.log("✓ Gemini disconnected");
    }

    /**
     * Call this when avatar finishes speaking to unmute microphone
     */
    public notifyAvatarFinishedSpeaking() {
        if (this.onAvatarSpeakingEnd) {
            this.onAvatarSpeakingEnd();
        }
    }
}
