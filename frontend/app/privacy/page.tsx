import AppHeader from "@/components/AppHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "VisibilityRadar Privacy Policy — how we collect, use, and protect your data.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <AppHeader />
      <article className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mb-10">Last updated: June 24, 2026</p>

          <div className="space-y-8 text-slate-600 leading-relaxed text-sm">
            {[
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
                title: "9. Changes to This Policy",
                body: "We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on the service. Your continued use of VisibilityRadar after changes constitutes acceptance of the updated policy."
              },
              {
                title: "10. Contact",
                body: "For privacy-related questions, contact us at privacy@visibilityradar.ai or use the contact form at visibilityradar.ai/contact."
              },
            ].map(section => (
              <section key={section.title}>
                <h2 className="text-base font-bold text-slate-800 mb-2">{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
