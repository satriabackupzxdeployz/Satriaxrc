import { useState } from 'react'
import { IconCopy, IconCheck } from './Icons'
import styles from './CodeBlock.module.css'

interface Token {
  type: 'key' | 'str' | 'num' | 'cmt' | 'fn' | 'op' | 'kw' | 'url' | 'var' | 'plain'
  val: string
}

function tokenizeLine(line: string, lang: string): Token[] {
  const tokens: Token[] = []
  let idx = 0
  while (idx < line.length) {
    const strM = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/.exec(line.slice(idx))
    if (strM && strM.index === 0) { tokens.push({ type: 'str', val: strM[0] }); idx += strM[0].length; continue }
    const kwRe = /\b(const|let|var|async|await|function|return|if|else|try|catch|throw|new|import|from|export|default|of|for|in|def|print|None|True|False)\b/
    const kwM = kwRe.exec(line.slice(idx))
    if (kwM && kwM.index === 0) { tokens.push({ type: 'kw', val: kwM[0] }); idx += kwM[0].length; continue }
    const fnM = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/.exec(line.slice(idx))
    if (fnM) { tokens.push({ type: 'fn', val: fnM[1] }); idx += fnM[1].length; continue }
    const numM = /^\d+/.exec(line.slice(idx))
    if (numM) { tokens.push({ type: 'num', val: numM[0] }); idx += numM[0].length; continue }
    tokens.push({ type: 'plain', val: line[idx] })
    idx++
  }
  return tokens
}

function highlight(code: string, lang: string): Token[] {
  const tokens: Token[] = []
  const lines = code.split('\n')

  lines.forEach((line, li) => {
    if (li > 0) tokens.push({ type: 'plain', val: '\n' })

    if (lang === 'json') {
      let idx = 0
      while (idx < line.length) {
        const keyM = /("[\w\s-]+")\s*:/.exec(line.slice(idx))
        if (keyM && keyM.index === 0) {
          tokens.push({ type: 'key', val: keyM[1] })
          tokens.push({ type: 'plain', val: line.slice(idx + keyM[1].length, idx + keyM[0].length - 1) })
          tokens.push({ type: 'plain', val: ':' })
          idx += keyM[0].length; continue
        }
        const strM = /"([^"]*)"/.exec(line.slice(idx))
        if (strM && strM.index === 0) { tokens.push({ type: 'str', val: strM[0] }); idx += strM[0].length; continue }
        const numM = /\b\d+\b/.exec(line.slice(idx))
        if (numM && numM.index === 0) { tokens.push({ type: 'num', val: numM[0] }); idx += numM[0].length; continue }
        const boolM = /\b(true|false|null)\b/.exec(line.slice(idx))
        if (boolM && boolM.index === 0) { tokens.push({ type: 'fn', val: boolM[0] }); idx += boolM[0].length; continue }
        tokens.push({ type: 'plain', val: line[idx] })
        idx++
      }
      return
    }

    if (lang === 'bash' || lang === 'shell') {
      if (line.trim().startsWith('#')) { tokens.push({ type: 'cmt', val: line }); return }
      const parts = line.split(/(curl|GET|POST|"[^"]*"|-[A-Z])/g)
      parts.forEach(p => {
        if (p === 'curl') tokens.push({ type: 'fn', val: p })
        else if (p === 'GET' || p === 'POST') tokens.push({ type: 'kw', val: p })
        else if (p.startsWith('-')) tokens.push({ type: 'op', val: p })
        else if (p.startsWith('"') && p.endsWith('"')) tokens.push({ type: 'str', val: p })
        else tokens.push({ type: 'plain', val: p })
      })
      return
    }

    const commentMatch = /\/\/.*|#.*/.exec(line)
    if (commentMatch && (lang === 'js' || lang === 'ts' || lang === 'python' || lang === 'node')) {
      const before = line.slice(0, commentMatch.index)
      const comment = line.slice(commentMatch.index)
      if (before) tokens.push(...tokenizeLine(before, lang))
      tokens.push({ type: 'cmt', val: comment })
      return
    }
    tokens.push(...tokenizeLine(line, lang))
  })

  return tokens
}

interface Props {
  code: string
  lang?: string
  id?: string
}

export default function CodeBlock({ code, lang = 'js', id }: Props) {
  const [copied, setCopied] = useState(false)
  const tokens = highlight(code, lang)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const colorMap: Record<string, string> = {
    key:   '#e0e0e0',
    str:   '#888',
    num:   '#aaa',
    cmt:   '#3a3a3a',
    fn:    '#c0c0c0',
    op:    '#666',
    kw:    '#fff',
    url:   '#777',
    var:   '#b0b0b0',
    plain: '#555',
  }

  return (
    <div className={styles.wrap} id={id}>
      <div className={styles.header}>
        <span className={styles.lang}>{lang.toUpperCase()}</span>
        <button className={`${styles.copyBtn} ${copied ? styles.copied : ''}`} onClick={handleCopy}>
          {copied ? <IconCheck /> : <IconCopy />}
          <span>{copied ? 'Disalin' : 'Salin'}</span>
        </button>
      </div>
      <pre className={styles.pre}>
        {tokens.map((t, i) => (
          <span key={i} style={{ color: colorMap[t.type] }}>{t.val}</span>
        ))}
      </pre>
    </div>
  )
}
