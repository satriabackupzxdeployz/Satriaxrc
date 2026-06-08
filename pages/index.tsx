import { useEffect, useState } from 'react'
import Head from 'next/head'
import Preloader from '../components/Preloader'
import ApiKeyBadge from '../components/ApiKeyBadge'
import RateLimitBar from '../components/RateLimitBar'
import ReactForm from '../components/ReactForm'
import DocsPage from '../components/DocsPage'
import { IconBook, IconZap } from '../components/Icons'
import styles from './index.module.css'

const RL_KEY = 'sdt_rl_v2'
const LIMIT = 20
const WINDOW_MS = 7200000

function getLocalRateData(): { count: number; resetAt: number; resetIn: string } {
  if (typeof window === 'undefined') return { count: 0, resetAt: Date.now() + WINDOW_MS, resetIn: '2h 0m' }
  try {
    const raw = localStorage.getItem(RL_KEY)
    if (!raw) return { count: 0, resetAt: Date.now() + WINDOW_MS, resetIn: '2h 0m' }
    const d = JSON.parse(raw)
    if (Date.now() > d.resetAt) return { count: 0, resetAt: Date.now() + WINDOW_MS, resetIn: '2h 0m' }
    const ms = Math.max(0, d.resetAt - Date.now())
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return { ...d, resetIn: `${h}h ${m}m` }
  } catch { return { count: 0, resetAt: Date.now() + WINDOW_MS, resetIn: '2h 0m' } }
}

function getCookieKey(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/sdt_apikey=([^;]+)/)
  return match ? match[1] : ''
}

export default function HomePage() {
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState<'home' | 'docs'>('home')
  const [apiKey, setApiKey] = useState('')
  const [rlUsed, setRlUsed] = useState(0)
  const [rlResetIn, setRlResetIn] = useState('2h 0m')

  useEffect(() => {
    const rl = getLocalRateData()
    setRlUsed(rl.count)
    setRlResetIn(rl.resetIn)
    const interval = setInterval(() => {
      const d = getLocalRateData()
      setRlUsed(d.count)
      setRlResetIn(d.resetIn)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!ready) return
    const fromCookie = getCookieKey()
    if (fromCookie) {
      setApiKey(fromCookie)
      return
    }
    fetch('/api/register')
      .then(r => r.json())
      .then(d => { if (d.apiKey) setApiKey(d.apiKey) })
      .catch(() => {})
  }, [ready])

  const handleRateLimitUpdate = (used: number, resetIn: string) => {
    setRlUsed(used)
    setRlResetIn(resetIn)
    try {
      const raw = localStorage.getItem(RL_KEY)
      const existing = raw ? JSON.parse(raw) : { resetAt: Date.now() + WINDOW_MS }
      localStorage.setItem(RL_KEY, JSON.stringify({ count: used, resetAt: existing.resetAt }))
    } catch {}
  }

  return (
    <>
      <Head>
        <title>SatriaDevs — WA Channel Reaction</title>
        <meta name="description" content="Tool untuk mengirim reaksi emoji ke WhatsApp Channel" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg>" />
      </Head>

      {!ready && <Preloader onDone={() => setReady(true)} />}

      {ready && (
        <main className={styles.main}>
          {page === 'home' ? (
            <div className={styles.wrap}>
              <nav className={styles.nav}>
                <span className={styles.brand}>satriadevs</span>
                <button className={styles.docsBtn} onClick={() => setPage('docs')}>
                  <IconBook />
                  <span>API Docs</span>
                </button>
              </nav>

              <header className={styles.header}>
                <div className={styles.badge}>
                  <IconZap />
                  <span>WA REACTION TOOL</span>
                </div>
                <h1 className={styles.title}>Kirim Reaksi ke<br />Channel WhatsApp</h1>
                <p className={styles.subtitle}>
                  Otomatis kirim reaksi emoji ke postingan WhatsApp Channel. Dukung integrasi via API.
                </p>
              </header>

              <div className={styles.card}>
                {apiKey && <ApiKeyBadge apiKey={apiKey} />}
                <RateLimitBar used={rlUsed} limit={LIMIT} resetIn={rlResetIn} />
                <ReactForm apiKey={apiKey} onRateLimitUpdate={handleRateLimitUpdate} />
              </div>

              <footer className={styles.footer}>
                <span className={styles.footerText}>Satriadevs · 2024</span>
                <div className={styles.footerLinks}>
                  <a href="https://whatsapp.com/channel/0029VbBO6h6LY6czYDJ3bc1I" target="_blank" rel="noreferrer" className={styles.footerLink}>WhatsApp</a>
                  <a href="https://saweria.co/satriadev" target="_blank" rel="noreferrer" className={styles.footerLink}>Donasi</a>
                </div>
              </footer>
            </div>
          ) : (
            <DocsPage onBack={() => setPage('home')} />
          )}
        </main>
      )}
    </>
  )
}
