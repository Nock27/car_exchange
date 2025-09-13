import Container from '@/components/layout/Container'
import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="py-10">
      <Container className="prose prose-neutral max-w-3xl dark:prose-invert">
        <h1>Terms & Conditions</h1>
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

        <p>
          Welcome to <strong>AutoDeal</strong> (“we”, “us”, “our”). By accessing or using autodeal.bg
          (the “Platform”), you agree to these Terms & Conditions (“Terms”). If you do not accept the Terms,
          please do not use the Platform.
        </p>

        <h2>1. About AutoDeal</h2>
        <p>
          AutoDeal is an online marketplace that allows users to create, browse, and manage vehicle listings.
          We do not own the vehicles listed and we are not a party to transactions between buyers and sellers.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years old and capable of entering into a binding contract to use the Platform.
        </p>

        <h2>3. Accounts & Security</h2>
        <ul>
          <li>You are responsible for the accuracy of the information you provide.</li>
          <li>Keep your login credentials secure and do not share them with others.</li>
          <li>Notify us promptly of any unauthorized use of your account.</li>
        </ul>

        <h2>4. Listings</h2>
        <ul>
          <li>Listings must be accurate, lawful, and not misleading.</li>
          <li>You must have the right to sell or advertise the vehicle.</li>
          <li>We may edit, hide, or remove listings that violate these Terms or applicable law.</li>
        </ul>

        <h2>5. Prohibited Activities</h2>
        <ul>
          <li>Posting illegal, fraudulent, or infringing content.</li>
          <li>Scraping, harvesting, or reverse engineering the Platform.</li>
          <li>Interfering with Platform security or other users’ use.</li>
        </ul>

        <h2>6. Fees</h2>
        <p>
          Certain premium features may be charged. We will disclose fees before you commit to a purchase.
          Taxes may apply depending on your jurisdiction.
        </p>

        <h2>7. No Warranty</h2>
        <p>
          The Platform is provided “as is” and “as available.” AutoDeal disclaims all warranties to the maximum
          extent permitted by law, including fitness for a particular purpose and non-infringement.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, AutoDeal shall not be liable for indirect, incidental, special,
          consequential, or punitive damages, or for lost profits, data, or goodwill.
        </p>

        <h2>9. Indemnification</h2>
        <p>
          You agree to indemnify and hold AutoDeal and its affiliates harmless from any claims arising out of
          your use of the Platform, your content, or your violation of these Terms or applicable law.
        </p>

        <h2>10. Changes to the Terms</h2>
        <p>
          We may update these Terms from time to time. Changes take effect when posted on the Platform.
        </p>

        <h2>11. Contact</h2>
        <p>
          AutoDeal · Sliven, bul svoboda Plovdiv 68A ·
          <a href="mailto:autodeal@gmail.com"> autodeal@gmail.com</a> ·
          <a href="tel:+359894459579"> 089 445 9579</a>
        </p>

        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          This boilerplate is for general information only and does not constitute legal advice.
        </p>

        <p>
          See also our <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </Container>
    </div>
  )
}
