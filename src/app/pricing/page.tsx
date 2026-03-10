'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, X, Zap, CreditCard, Coins, ExternalLink, Copy, CheckCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/AuthContext'

interface SubscriptionStatus {
  plan: string
  status: string
  payment_method?: string
  current_period_end?: string
}

const FREE_FEATURES = [
  { label: 'Watch up to 3 projects', included: true },
  { label: 'Basic metric signals', included: true },
  { label: 'Social signals', included: false },
  { label: 'Whale alerts', included: false },
  { label: 'Partnership signals', included: false },
  { label: 'Priority Telegram notifications', included: false },
  { label: 'Full analytics dashboard', included: false },
]

const PRO_FEATURES = [
  { label: 'Unlimited project watches', included: true },
  { label: 'All metric signals', included: true },
  { label: 'Social signals', included: true },
  { label: 'Whale alerts', included: true },
  { label: 'Partnership signals', included: true },
  { label: 'Priority Telegram notifications', included: true },
  { label: 'Full analytics dashboard', included: true },
]

export default function PricingPage() {
  const searchParams = useSearchParams()
  const { user, login } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [snrMode, setSnrMode] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  const fetchSubscription = useCallback(async () => {
    if (!user) return
    try {
      const token = localStorage.getItem('privy:token')
      const res = await fetch('/api/user/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch {
      // silently fail
    }
  }, [user])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  useEffect(() => {
    if (success) setMessage({ type: 'success', text: 'Pro subscription activated. Welcome aboard.' })
    if (canceled) setMessage({ type: 'error', text: 'Checkout canceled.' })
  }, [success, canceled])

  const handleStripeCheckout = async () => {
    if (!user) { login(); return }
    setLoading(true)
    try {
      const token = localStorage.getItem('privy:token')
      const res = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start checkout' })
        setLoading(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' })
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('privy:token')
      const res = await fetch('/api/payments/stripe/portal', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to open portal' })
        setLoading(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' })
      setLoading(false)
    }
  }

  const handleSnrVerify = async () => {
    if (!txHash.trim()) return
    setVerifying(true)
    setMessage(null)
    try {
      const token = localStorage.getItem('privy:token')
      const res = await fetch('/api/payments/snr/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tx_hash: txHash.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Pro activated via $SNR payment. You saved 25%.' })
        setSnrMode(false)
        setTxHash('')
        fetchSubscription()
      } else {
        setMessage({ type: 'error', text: data.error || 'Verification failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to verify transaction' })
    } finally {
      setVerifying(false)
    }
  }

  const copyWallet = () => {
    navigator.clipboard.writeText(process.env.NEXT_PUBLIC_PAYMENT_WALLET || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isProActive = subscription?.plan === 'pro' && subscription?.status === 'active'

  return (
    <main className="min-h-screen pt-24 pb-20 px-5 md:px-20">
      <div className="mx-auto max-w-[1400px]">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span style={{ color: 'var(--accent)' }} className="text-sm font-mono">&gt;</span>
            <span
              className="text-[10px] uppercase tracking-[0.15em] font-mono"
              style={{ color: 'var(--text-muted)' }}
            >
              Pricing
            </span>
          </div>
          <h1
            className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Choose your signal level
          </h1>
          <p
            className="text-sm font-mono max-w-xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            Free gets you started. Pro unlocks the full intelligence feed — whale alerts,
            partnership signals, priority notifications, and unlimited watches.
          </p>
        </motion.div>

        {/* Message banner */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 px-4 py-3 text-xs font-mono"
            style={{
              border: `1px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
              color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
              background: message.type === 'success' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
            }}
          >
            {message.text}
          </motion.div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-0 mt-12" style={{ border: '1px solid var(--border-strong)' }}>
          {/* Free tier */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 md:p-10"
            style={{ borderRight: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span
                className="text-[10px] uppercase tracking-[0.15em] font-mono px-2 py-0.5"
                style={{
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                Free
              </span>
            </div>

            <div className="mb-8">
              <span
                className="text-4xl font-display font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                $0
              </span>
              <span
                className="text-sm font-mono ml-1"
                style={{ color: 'var(--text-muted)' }}
              >
                /mo
              </span>
            </div>

            <div className="space-y-3 mb-10">
              {FREE_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3 text-xs font-mono">
                  {f.included ? (
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <X className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-very-muted)' }} />
                  )}
                  <span style={{ color: f.included ? 'var(--text-body)' : 'var(--text-very-muted)' }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="w-full py-2.5 text-center text-xs uppercase tracking-[0.08em] font-mono"
              style={{
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              Current plan
            </div>
          </motion.div>

          {/* Pro tier */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 md:p-10 relative"
            style={{ background: 'var(--bg-secondary)' }}
          >
            {/* Accent top line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'var(--accent)' }}
            />

            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span
                className="text-[10px] uppercase tracking-[0.15em] font-mono px-2 py-0.5"
                style={{
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-dim)',
                  background: 'var(--accent-glow)',
                }}
              >
                Pro
              </span>
            </div>

            <div className="mb-2">
              <span
                className="text-4xl font-display font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                $9.99
              </span>
              <span
                className="text-sm font-mono ml-1"
                style={{ color: 'var(--text-muted)' }}
              >
                /mo
              </span>
            </div>
            <p
              className="text-[11px] font-mono mb-8"
              style={{ color: 'var(--accent)' }}
            >
              ~$7.49/mo with $SNR (25% off)
            </p>

            <div className="space-y-3 mb-10">
              {PRO_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3 text-xs font-mono">
                  <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-success)' }} />
                  <span style={{ color: 'var(--text-body)' }}>{f.label}</span>
                </div>
              ))}
            </div>

            {isProActive ? (
              <div className="space-y-3">
                <div
                  className="w-full py-2.5 text-center text-xs uppercase tracking-[0.08em] font-mono flex items-center justify-center gap-2"
                  style={{
                    color: 'var(--color-success)',
                    border: '1px solid var(--color-success)',
                    background: 'rgba(34,197,94,0.06)',
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active
                </div>

                {subscription?.payment_method === 'stripe' ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={loading}
                    className="w-full py-2.5 text-center text-xs uppercase tracking-[0.08em] font-mono transition-colors cursor-pointer flex items-center justify-center gap-2"
                    style={{
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Manage subscription
                  </button>
                ) : subscription?.current_period_end ? (
                  <p
                    className="text-[11px] font-mono text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            ) : snrMode ? (
              <div className="space-y-4">
                <div
                  className="p-4 text-xs font-mono space-y-3"
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                  }}
                >
                  <p style={{ color: 'var(--text-body)' }}>
                    Send the required $SNR amount to:
                  </p>
                  <div className="flex items-center gap-2">
                    <code
                      className="flex-1 text-[10px] break-all p-2"
                      style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {process.env.NEXT_PUBLIC_PAYMENT_WALLET || '0x...'}
                    </code>
                    <button
                      onClick={copyWallet}
                      className="p-1.5 shrink-0 transition-colors"
                      style={{ color: copied ? 'var(--color-success)' : 'var(--text-muted)' }}
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Then paste the transaction hash below to verify.
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="0x... transaction hash"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-mono outline-none"
                  style={{
                    border: '1px solid var(--border-strong)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => { setSnrMode(false); setTxHash('') }}
                    className="flex-1 py-2.5 text-center text-xs uppercase tracking-[0.08em] font-mono transition-colors cursor-pointer"
                    style={{
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSnrVerify}
                    disabled={verifying || !txHash.trim()}
                    className="flex-1 py-2.5 text-center text-xs uppercase tracking-[0.08em] font-mono transition-colors cursor-pointer flex items-center justify-center gap-2"
                    style={{
                      color: '#fff',
                      background: txHash.trim() ? 'var(--accent)' : 'var(--text-very-muted)',
                      opacity: verifying ? 0.7 : 1,
                    }}
                  >
                    {verifying && <Loader2 className="w-3 h-3 animate-spin" />}
                    Verify
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleStripeCheckout}
                  disabled={loading}
                  className="w-full py-2.5 text-center text-xs uppercase tracking-[0.08em] font-mono transition-colors cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    color: '#fff',
                    background: 'var(--accent)',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5" />
                  )}
                  {loading ? 'Loading...' : 'Subscribe with Card — $9.99/mo'}
                </button>

                <button
                  onClick={() => {
                    if (!user) { login(); return }
                    setSnrMode(true)
                  }}
                  className="w-full py-2.5 text-center text-xs uppercase tracking-[0.08em] font-mono transition-colors cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    color: 'var(--accent)',
                    border: '1px solid var(--accent-dim)',
                    background: 'var(--accent-glow)',
                  }}
                >
                  <Coins className="w-3.5 h-3.5" />
                  Pay with $SNR — 25% off
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <p
            className="text-[11px] font-mono"
            style={{ color: 'var(--text-very-muted)' }}
          >
            All plans include core project discovery. Pro unlocks the full signal feed.
          </p>
          <p
            className="text-[11px] font-mono"
            style={{ color: 'var(--text-very-muted)' }}
          >
            $SNR payments activate instantly for 30 days on Base chain.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
