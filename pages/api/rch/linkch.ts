import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { checkRateLimit, RATE_LIMIT } from '../../../lib/rateLimit'
import { isValidKey } from '../../../lib/apiKeyStore'
import { formatEmojis, validateEmojis } from '../../../lib/formatEmoji'

const BASE_URL = 'https://react-channelwa.vercel.app/api'

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
]

let usedUAs: string[] = []

function getRandomUA(): string {
  let available = USER_AGENTS.filter(ua => !usedUAs.includes(ua))
  if (available.length === 0) {
    usedUAs = []
    available = USER_AGENTS
  }
  const ua = available[Math.floor(Math.random() * available.length)]
  usedUAs.push(ua)
  return ua
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function getCsrfToken(retry = 3): Promise<{ token: string; sessionId: string }> {
  for (let i = 0; i < retry; i++) {
    try {
      const res = await axios.get(`${BASE_URL}/csrf-token`, {
        timeout: 10000,
        headers: {
          'User-Agent': getRandomUA(),
          'Referer': 'https://react-channelwa.vercel.app/',
        },
      })
      return res.data
    } catch (err: any) {
      if (err.response?.status === 429) {
        const wait = err.response.headers['ratelimit-reset'] || 2
        await delay(wait * 1000)
      } else if (i < retry - 1) {
        await delay(2000)
      } else {
        throw err
      }
    }
  }
  throw new Error('Gagal mendapatkan CSRF token')
}

async function registerDevice(deviceId: string, sessionId: string, retry = 3): Promise<any> {
  for (let i = 0; i < retry; i++) {
    try {
      const res = await axios.post(
        `${BASE_URL}/register-device`,
        { deviceId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': sessionId,
            'User-Agent': getRandomUA(),
          },
          timeout: 15000,
        }
      )
      return res.data
    } catch (err: any) {
      if (err.response?.status === 429) {
        const wait = err.response.headers['ratelimit-reset'] || 2
        await delay(wait * 1000)
      } else if (i < retry - 1) {
        await delay(2000)
      } else {
        throw err
      }
    }
  }
  throw new Error('Gagal mendaftarkan device')
}

async function sendReaction(
  deviceKey: string,
  url: string,
  emojis: string,
  csrfToken: string,
  sessionId: string,
  retry = 3
): Promise<any> {
  for (let i = 0; i < retry; i++) {
    try {
      const res = await axios.post(
        `${BASE_URL}/inject`,
        { deviceKey, url, emojis, csrfToken, sessionId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': sessionId,
            'User-Agent': getRandomUA(),
          },
          timeout: 30000,
        }
      )
      return res.data
    } catch (err: any) {
      if (err.response?.status === 429) {
        const wait = err.response.headers['ratelimit-reset'] || 2
        await delay(wait * 1000)
      } else if (i < retry - 1) {
        await delay(2000)
      } else {
        throw err
      }
    }
  }
  throw new Error('Gagal mengirim reaksi')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { link, emoji, apikey } = req.query as Record<string, string>

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'

  if (!apikey || !isValidKey(apikey)) {
    return res.status(401).json({
      success: false,
      error: 'API Key tidak valid. Buka halaman utama untuk mendapatkan API Key.',
    })
  }

  if (!link) {
    return res.status(400).json({ success: false, error: 'Parameter link wajib diisi.' })
  }

  const rawEmoji = emoji || '🔥'
  if (!validateEmojis(rawEmoji)) {
    return res.status(400).json({ success: false, error: 'Format emoji tidak valid.' })
  }

  const rl = checkRateLimit(ip, apikey)
  if (!rl.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit tercapai.',
      rateLimit: { used: rl.used, limit: RATE_LIMIT, remaining: 0, resetIn: rl.resetIn },
    })
  }

  const formattedEmoji = formatEmojis(rawEmoji)

  try {
    const { token: csrfToken, sessionId } = await getCsrfToken()

    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const register = await registerDevice(deviceId, sessionId)

    if (!register.success || !register.deviceKey) {
      return res.status(502).json({ success: false, error: 'Gagal mendaftarkan device.' })
    }

    const result = await sendReaction(register.deviceKey, link, formattedEmoji, csrfToken, sessionId)

    const successDetails = (result.details || []).filter((d: string) => d.includes('berhasil'))

    return res.status(200).json({
      success: result.success,
      author: 'Satriadevs',
      data: {
        url: link,
        emojis: formattedEmoji,
        message: result.message || 'Reaksi berhasil dikirim',
        details: successDetails,
      },
      rateLimit: {
        used: rl.used,
        limit: RATE_LIMIT,
        remaining: rl.remaining,
        resetIn: rl.resetIn,
      },
    })
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan'
    return res.status(500).json({ success: false, error: msg })
  }
}
