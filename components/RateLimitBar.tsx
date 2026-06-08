import styles from './RateLimitBar.module.css'

interface Props {
  used: number
  limit: number
  resetIn?: string
}

export default function RateLimitBar({ used, limit, resetIn }: Props) {
  const pct = Math.min((used / limit) * 100, 100)
  const remaining = Math.max(limit - used, 0)
  const level = pct >= 100 ? 'danger' : pct >= 70 ? 'warn' : 'ok'

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <span className={styles.label}>KUOTA HARIAN</span>
        <span className={styles.count}>
          <span className={styles[level]}>{used}</span>
          <span className={styles.slash}>/</span>
          <span>{limit}</span>
        </span>
      </div>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${styles[level]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={styles.bottom}>
        <span className={styles.remaining}>Sisa {remaining} request</span>
        {resetIn && <span className={styles.reset}>Reset dalam {resetIn}</span>}
      </div>
    </div>
  )
}
