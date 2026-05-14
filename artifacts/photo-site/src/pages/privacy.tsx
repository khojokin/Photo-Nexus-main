import { Layout } from "@/components/layout";
import { Link } from "wouter";

export function Privacy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Legal</p>
          <h1 className="font-serif text-5xl mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: May 2025</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="font-serif text-2xl mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Affuaa ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share information about you when you use our Platform. By using Affuaa, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <span className="text-foreground font-medium">Account information:</span> Name, email address, and profile details you provide when creating an account.
              </li>
              <li>
                <span className="text-foreground font-medium">Content you upload:</span> Photographs, captions, tags, and other metadata you submit to the Platform.
              </li>
              <li>
                <span className="text-foreground font-medium">Usage data:</span> Pages visited, features used, search queries, and interactions such as likes and downloads.
              </li>
              <li>
                <span className="text-foreground font-medium">Device information:</span> Browser type, operating system, IP address, and device identifiers for analytics and security purposes.
              </li>
              <li>
                <span className="text-foreground font-medium">Payment information:</span> When you subscribe to premium features, payment details are processed securely by our payment provider (Stripe). We do not store full card numbers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Provide, operate, and improve the Platform</li>
              <li>Personalise your experience and curate content recommendations</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important notifications about your account or the Platform</li>
              <li>Detect, prevent, and respond to security incidents or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">4. Cookies & Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to maintain your session, remember your preferences, and understand how you use the Platform. You can control cookie settings through your browser, though disabling certain cookies may affect Platform functionality. We use session cookies for authentication and persistent cookies for preferences such as theme.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">5. Sharing of Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We may share your information with:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li><span className="text-foreground font-medium">Service providers:</span> Third parties that help us operate the Platform, such as hosting, analytics, and payment processors, under strict confidentiality agreements.</li>
              <li><span className="text-foreground font-medium">Law enforcement:</span> When required by law or to protect the rights and safety of Affuaa, our users, or the public.</li>
              <li><span className="text-foreground font-medium">Business transfers:</span> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time by contacting us. Some information may be retained for a limited period to comply with legal obligations or resolve disputes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict certain processing of your data</li>
              <li>Data portability — receive your data in a machine-readable format</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, please contact us through the Platform. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">8. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your information, including encrypted connections (HTTPS), secure session management, and access controls. No system is completely secure, and we cannot guarantee absolute security. Please notify us immediately if you suspect any unauthorised access to your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Affuaa is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the Platform or sending you an email. Your continued use of the Platform after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions or concerns about this Privacy Policy or how we handle your data, please reach out through the Platform's contact channels.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex items-center gap-6 text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-foreground transition-colors">Back to Affuaa</Link>
        </div>
      </div>
    </Layout>
  );
}
