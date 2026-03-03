import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Masakyuk",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-4 text-sm text-gray-500">
        Last updated: March 3, 2026
      </p>

      <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            1. Acceptance of Terms
          </h2>
          <p className="mt-3">
            By accessing and using Masakyuk, you accept and agree to be bound by
            these Terms of Service. If you do not agree to these terms, you
            should not use the service. We reserve the right to update or modify
            these terms at any time, and your continued use of Masakyuk
            constitutes acceptance of any changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            2. Use License
          </h2>
          <p className="mt-3">
            Permission is granted to temporarily access and use Masakyuk for
            personal, non-commercial purposes. This license does not include the
            right to modify or copy the materials; use the materials for any
            commercial purpose; attempt to reverse-engineer any software
            contained within the service; or remove any copyright or proprietary
            notations from the materials.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            3. Disclaimer
          </h2>
          <p className="mt-3">
            The materials and recipes on Masakyuk are provided on an
            &ldquo;as-is&rdquo; basis. We make no warranties, expressed or
            implied, and hereby disclaim all other warranties including, without
            limitation, implied warranties of merchantability, fitness for a
            particular purpose, or non-infringement of intellectual property.
            Masakyuk does not warrant or make any representations concerning the
            accuracy, likely results, or reliability of the recipes or other
            content on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            4. Limitations
          </h2>
          <p className="mt-3">
            In no event shall Masakyuk or its suppliers be liable for any
            damages (including, without limitation, damages for loss of data or
            profit, or due to business interruption) arising out of the use or
            inability to use the service, even if Masakyuk has been notified of
            the possibility of such damage. Some jurisdictions do not allow
            limitations on implied warranties or liability for incidental
            damages, so these limitations may not apply to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            5. Governing Law
          </h2>
          <p className="mt-3">
            These terms and conditions are governed by and construed in
            accordance with the laws of the Republic of Indonesia. You
            irrevocably submit to the exclusive jurisdiction of the courts in
            that location for any disputes arising out of or relating to these
            Terms of Service.
          </p>
        </section>
      </div>
    </div>
  );
}
