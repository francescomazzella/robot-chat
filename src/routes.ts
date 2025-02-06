import { FastifyPluginCallback, RouteHandler } from "fastify"
import { ClientError, RequestError, ValidationError } from "./error"
import { checkAdminKey, checkApiKey, checkToken, createApiKey } from "./authentication"
import { WebsocketHandler } from "@fastify/websocket"
import { Peer } from "./peer"
import { CloseReasons } from "./close-reasons"
import { rateLimiter } from "./rate-limiter"
import { LOBBY_TIMEOUT } from "./configurations"
import { Message, MessageType } from "./message"
import handlers from "./handlers"
import Rooms from "./room"

const routes: FastifyPluginCallback = (fastify, options, done) => {
  fastify.post('/register', register)
  fastify.get('/auth', auth)
  fastify.get('/chat', { websocket: true }, chat)
  done()
}

export default routes

interface AuthHandlerInterface {
  Headers: {
    'x-api-key'?: string
  }
}

const auth: RouteHandler<AuthHandlerInterface> = async (request, reply) => {
  const apiKey = request.headers['x-api-key']
  if (!apiKey) {
    console.log('Unauthorized: missing API key')
    reply.code(401).send({ error: 'Unauthorized: missing API key' })
    return
  }

  let token: string
  try {
    token = await checkApiKey(apiKey)
  } catch (error) {
    if (error instanceof ClientError) {
      console.log('Unauthorized: invalid API key')
      reply.code(403).send({ error: 'Unauthorized: invalid API key' })
      return
    }
    throw error
  }

  reply.code(200).send({ token })
}

const chat: WebsocketHandler = async (socket, request) => {
  const {
    token,
    name,
    room,
    maxPeers,
    lifetime
  } = request.query as { token: string, name: string, room: string, maxPeers?: number, lifetime?: number }

  if (!token) {
    socket.close(...CloseReasons.NO_TOKEN)
    console.log('No token provided')
    return
  }

  if (!await checkToken(token)) {
    socket.close(...CloseReasons.INVALID_TOKEN)
    console.log('Invalid token provided')
    return
  }

  const peer = Peer.create(socket, name)

  if (room) {
    let roomInstance = Rooms.get(room)
    if (!roomInstance) {
      roomInstance = Rooms.create({ name: room, maxPeers, lifetime })
      console.log(`Peer ${peer.id} created room ${room}`)
    }
    roomInstance.join(peer)
  } else {
    console.log(`Peer ${peer.id} is in the lobby`)
    setTimeout(() => {
      if (!peer.room) {
        socket.close(...CloseReasons.LOBBY_TIMEOUT)
        console.log(`Peer ${peer.id} timed out in the lobby`)
      }
    }, LOBBY_TIMEOUT * 1000)
  }

  socket.on('message', (rawMessage) => {
    if (!rateLimiter(peer)) {
      socket.send(JSON.stringify({ type: MessageType.Error, error: ClientError.RATE_LIMIT_EXCEEDED }))
      console.log(`Rate limit exceeded for peer ${peer.id}`)
      return
    }

    const message = {
      sender: peer.id,
      ...JSON.parse(rawMessage.toString())
    } as Message
    const { type } = message
    try {
      handlers[type].call(peer, message)
    } catch (error) {
      if (error instanceof RequestError || error instanceof ValidationError) {
        socket.send(JSON.stringify({ type: MessageType.Error, error: error.message }))
        console.log('Client error:', error.message)
      } else {
        console.error(error)
      }
    }

    socket.on('close', () => {
      if (!peer.room) return
      Rooms.get(peer.room)?.leave(peer)
      handlers['leave'].call(peer, { type: 'leave' })
      console.log(`Peer disconnected: ${peer.id}`)
    })
  })
}

interface RegisterHandlerInterface {
  Body: {
    clientId?: string
  }
}

const register: RouteHandler<RegisterHandlerInterface> = async (request, reply) => {
  const auth = request.headers['authorization']
  if (!auth || !auth.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Unauthorized' })
    return
  }

  if (!await checkAdminKey(auth.slice(7))) {
    reply.code(403).send({ error: 'Forbidden' })
    return
  }

  const clientId = request.body.clientId
  if (!clientId) {
    reply.code(400).send({ error: 'Missing client ID' })
    return
  }
  const apiKey = await createApiKey(clientId, Date.now() + 365 * 24 * 60 * 60 * 1000)
  reply.code(200).send({ apiKey })
}
