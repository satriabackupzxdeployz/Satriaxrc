import fs from 'fs'
import path from 'path'

const STORE_PATH = path.join('/tmp', 'sdt_keystore.json')

function loadStore(): Record<string, string> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
    }
  } catch {}
  return {}
}

function saveStore(data: Record<string, string>) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data), 'utf-8')
  } catch {}
}

export function getOrCreateKey(ip: string): string {
  const store = loadStore()
  if (store[ip]) return store[ip]
  const key = generateToken()
  store[ip] = key
  saveStore(store)
  return key
}

export function isValidKey(key: string): boolean {
  const store = loadStore()
  return Object.values(store).includes(key)
}

export function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let t = ''
  for (let i = 0; i < 24; i++) {
    t += chars[Math.floor(Math.random() * chars.length)]
  }
  return 'Satria-' + t
}
