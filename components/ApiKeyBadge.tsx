import { useState } from 'react'
import { IconKey, IconCopy, IconCheck } from './Icons'
import styles from './ApiKeyBadge.module.css'

interface Props {
  apiKey: string
}

export default function ApiKeyBadge({ apiKey }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.labelRow}>
        <span className={styles.icon}><IconKey /></span>
        <span className={styles.label}>API KEY ANDA</span>
        <span className={styles.dot} />
        <span className={styles.sub}>Gunakan untuk request endpoint</span>
      </div>
      <div className={styles.keyRow}>
        <code className={styles.keyText}>{apiKey}</code>
        <button className={styles.copyBtn} onClick={handleCopy} title="Salin API Key">
          {copied ? <IconCheck /> : <IconCopy />}
          <span>{copied ? 'Disalin' : 'Salin'}</span>
        </button>
      </div>
    </div>
  )
}
