import { RequestError } from "./error"
import { Message, CreateRoomMessage, JoinMessage, LeaveMessage, DataMessage, MessageType } from "./message"
import { Peer } from "./peer"
import Rooms from "./room"

type Handler<T extends Message = Message> = (this: Peer, message: T) => void

const handlers: Record<string, Handler<any>> = {
  [MessageType.CreateRoom]: function (this: Peer, message: CreateRoomMessage) {
    if (this.room) {
      throw new RequestError(RequestError.PEER_ALREADY_IN_A_ROOM)
    }

    const { settings: { name, maxPeers, lifetime } } = message
    const roomInstance = Rooms.create({ name, maxPeers, lifetime })
    roomInstance.join(this)
    this.ws.send(JSON.stringify({ type: MessageType.RoomCreated, room: name }))
    console.log(`Peer ${this.id} created room ${name}`)
  },

  [MessageType.Join]: function (this: Peer, message: JoinMessage) {
    if (this.room) {
      throw new RequestError(RequestError.PEER_ALREADY_IN_A_ROOM)
    }

    const { room } = message
    const roomInstance = Rooms.get(room)
    if (!roomInstance) return
    roomInstance.join(this)
    console.log(`Peer ${this.id} joined room ${room}`)
  },

  [MessageType.List]: function (this: Peer) {
    if (!this.room) {
      throw new RequestError(RequestError.PEER_NOT_IN_A_ROOM)
    }

    const room = Rooms.get(this.room)
    if (!room) return
    const peers = room.peerList
    this.ws.send(JSON.stringify({ type: MessageType.List, peers }))
    console.log(`Peer ${this.id} requested list of peers in room ${this.room}`)
  },

  [MessageType.Leave]: function (this: Peer, _: LeaveMessage) {
    if (!this.room) {
      throw new RequestError(RequestError.PEER_NOT_IN_A_ROOM)
    }

    const room = Rooms.get(this.room)
    if (!room) return
    room.leave(this)
    console.log(`Peer ${this.id} left room ${this.room}`)
  },

  [MessageType.Data]: function (this: Peer, message: DataMessage) {
    if (!this.room) {
      throw new RequestError(RequestError.PEER_NOT_IN_A_ROOM)
    }

    const room = Rooms.get(this.room)
    if (!room) return
    room.broadcast(message)
    console.log(`Peer ${this.id} sent data to room ${this.room}`)
  }
}

export default handlers
