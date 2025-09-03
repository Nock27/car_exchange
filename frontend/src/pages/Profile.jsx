import { useEffect, useState } from 'react'
import Container from '@/components/layout/Container'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { api, endpoints } from '@/lib/api'

function pickApiErrors(err) {
  // Try to pull the most helpful messages from DRF responses
  const data = err?.response?.data
  if (!data || typeof data !== 'object') return { form: 'Could not save.' }

  const first = (val) =>
    Array.isArray(val) ? String(val[0]) : (typeof val === 'string' ? val : null)

  const out = {}
  if (data.email) out.email = first(data.email)
  if (data.phone_e164) out.phone_e164 = first(data.phone_e164)
  if (data.non_field_errors) out.form = first(data.non_field_errors)
  if (!out.email && !out.phone_e164 && !out.form) out.form = 'Could not save.'
  return out
}

export default function Profile() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [ok, setOk] = useState('')
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ email: '', phone_e164: '' })

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(endpoints.profile)
        if (!alive) return
        setEmail(data?.email || '')
        setPhone(data?.phone_e164 || '')
      } catch (e) {
        setFormError('Failed to load your profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const onSave = async (e) => {
    e.preventDefault()
    setOk('')
    setFormError('')
    setFieldErrors({ email: '', phone_e164: '' })

    // very light client-side check for phone
    const clean = (phone || '').replace(/[^\d+]/g, '')
    if (!clean) {
      setFieldErrors({ email: '', phone_e164: 'Please enter your phone number (e.g. +35988XXXXXXX).' })
      return
    }
    if (!/^\+?\d{6,15}$/.test(clean)) {
      setFieldErrors({ email: '', phone_e164: 'Enter a valid phone number (6–15 digits, can start with +).' })
      return
    }

    try {
      setSaving(true)
      const { data } = await api.patch(endpoints.profile, {
        email: (email || '').trim(),
        phone_e164: clean,
      })
      setEmail(data?.email || '')
      setPhone(data?.phone_e164 || '')
      setOk('Saved.')
    } catch (e) {
      const errs = pickApiErrors(e)
      setFieldErrors({
        email: errs.email || '',
        phone_e164: errs.phone_e164 || '',
      })
      setFormError(errs.form || '')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="py-8">
      <h2 className="mb-4 text-2xl font-semibold">My Profile</h2>

      <Card className="max-w-2xl p-4">
        <form onSubmit={onSave} className="grid gap-4">
          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              disabled={loading}
              aria-invalid={!!fieldErrors.email}
            />
            <p className="mt-1 text-xs text-neutral-500">
              This email is unique to your account and appears on your listings.
            </p>
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <div className="flex items-center justify-between">
              <label className="mb-1 block text-sm font-medium">
                Mobile (E.164)
              </label>
              <span className="text-xs text-red-600">*</span>
            </div>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+35988XXXXXXX"
              disabled={loading}
              aria-invalid={!!fieldErrors.phone_e164}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Required to post listings.
            </p>
            {fieldErrors.phone_e164 && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.phone_e164}</p>
            )}
          </div>

          {/* Form-level error / ok */}
          {formError && (
            <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
              {formError}
            </div>
          )}
          {ok && (
            <div className="rounded-md border border-green-300 bg-green-50 p-2 text-sm text-green-700">
              {ok}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  )
}
