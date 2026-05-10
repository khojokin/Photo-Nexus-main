import { Layout } from "@/components/layout";
import { Link } from "wouter";

export function Terms() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Legal</p>
          <h1 className="font-serif text-5xl mb-4">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Last updated: May 2025</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="font-serif text-2xl mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Affuaa ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. We reserve the right to modify these terms at any time, and continued use of the Platform constitutes acceptance of any modifications.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">2. Use of the Platform</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Affuaa is a photography discovery and sharing platform. You agree to use the Platform only for lawful purposes and in a manner that does not infringe on the rights of others. You may not:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Upload content you do not own or have rights to share</li>
              <li>Use the Platform to distribute illegal, harmful, or offensive content</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the Platform's infrastructure</li>
              <li>Impersonate other users or misrepresent your identity</li>
              <li>Use automated tools to access the Platform without prior written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">3. Content Ownership & Licensing</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain full ownership of all photographs and content you upload to Affuaa. By uploading content, you grant Affuaa a non-exclusive, worldwide, royalty-free license to display, reproduce, and promote your content within the Platform for the purpose of operating and improving the service. You may remove your content at any time, which will terminate this license.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">4. Content Standards</h2>
            <p className="text-muted-foreground leading-relaxed">
              Affuaa is curated for quality. We reserve the right to remove content that does not meet our editorial standards, violates these terms, or is reported by the community. Content that is explicit, illegal, or harmful will be removed immediately and may result in account termination.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">5. Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the security of your account. You must not share your credentials or allow others to access your account. Affuaa is not liable for any loss or damage arising from unauthorized access to your account. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">6. Premium Subscriptions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Affuaa offers optional premium features. Subscription fees are billed in advance on a monthly or annual basis. Refunds are handled on a case-by-case basis at our discretion. You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Affuaa is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access to the Platform. To the maximum extent permitted by law, Affuaa shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">8. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by and construed in accordance with applicable law. Any disputes arising under these terms shall be resolved through binding arbitration, except where prohibited by law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, please reach out through the Platform's contact channels. We aim to respond to all enquiries within 5 business days.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex items-center gap-6 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-foreground transition-colors">Back to Affuaa</Link>
        </div>
      </div>
    </Layout>
  );
}
