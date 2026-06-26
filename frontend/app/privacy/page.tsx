import AppHeader from "@/components/AppHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & KVKK Aydınlatma Metni",
  description: "VisibilityRadar Privacy Policy and KVKK (Turkish Personal Data Protection Law) disclosure.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: false },
};

const SECTIONS_EN = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly, such as your email address when you sign up or submit a form. We also collect usage data such as which brands you analyze, your analysis scores, and basic analytics about how you use the service. We do not collect payment card data — payments are processed securely by LemonSqueezy."
  },
  {
    title: "2. How We Use Your Information",
    body: "We use your information to provide and improve the VisibilityRadar service, send you reports and product updates you've requested, respond to your support inquiries, and enforce our Terms of Service. We do not sell your personal information to third parties."
  },
  {
    title: "3. Data Storage",
    body: "Your account data and analysis history are stored in Supabase (PostgreSQL), hosted on secure cloud infrastructure. Analysis results are associated with your account and retained for the duration defined by your plan (30 days for Pro, 365 days for Agency, 0 days for Free)."
  },
  {
    title: "4. Third-Party Services",
    body: "We use the following third-party services to operate VisibilityRadar: Clerk (authentication), Supabase (database), LemonSqueezy (payments), Resend (email delivery), and Anthropic/OpenAI/Google (AI model APIs). Each provider has its own privacy policy governing their data use."
  },
  {
    title: "5. Cookies",
    body: "We use cookies to maintain your session (via Clerk) and to track demo usage (a single cookie named vr_demo_used). We do not use cookies for advertising or cross-site tracking."
  },
  {
    title: "6. Your Rights",
    body: "You may request access to, correction of, or deletion of your personal data at any time by contacting us at privacy@visibilityradar.ai. We will respond within 30 days. You may also delete your account directly from your profile settings."
  },
  {
    title: "7. Data Retention",
    body: "We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required by law to retain it."
  },
  {
    title: "8. Security",
    body: "We use industry-standard security measures including encrypted connections (HTTPS), row-level security on our database, and secure key management. No system is perfectly secure, and we cannot guarantee absolute security."
  },
  {
    title: "9. International Data Transfers",
    body: "VisibilityRadar operates globally and transfers personal data to service providers located outside of Turkey (including the United States and European Union) for the purposes described above. These transfers are made in compliance with applicable data protection laws including KVKK Article 9."
  },
  {
    title: "10. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on the service. Your continued use of VisibilityRadar after changes constitutes acceptance of the updated policy."
  },
  {
    title: "11. Contact",
    body: "For privacy-related questions, contact us at privacy@visibilityradar.ai or use the contact form at visibilityradar.ai/contact."
  },
];

