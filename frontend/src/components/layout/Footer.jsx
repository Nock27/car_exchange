import Container from './Container'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-white dark:bg-gray-950 dark:border-gray-800">
      <Container className="flex flex-col items-center justify-between gap-4 py-6 text-sm text-neutral-600 dark:text-neutral-300 md:flex-row">
        <p>© {new Date().getFullYear()} AutoDeal. All rights reserved.</p>
        <nav className="flex items-center gap-4">
          <Link
            to="/terms"
            className="hover:text-neutral-900 dark:hover:text-white"
          >
            Terms
          </Link>
          <Link
            to="/privacy"
            className="hover:text-neutral-900 dark:hover:text-white"
          >
            Privacy
          </Link>
          <a
            href="mailto:support@example.com"
            className="hover:text-neutral-900 dark:hover:text-white"
          >
            Contact
          </a>
        </nav>
      </Container>
    </footer>
  )
}
