import Container from '@/components/layout/Container'

export default function Privacy() {
  return (
    <div className="py-10">
      <Container className="prose prose-neutral max-w-3xl dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

        <p>
          This Privacy Policy explains how <strong>AutoDeal</strong> (“we”, “us”, “our”) collects, uses,
          and safeguards information when you use our website and services (the “Platform”).
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li><strong>Account & profile data:</strong> name, email, contact details.</li>
          <li><strong>Listing data:</strong> vehicle details, photos, location, pricing.</li>
          <li><strong>Usage data:</strong> log data, device/browser info, cookies.</li>
          <li><strong>Communications:</strong> messages you send us (e.g., support, contact forms).</li>
        </ul>

        <h2>2. How We Use Information</h2>
        <ul>
          <li>Provide and improve the Platform and its features.</li>
          <li>Enable listing creation, search, and messaging between users.</li>
          <li>Prevent fraud, enforce Terms, and maintain security.</li>
          <li>Send important notices about your account or service updates.</li>
        </ul>

        <h2>3. Legal Bases (where applicable)</h2>
        <ul>
          <li>Contract (to provide the service you request).</li>
          <li>Legitimate interests (e.g., security, improvement, analytics).</li>
          <li>Consent (e.g., certain cookies/marketing, where required).</li>
          <li>Legal obligations (e.g., to comply with law or requests from authorities).</li>
        </ul>

        <h2>4. Sharing</h2>
        <p>
          We may share data with service providers (hosting, analytics, payment, support) under contracts that
          protect your information. We may disclose information to comply with law or protect rights and safety.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We keep personal data only as long as necessary for the purposes described here or as required by law.
          You may request deletion of your account data subject to legal/legitimate retention needs.
        </p>

        <h2>6. Your Rights</h2>
        <ul>
          <li>Access, correct, or delete your personal data.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Withdraw consent where processing is based on consent.</li>
          <li>Data portability (where applicable).</li>
        </ul>

        <h2>7. Cookies</h2>
        <p>
          We use cookies and similar technologies to run the site, keep you signed in, remember preferences, and
          analyze traffic. You can manage cookies via your browser settings; disabling some cookies may affect
          functionality.
        </p>

        <h2>8. Security</h2>
        <p>
          We implement reasonable technical and organizational measures to protect personal data. No method of
          transmission or storage is 100% secure.
        </p>

        <h2>9. Children</h2>
        <p>
          The Platform is not directed to children under 16. If you believe we have collected data from a child,
          contact us and we will take appropriate steps.
        </p>

        <h2>10. Changes</h2>
        <p>
          We may update this policy periodically. Continued use of the Platform after changes means you accept
          the updated policy.
        </p>

        <h2>11. Contact</h2>
        <p>
          AutoDeal · Sliven, bul svoboda Plovdiv 68A ·
          <a href="mailto:autodeal@gmail.com"> autodeal@gmail.com</a> ·
          <a href="tel:+359894459579"> 089 445 9579</a>
        </p>
      </Container>
    </div>
  )
}
