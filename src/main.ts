import Fastify from 'fastify'
import WebSocket from '@fastify/websocket'
import cors from '@fastify/cors'
import { readFileSync, realpathSync } from 'fs'
import { networkInterfaces } from 'os'
import { SSL_CERT, HOST, SSL_KEY, PORT, CORS_ORIGIN } from './configurations'
import { createApiKey } from './authentication'
import routes from './routes'
import Rooms from './room'

//#region Fastify Configuration

const sslKeyPath = realpathSync(SSL_KEY)
const sslCertPath = realpathSync(SSL_CERT)

const fastify = Fastify({
  // logger: {
  //   level: 'debug',
  // },
  https: {
    key: readFileSync(sslKeyPath),
    cert: readFileSync(sslCertPath),
  },
})

fastify.register(cors, {
  origin: CORS_ORIGIN,
})

fastify.register(WebSocket)

fastify.addHook('onClose', (instance, done) => {
  console.log('Fastify closing...')
  done()
})
fastify.addHook('onError', (request, reply, error) => {
  console.error('Fastify error:', error.message)
  reply.code(500).send({ error: 'Internal server error' })
})
fastify.addHook('onReady', () => {
  console.log('Fastify ready...')
})

fastify.register(routes)

fastify.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`HTTPS server listening on ${address}`)
})

//#endregion



// Get the IP address of the server
const ni = networkInterfaces()
const addresses = Object.values(ni)
  .flat()
  .filter((details) => !!details)
  .filter((details) => !details.internal)
  .sort((a, b) => (a.family === 'IPv4' ? -1 : 1))
  .map((details) => details.address)

console.log('Server started on:')
console.log(`wss://localhost:${PORT}`)
addresses.forEach((address) => {
  console.log(`wss://${address}:${PORT}`)
})

//#region User Input Handling

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...')
  Rooms.clear()
  fastify.close(() => {
    console.log('Server shut down')
    process.exit(0)
  })
})

console.log('q + enter to stop the server')
// Listen for user input
process.stdin.resume()
process.stdin.setEncoding('utf8')
process.stdin.on('data', (data: string) => {
  const input = data.trim().split(' ')

  if (input[0] === 'q') {
    process.exit(0)
  }

  if (input[0] === 'rooms') {
    console.log(`Rooms: (${Rooms.count})`)
    for (const room of Rooms) {
      console.log(room.name)
    }
  }

  if (input[0] === 'apikey') {
    if (input[1] === 'new') {
      createApiKey(input[2], Date.now() + 1000 * 60 * 60 * 24).then((key) => {
        console.log(`New API key: ${key}`)
      })
    }
  }
})

//#endregion
