import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import { existsSync } from 'fs'

if (existsSync('.env')) {
  expand(config())
}

export const SSL_KEY: string = process.env.SSL_KEY!
export const SSL_CERT: string = process.env.SSL_CERT!

export const PORT: number = parseInt(process.env.PORT!) || 3000
export const HOST: string = process.env.HOST!

export const LOBBY_TIMEOUT: number = parseInt(process.env.LOBBY_TIMEOUT!) || 10

export const DEFAULT_ROOM_SETTINGS = Object.freeze({
  maxPeers: parseInt(process.env.DEFAULT_ROOM_MAX_PEERS!) || 10,
  lifetime: parseInt(process.env.DEFAULT_ROOM_LIFETIME!) || 60,
})

export const API_KEYS_DB_PATH: string = process.env.API_KEYS_DB_PATH!

export const CORS_ORIGIN: string[] = (process.env.CORS_ORIGIN || '').split(',')

console.log('SSL_KEY:', SSL_KEY)
console.log('SSL_CERT:', SSL_CERT)
console.log('PORT:', PORT)
console.log('HOST:', HOST)
console.log('LOBBY_TIMEOUT:', LOBBY_TIMEOUT)
console.log('DEFAULT_ROOM_SETTINGS:', DEFAULT_ROOM_SETTINGS)
console.log('API_KEYS_DB_PATH:', API_KEYS_DB_PATH)
console.log('CORS_ORIGIN:', CORS_ORIGIN)
