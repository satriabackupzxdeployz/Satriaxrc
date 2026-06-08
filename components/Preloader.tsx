import { useEffect, useState } from 'react'
import styles from './Preloader.module.css'

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('Memuat sistem...')

  const steps = [
    { label: 'Memuat sistem...', pct: 30 },
    { label: 'Memeriksa koneksi...', pct: 60 },
    { label: 'Mengambil API Key...', pct: 85 },
    { label: 'Siap.', pct: 100 },
  ]

  useEffect(() => {
    let i = 0
    const tick = () => {
      if (i >= steps.length) { setTimeout(onDone, 300); return }
      setStep(steps[i].label)
      setProgress(steps[i].pct)
      i++
      setTimeout(tick, i === steps.length ? 250 : 420)
    }
    const t = setTimeout(tick, 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <p className={styles.brand}>satriadevs</p>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.status}>{step}</p>
      </div>
    </div>
  )
}