const KVKK_SECTIONS = [
  {
    title: "1. Veri Sorumlusunun Kimliği",
    body: "6698 sayılı Kişisel Verilerin Korunması Kanunu ('KVKK') kapsamında veri sorumlusu sıfatıyla hareket eden VisibilityRadar ('Şirket'), kişisel verilerinizi aşağıda açıklanan amaç ve yöntemler dahilinde işlemektedir. İletişim: privacy@visibilityradar.ai"
  },
  {
    title: "2. İşlenen Kişisel Veriler",
    body: "Hizmetimizi kullanmanız kapsamında aşağıdaki kişisel verileriniz işlenmektedir: Kimlik verileri (ad, soyad), İletişim verileri (e-posta adresi), İşlem verileri (analiz geçmişi, marka adı, pazar bilgisi, AI skorları), Finansal veriler (abonelik planı, ödeme durumu — ödeme kartı bilgileri LemonSqueezy tarafından işlenmekte olup tarafımızca tutulmamaktadır), Teknik veriler (IP adresi, tarayıcı bilgisi, çerez verileri), Kullanım verileri (hangi özelliklerin kullanıldığı, erişim zamanları)."
  },
  {
    title: "3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Dayanakları",
    body: "Kişisel verileriniz şu amaçlarla ve KVKK'nın 5. maddesi kapsamındaki hukuki dayanaklara istinaden işlenmektedir: (a) Sözleşmenin ifası (md. 5/2-c): Hizmetin sunulması, hesap yönetimi, analiz geçmişinin tutulması. (b) Meşru menfaat (md. 5/2-f): Hizmet güvenliğinin sağlanması, hata takibi, kullanım istatistiklerinin tutulması. (c) Açık rıza (md. 5/1): Pazarlama iletişimi ve ürün güncellemeleri (abonelik sırasında onay alınmaktadır). (d) Kanuni yükümlülük (md. 5/2-ç): Vergi ve yasal saklama yükümlülükleri."
  },
  {
    title: "4. Kişisel Verilerin Aktarıldığı Taraflar ve Yurt Dışı Aktarım",
    body: "KVKK'nın 8. ve 9. maddeleri uyarınca kişisel verileriniz aşağıdaki taraflara aktarılmaktadır: Clerk Inc. (ABD) — kimlik doğrulama hizmeti, Supabase Inc. (ABD) — veritabanı ve altyapı hizmeti, LemonSqueezy (ABD) — ödeme işlemleri, Resend Inc. (ABD) — e-posta iletişim hizmeti, Anthropic / OpenAI / Google (ABD) — yapay zeka model servisleri. Söz konusu yurt dışı aktarımlar; ilgili ülkelerin yeterli koruma sağladığının tespiti veya açık rızanız kapsamında gerçekleştirilmektedir. Bu servis sağlayıcılarının tamamı uluslararası veri güvenliği standartlarına (SOC 2, ISO 27001 vb.) uymaktadır."
  },
  {
    title: "5. Kişisel Verilerin Saklanma Süresi",
    body: "Kişisel verileriniz hesabınız aktif olduğu süre boyunca saklanır. Hesabınızı silmeniz durumunda verileriniz 30 gün içinde silinir. Yasal saklama yükümlülüğü bulunan veriler (fatura bilgileri vb.) ilgili mevzuatta öngörülen süre kadar (10 yıl) saklanmaya devam eder. Analiz geçmişi saklama süreleri plana göre değişir: Free plan — 0 gün, Pro plan — 30 gün, Agency plan — 365 gün."
  },
  {
    title: "6. KVKK Madde 11 Kapsamındaki Haklarınız",
    body: "KVKK'nın 11. maddesi uyarınca ilgili kişi olarak aşağıdaki haklara sahipsiniz: (a) Kişisel verilerinizin işlenip işlenmediğini öğrenme, (b) İşlenmişse buna ilişkin bilgi talep etme, (c) İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, (d) Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, (e) Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme, (f) KVKK 7. madde kapsamında silinmesini veya yok edilmesini isteme, (g) (e) ve (f) bentleri uyarınca yapılan işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, (h) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme, (i) Kanuna aykırı işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme."
  },
  {
    title: "7. Başvuru Yöntemi",
    body: "KVKK kapsamındaki haklarınızı kullanmak için: E-posta yoluyla: privacy@visibilityradar.ai adresine 'KVKK Başvurusu' konusuyla yazabilirsiniz. Başvurunuzda adınız-soyadınız, e-posta adresiniz, talep konunuz ve kimliğinizi doğrulayan bilgi yer almalıdır. Talepler en geç 30 gün içinde sonuçlandırılır; işlemin ayrıca bir maliyet gerektirmesi hâlinde Kişisel Verileri Koruma Kurulu tarafından belirlenen tarife esas alınır."
  },
  {
    title: "8. Şikayet Hakkı",
    body: "Kişisel verilerinizin işlenmesine ilişkin şikayetlerinizi Kişisel Verileri Koruma Kurumu'na (KVKK) iletme hakkına sahipsiniz. Kurum iletişim bilgileri: Kişisel Verileri Koruma Kurumu, Nasuh Akar Mah. Ziyabey Cad. No:18 06520 Balgat / Ankara. Web: kvkk.gov.tr"
  },
  {
    title: "9. Çerez (Cookie) Politikası",
    body: "Sitemizde yalnızca zorunlu çerezler kullanılmaktadır: Oturum çerezi (Clerk tarafından sağlanan, kimlik doğrulama için zorunlu) ve demo kullanım çerezi (vr_demo_used, tek seferlik). Reklam, profilleme veya üçüncü taraf izleme amacıyla çerez kullanılmamaktadır."
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <AppHeader />
      <article className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mb-10">Last updated: June 25, 2026</p>

          {/* English Privacy Policy */}
          <div className="space-y-8 text-slate-600 leading-relaxed text-sm mb-16">
            {SECTIONS_EN.map(section => (
              <section key={section.title}>
                <h2 className="text-base font-bold text-slate-800 mb-2">{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>

          {/* KVKK Divider */}
          <div className="border-t-2 border-slate-100 pt-12 mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-100 px-4 py-1.5 mb-4">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">🇹🇷 Türkçe — KVKK Aydınlatma Metni</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
              Kişisel Verilerin Korunması Kanunu (KVKK) Kapsamında Aydınlatma Metni
            </h2>
            <p className="text-sm text-slate-400 mb-8">
              6698 Sayılı Kişisel Verilerin Korunması Kanunu'nun 10. Maddesi Uyarınca Hazırlanmıştır
            </p>
          </div>

          {/* KVKK Sections */}
          <div className="space-y-8 text-slate-600 leading-relaxed text-sm">
            {KVKK_SECTIONS.map(section => (
              <section key={section.title} className="border-l-2 border-red-100 pl-4">
                <h2 className="text-base font-bold text-slate-800 mb-2">{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-slate-50 border border-slate-200 p-5 text-sm text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 mb-2">İletişim / Contact</p>
            <p>KVKK başvuruları için: <a href="mailto:privacy@visibilityradar.ai" className="text-indigo-600 hover:underline">privacy@visibilityradar.ai</a></p>
            <p>Genel iletişim: <a href="mailto:info@visibilityradar.ai" className="text-indigo-600 hover:underline">info@visibilityradar.ai</a></p>
            <p>Adres: Kuleli Sokak No:45/6, Gaziosmanpaşa (GOP), Ankara</p>
          </div>
        </div>
      </article>
    </main>
  );
}
