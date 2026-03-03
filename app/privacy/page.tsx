import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Masakyuk",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-4 text-sm text-gray-500">
        Last updated: March 3, 2026
      </p>

      <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            1. Information We Collect
          </h2>
          <p className="mt-3">
            We may collect information that you provide directly when using
            Masakyuk, including but not limited to your name, email address, and
            usage data. We also automatically collect certain technical
            information such as your device type, browser, IP address, and pages
            visited.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            2. How We Use Your Information
          </h2>
          <p className="mt-3">
            We use the information we collect to operate, maintain, and improve
            Masakyuk; to personalize your experience and deliver relevant recipe
            recommendations; to communicate with you about updates and changes
            to the service; and to monitor and analyze usage trends.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            3. Data Sharing
          </h2>
          <p className="mt-3">
            We do not sell your personal information to third parties. We may
            share information with trusted service providers who assist us in
            operating the platform, provided they agree to keep your information
            confidential. We may also disclose information when required by law
            or to protect our rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Cookies</h2>
          <p className="mt-3">
            Masakyuk uses cookies and similar tracking technologies to enhance
            your browsing experience, analyze site traffic, and understand how
            users interact with our service. You can control cookie preferences
            through your browser settings. Disabling cookies may limit certain
            features of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Contact</h2>
          <p className="mt-3">
            If you have any questions or concerns about this Privacy Policy,
            please contact us at{" "}
            <a
              href="mailto:privacy@masakyuk.com"
              className="text-amber-600 underline hover:text-amber-700"
            >
              privacy@masakyuk.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
