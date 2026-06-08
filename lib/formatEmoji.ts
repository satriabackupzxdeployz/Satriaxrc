export function formatEmojis(raw: string): string {
  if (!raw || raw.trim() === '') return ''
  const re = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu
  const matches = raw.replace(/\s+/g, '').match(re)
  if (!matches) return ''
  return matches.slice(0, 3).join(',')
}

export function validateEmojis(raw: string): boolean {
  const re = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu
  return re.test(raw)
}
