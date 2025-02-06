import fs from "fs"
import { v7 } from "uuid"
import { createHash } from "crypto"
import sqlite3 from "sqlite3"
import { Database, open } from "sqlite"
import { API_KEYS_DB_PATH } from "./configurations"
import path from "path"
import { ClientError } from "./error"

let apiKeys: Database

(async () => {
  // Create the path to the database if it doesn't exist
  const pathToDB = path.dirname(API_KEYS_DB_PATH)
  fs.mkdirSync(pathToDB, { recursive: true })

  const db = await open({
    filename: API_KEYS_DB_PATH,
    driver: sqlite3.Database,
  })

  // Create the api_keys table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      key TEXT PRIMARY KEY,
      clientId TEXT,
      expires INTEGER,
      invalidatedAt INTEGER DEFAULT NULL,
      createdAt INTEGER DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.exec(`
    CREATE INDEX IF NOT EXISTS expires_index ON api_keys(expires)
  `)
  await db.exec(`
    CREATE INDEX IF NOT EXISTS clientId_index ON api_keys(clientId)
  `)

  // Create the permissions table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS permissions (
      permission TEXT PRIMARY KEY
    )
  `)

  // Create the api_keys_permissions table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys_permissions (
      key TEXT,
      permission TEXT,
      FOREIGN KEY(key) REFERENCES api_keys(key),
      FOREIGN KEY(permission) REFERENCES permissions(permission),
      PRIMARY KEY(key, permission)
    )
  `)

  // Create the tokens table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      token TEXT PRIMARY KEY,
      apiKey TEXT,
      expires INTEGER,
      usedAt INTEGER DEFAULT NULL,
      FOREIGN KEY(apiKey) REFERENCES api_keys(key)
    )
  `)

  apiKeys = db
  
  //#region First Time Setup
  
  // Create the API key for the admin
  const adminKey = await createAdminKey()
  if (adminKey) {
    console.log(`Admin API key: ${adminKey}`)
  }

  //#endregion
})()


type ApiKey = {
  clientId: string
  expires: number
  permissions: Permission[]
  valid?: boolean
}

type Permission = string


function sha256Hasher(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

function generateKey(salt: string): string {
  return sha256Hasher(`${v7()}-${salt}`)
}

export async function createApiKey(
  clientId: string,
  // permissions: Permission[],
  expires: number
): Promise<string> {
  const key = generateKey(clientId)

  const hashedKey = sha256Hasher(key)

  await apiKeys.run('INSERT INTO api_keys (key, clientId, expires) VALUES (?, ?, ?)',
    hashedKey, clientId, expires
  )

  return key
}

async function getApiKey(key: string): Promise<ApiKey | undefined> {
  const hashedKey = sha256Hasher(key)
  return await apiKeys.get<ApiKey>('SELECT * FROM api_keys WHERE key = ?', hashedKey)
}

/**
 * Check if the API key is valid and generate a new session token
 * @param key The API key
 * @returns The single-use token
 */
export async function checkApiKey(key: string): Promise<string> {
  const hashedKey = sha256Hasher(key)
  const apiKey = await apiKeys.get<ApiKey>(
    'SELECT * FROM api_keys WHERE key = ? AND expires > ? AND invalidatedAt IS NULL',
    hashedKey, Date.now()
  )

  if (!apiKey) {
    throw new ClientError(ClientError.INVALID_API_KEY)
  }

  // Generate a new session token
  const token = generateKey(hashedKey)
  const hashedToken = sha256Hasher(token)
  await apiKeys.run('INSERT INTO tokens (token, apiKey, expires) VALUES (?, ?, ?)',
    hashedToken, key, Date.now() + 1000 * 60
  )

  return token
}

export async function invalidateApiKey(key: string): Promise<void> {
  const hashedKey = sha256Hasher(key)
  await apiKeys.run('UPDATE api_keys SET invalidatedAt = CURRENT_TIMESTAMP WHERE key = ?', hashedKey)
}

export async function refreshApiKey(key: string): Promise<void> {
  await invalidateApiKey(key)
  const apiKey = await getApiKey(key)
  if (!apiKey) {
    throw new Error('Invalid API key')
  }
  await createApiKey(apiKey.clientId, apiKey.expires)
}

export async function checkToken(token: string): Promise<boolean> {
  const hashedToken = sha256Hasher(token)
  const result = await apiKeys.run('UPDATE tokens SET usedAt = CURRENT_TIMESTAMP WHERE token = ? AND expires > ? AND usedAt IS NULL',
    hashedToken,
    Date.now()
  )
  return (result.changes ?? 0) > 0
}


export async function checkAdminKey(key: string): Promise<boolean> {
  const hashedKey = sha256Hasher(key)
  const result = await apiKeys.get('SELECT * FROM api_keys WHERE key = ? AND expires > ? AND invalidatedAt IS NULL AND clientId = "admin"',
    hashedKey,
    Date.now()
  )
  return !!result
}



export async function createAdminKey(): Promise<string | undefined> {
  if (await apiKeys.get('SELECT * FROM api_keys WHERE clientId = "admin" AND invalidatedAt IS NULL')) {
    return
  }

  const key = generateKey('admin')
  const hashedKey = sha256Hasher(key)

  await apiKeys.run('INSERT INTO api_keys (key, clientId, expires) VALUES (?, ?, ?)',
    hashedKey, 'admin', Date.now() + 1000 * 60 * 60 * 24
  )

  return key
}
