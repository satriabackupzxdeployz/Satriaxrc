import { useState, useEffect } from 'react'
import CodeBlock from './CodeBlock'
import { IconArrowLeft, IconBook, IconAlert } from './Icons'
import styles from './DocsPage.module.css'

interface Props {
  onBack: () => void
}

const TABS = ['cURL', 'JavaScript', 'Node.js', 'Python'] as const
type Tab = typeof TABS[number]

function buildCode(domain: string): Record<Tab, { code: string; lang: string }> {
  return {
    'cURL': {
      lang: 'bash',
      code: `curl -X GET "${domain}/api/rch/linkch?link={link_channel}&emoji={emoji}&apikey={apikey}" \\
  -H "Accept: application/json"`,
    },
    'JavaScript': {
      lang: 'js',
      code: `const sendReaction = async () => {
  const params = new URLSearchParams({
    link:   "https://whatsapp.com/channel/LINKMU",
    emoji:  "🔥,❤️,😂",
    apikey: "Satria-xxxxxxxxxxxx"
  })

  const res = await fetch(\`${domain}/api/rch/linkch?\${params}\`)
  const data = await res.json()
  console.log(data)
}

sendReaction()`,
    },
    'Node.js': {
      lang: 'js',
      code: `const axios = require('axios')

async function sendReaction(link, emoji, apiKey) {
  try {
    const response = await axios.get('${domain}/api/rch/linkch', {
      params: { link, emoji, apikey: apiKey },
      timeout: 30000
    })
    return response.data
  } catch (err) {
    if (err.response?.status === 429) {
      console.log('Tunggu 2 jam untuk reset')
    }
    throw err
  }
}

sendReaction(
  'https://whatsapp.com/channel/LINKMU',
  '🔥,❤️',
  'Satria-xxxxxxxxxxxx'
).then(console.log)`,
    },
    'Python': {
      lang: 'python',
      code: `import requests

def send_reaction(link: str, emoji: str, api_key: str):
    url = "${domain}/api/rch/linkch"
    params = {
        "link":   link,
        "emoji":  emoji,
        "apikey": api_key
    }
    try:
        r = requests.get(url, params=params, timeout=30)
        if r.status_code == 429:
            print("Rate limit. Tunggu 2 jam.")
            return None
        return r.json()
    except Exception as e:
        print(f"Error: {e}")

send_reaction(
    "https://whatsapp.com/channel/LINKMU",
    "🔥,❤️,😂",
    "Satria-xxxxxxxxxxxx"
)`,
    },
  }
}

const RES_OK = `{
  "success": true,
  "author":  "Satriadevs",
  "data": {
    "url":     "https://whatsapp.com/channel/...",
    "emojis":  "🔥,❤️",
    "message": "Reaksi berhasil dikirim",
    "details": ["berhasil"]
  },
  "rateLimit": {
    "used":      3,
    "limit":     20,
    "remaining": 17,
    "resetIn":   "1h 47m"
  }
}`

const RES_ERR = `{
  "success": false,
  "error":   "Rate limit tercapai.",
  "rateLimit": {
    "used":      20,
    "limit":     20,
    "remaining": 0,
    "resetIn":   "0h 43m"
  }
}`

export default function DocsPage({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>('cURL')
  const [domain, setDomain] = useState('https://yourdomain.com')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDomain(window.location.origin)
    }
  }, [])

  const CODE = buildCode(domain)

  return (
    <div className={styles.wrap}>
      <button className={styles.back} onClick={onBack}>
        <IconArrowLeft />
        <span>Kembali</span>
      </button>

      <div className={styles.hero}>
        <div className={styles.heroTag}>
          <IconBook />
          <span>Dokumentasi API</span>
        </div>
        <h1 className={styles.heroTitle}>WA Channel Reaction API</h1>
        <p className={styles.heroDesc}>
          Integrasikan reaksi WhatsApp Channel ke bot, web app, atau aplikasi Anda. Domain terdeteksi otomatis: <code style={{ color: '#666', fontSize: '0.8rem' }}>{domain}</code>
        </p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Rate Limiting</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>Limit per IP</span>
            <span className={styles.infoVal}>20 request</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>Window</span>
            <span className={styles.infoVal}>2 jam</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>Tracking via</span>
            <span className={styles.infoVal}>IP + API Key</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>Limit exceeded</span>
            <span className={styles.infoVal}>HTTP 429</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Endpoint</h2>
        <div className={styles.endpointCard}>
          <div className={styles.endpointHeader}>
            <span className={styles.methodGet}>GET</span>
            <code className={styles.endpointPath}>/api/rch/linkch</code>
          </div>
          <p className={styles.endpointDesc}>
            Mengirim reaksi emoji ke postingan WhatsApp Channel. Memerlukan API Key aktif dari halaman utama.
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Tipe</th>
                <th>Wajib</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code className={styles.paramName}>link</code></td>
                <td><span className={styles.paramType}>string</span></td>
                <td><span className={styles.required}>Ya</span></td>
                <td className={styles.paramDesc}>URL lengkap postingan channel WA</td>
              </tr>
              <tr>
                <td><code className={styles.paramName}>emoji</code></td>
                <td><span className={styles.paramType}>string</span></td>
                <td><span className={styles.optional}>Opsional</span></td>
                <td className={styles.paramDesc}>Maks. 3 emoji, pisahkan koma. Default: 🔥</td>
              </tr>
              <tr>
                <td><code className={styles.paramName}>apikey</code></td>
                <td><span className={styles.paramType}>string</span></td>
                <td><span className={styles.required}>Ya</span></td>
                <td className={styles.paramDesc}>API Key dari halaman utama (awalan Satria-...)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Contoh Request</h2>
        <div className={styles.tabsCard}>
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t}
                className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <CodeBlock code={CODE[tab].code} lang={CODE[tab].lang} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Format Response</h2>
        <div className={styles.responseWrap}>
          <div className={styles.responseLabel}>
            <span className={styles.status200}>200</span>
            <span className={styles.statusDesc}>Berhasil</span>
          </div>
          <CodeBlock code={RES_OK} lang="json" />
        </div>
        <div className={styles.responseWrap}>
          <div className={styles.responseLabel}>
            <span className={styles.status429}>429</span>
            <span className={styles.statusDesc}>Rate Limit Exceeded</span>
          </div>
          <CodeBlock code={RES_ERR} lang="json" />
        </div>
      </section>

      <div className={styles.notice}>
        <IconAlert />
        <p>API Key bersifat permanen per IP dan disimpan sebagai cookie 1 tahun. Tidak akan berubah saat refresh.</p>
      </div>
    </div>
  )
}
