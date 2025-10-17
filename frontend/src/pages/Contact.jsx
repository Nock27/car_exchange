// src/pages/Contact.jsx
import Container from '@/components/layout/Container'
import Card from '@/components/ui/Card'

function maskLink(s, every = 3) {
  // Inserts zero-width spaces so browsers don't auto-link
  const ZWSP = '\u200B'
  let out = ''
  for (let i = 0; i < s.length; i++) {
    out += s[i]
    if (s[i] !== '@' && s[i] !== '.' && (i + 1) % every === 0 && i !== s.length - 1) {
      out += ZWSP
    }
  }
  return out
}

export default function Contact() {
  const company = 'AutoDeal'
  const address = 'Sliven, bul. Svoboda Plovdiv 68A'
  const phoneRaw = '089 445 9579'
  const emailRaw = 'autodeal@gmail.com'

  // Mask phone and email to prevent auto-linking while keeping the same look
  const phone = maskLink(phoneRaw.replace(/\s+/g, ' '))
  const email = maskLink(emailRaw, 2)

  return (
    <div className="py-8">
      <Container>
        <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white">Contact</h1>
        <p className="mb-6 text-neutral-600 dark:text-neutral-300">
          Get in touch with {company}. Below are our contact details.
        </p>

        <Card>
          <div className="space-y-3 text-sm leading-6 text-neutral-800 dark:text-neutral-100">
            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">Company</span>
              <span>{company}</span>
            </div>

            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">Address</span>
              <span>{address}</span>
            </div>

            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">Phone</span>
              {/* Render as plain text, masked to avoid auto-link */}
              <span>{phone}</span>
            </div>

            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">Email</span>
              {/* Render as plain text, masked to avoid auto-link */}
              <span>{email}</span>
            </div>

            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">Working hours</span>
              <span>Mon–Fri 09:00–18:00</span>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  )
}
