import { useState, useRef } from 'react'
import axios from 'axios'
import { IconSend, IconLink, IconSmile } from './Icons'
import styles from './ReactForm.module.css'

interface Props {
  apiKey: string
  onRateLimitUpdate: (used: number, resetIn: string) => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const LOADING_STEPS = [
  'Menghubungi server...',
  'Memvalidasi channel...',
  'Menginjeksi reaksi...',
  'Menunggu konfirmasi...',
]

export default function ReactForm({ apiKey, onRateLimitUpdate }: Props) {
  const [url, setUrl] = useState('')
  const [emoji, setEmoji] = useState('')
  const [emojiHint, setEmojiHint] = useState<'idle' | 'ok' | 'err'>('idle')
  const [status, setStatus] = useState<Status>('idle')
  const [loadStep, setLoadStep] = useState(0)
  const [resultMsg, setResultMsg] = useState('')
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const validateEmoji = (raw: string) => {
    const re = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu
    return re.test(raw)
  }

  const handleEmojiChange = (val: string) => {
    setEmoji(val)
    if (!val.trim()) { setEmojiHint('idle'); return }
    setEmojiHint(validateEmoji(val) ? 'ok' : 'err')
  }

  const startStepCycle = () => {
    let i = 0
    setLoadStep(0)
    stepTimerRef.current = setInterval(() => {
      i = (i + 1) % LOADING_STEPS.length
      setLoadStep(i)
    }, 1300)
  }

  const stopStepCycle = () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current)
  }

  const triggerRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current
    if (!btn) return
    const r = document.createElement('span')
    const rect = btn.getBoundingClientRect()
    const size = Math.max(btn.offsetWidth, btn.offsetHeight)
    r.className = styles.ripple
    r.style.width = r.style.height = `${size}px`
    r.style.left = `${e.clientX - rect.left - size / 2}px`
    r.style.top = `${e.clientY - rect.top - size / 2}px`
    btn.appendChild(r)
    setTimeout(() => r.remove(), 600)
  }

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRipple(e)

    if (!url.trim()) {
      setStatus('error')
      setResultMsg('URL Channel WhatsApp tidak boleh kosong.')
      return
    }
    if (!emoji.trim() || !validateEmoji(emoji)) {
      setStatus('error')
      setResultMsg('Masukkan emoji yang valid. Contoh: 🔥❤️😂')
      return
    }

    setStatus('loading')
    setResultMsg('')
    startStepCycle()

    try {
      const params = new URLSearchParams({ link: url, emoji, apikey: apiKey })
      const res = await axios.get(`/api/rch/linkch?${params}`)
      stopStepCycle()
      if (res.data.success) {
        setStatus('success')
        setResultMsg(`Reaksi berhasil dikirim.\nEmoji: ${res.data.data?.emojis || emoji}`)
        if (res.data.rateLimit) {
          onRateLimitUpdate(res.data.rateLimit.used, res.data.rateLimit.resetIn)
        }
      } else {
        setStatus('error')
        setResultMsg(res.data.error || 'Terjadi kesalahan.')
      }
    } catch (err: any) {
      stopStepCycle()
      const msg = err.response?.data?.error || 'Gagal terhubung ke server.'
      if (err.response?.status === 429) {
        const rl = err.response.data?.rateLimit
        setResultMsg(`Rate limit tercapai (${rl?.used}/${rl?.limit}). Reset dalam ${rl?.resetIn}.`)
        if (rl) onRateLimitUpdate(rl.used, rl.resetIn)
      } else {
        setResultMsg(msg)
      }
      setStatus('error')
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.field}>
        <label className={styles.label}>
          <span className={styles.labelIcon}><IconLink /></span>
          URL Channel
        </label>
        <input
          className={styles.input}
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://whatsapp.com/channel/..."
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          <span className={styles.labelIcon}><IconSmile /></span>
          Emoji (maks. 3)
        </label>
        <input
          className={`${styles.input} ${emojiHint === 'err' ? styles.inputErr : emojiHint === 'ok' ? styles.inputOk : ''}`}
          type="text"
          value={emoji}
          onChange={e => handleEmojiChange(e.target.value)}
          placeholder="Contoh: 🔥❤️😂"
          spellCheck={false}
          autoComplete="off"
        />
        <p className={`${styles.hint} ${emojiHint === 'ok' ? styles.hintOk : emojiHint === 'err' ? styles.hintErr : styles.hintIdle}`}>
          {emojiHint === 'ok' && 'Format emoji valid'}
          {emojiHint === 'err' && 'Input harus mengandung emoji'}
          {emojiHint === 'idle' && 'Sistem otomatis memisahkan dengan koma'}
        </p>
      </div>

      <button
        ref={btnRef}
        className={`${styles.btn} ${status === 'loading' ? styles.btnLoading : ''}`}
        onClick={handleSubmit}
        disabled={status === 'loading'}
      >
        <span className={styles.btnContent}>
          {status === 'loading' ? (
            <>
              <span className={styles.spinner} />
              <span className={styles.loadText}>{LOADING_STEPS[loadStep]}</span>
            </>
          ) : (
            <>
              <IconSend />
              <span>Kirim Reaksi</span>
            </>
          )}
        </span>
      </button>

      {status !== 'idle' && status !== 'loading' && (
        <div className={`${styles.result} ${status === 'success' ? styles.resultOk : styles.resultErr}`}>
          <p className={styles.resultText}>{resultMsg}</p>
        </div>
      )}
    </div>
  )
}
