import type { NextApiRequest, NextApiResponse } from 'next'
import { getOrCreateKey } from '../../lib/apiKeyStore'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'

  const apiKey = getOrCreateKey(ip)

  res.setHeader('Set-Cookie', `sdt_apikey=${apiKey}; Path=/; Max-Age=31536000; SameSite=Lax`)
  return res.status(200).json({ apiKey })
}
