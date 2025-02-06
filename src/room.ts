import { CloseReasons } from "./close-reasons"
import { DEFAULT_ROOM_SETTINGS } from "./configurations"
import { RequestError, ValidationError } from "./error"
import { Message, MessageType } from "./message"
import { Peer } from "./peer"

export interface RoomSettings {
  name: string
  maxPeers: number
  lifetime: number
}

export type OptionalRoomSettings = Optional<RoomSettings, 'maxPeers' | 'lifetime'>

class Room {
  public readonly settings: RoomSettings
  private peers: Map<string, Peer> = new Map()
  private readonly timer: NodeJS.Timeout

  get name() {
    return this.settings.name
  }

  get peerList() {
    return this.peers.keys()
  }

  get peerCount() {
    return this.peers.size
  }

  constructor(settings: OptionalRoomSettings) {
    this.settings = {
      ...DEFAULT_ROOM_SETTINGS,
      ...Object.fromEntries(Object.entries(settings).filter(([_, value]) => value !== undefined))
    } as RoomSettings

    this.validateSettings()
    Object.freeze(this.settings)

    this.timer = setTimeout(() => {
      Rooms.delete(this.name)
    }, this.settings.lifetime * 1000)
  }

  public join(peer: Peer) {
    console.log(`Peer ${peer.id} is joining room ${this.name}`)
    if (this.peers.size >= this.settings.maxPeers) {
      peer.ws.close(...CloseReasons.ROOM_FULL)
      return
    }
    this.peers.set(peer.id, peer)
    peer.room = this.name
    console.log(`Peer ${peer.id} joined room ${this.name}`)
    this.broadcast({ type: MessageType.Joined, sender: peer.id }, true)
  }

  public leave(peer: Peer) {
    this.peers.delete(peer.id)
    peer.ws.close(...CloseReasons.LEFT_ROOM)

    if (this.peers.size === 0) {
      clearInterval(this.timer)
      Rooms.delete(this.name)
    }
  }

  public delete() {
    clearTimeout(this.timer)
    this.peers.forEach(peer => {
      peer.ws.close(...CloseReasons.ROOM_DELETED)
    })
  }


  public broadcast(message: Message, echo: boolean = false) {
    this.peers.forEach(peer => {
      const sender = this.peers.get(message.sender)
      if (!echo && peer === sender) return
      peer.ws.send(JSON.stringify(message))
      console.log(`Broadcasted message to peer ${peer.id} in room ${this.name}`)
    })
  }


  private validateSettings() {
    if (!this.settings.name || this.settings.name.length < 1) {
      throw new ValidationError(ValidationError.INVALID_NAME)
    }

    if (!this.settings.name.match(/^[a-zA-Z0-9-]+$/)) {
      throw new ValidationError(ValidationError.NAME_MAY_ONLY_CONTAIN_LETTERS_NUMBERS_AND_HYPHENS)
    }

    if (this.settings.maxPeers < 1 || this.settings.maxPeers > 10) {
      throw new ValidationError(ValidationError.MAX_PEERS_MUST_BE_BETWEEN_1_AND_10)
    }

    if (this.settings.lifetime < 1 || this.settings.lifetime > 60) {
      throw new ValidationError(ValidationError.LIFETIME_MUST_BE_BETWEEN_1_AND_60)
    }
  }
}

export { type Room }

export default class Rooms {
  private constructor() { }

  private static rooms = new Map<string, Room>()

  public static create(settings: OptionalRoomSettings): Room {
    if (Rooms.rooms.has(settings.name)) {
      throw new RequestError(RequestError.ROOM_ALREADY_EXISTS)
    }
    const room = new Room(settings)
    Rooms.rooms.set(room.name, room)
    return room
  }

  public static get(name: string): Room | undefined {
    return Rooms.rooms.get(name)
  }

  public static delete(name: string) {
    const room = Rooms.rooms.get(name)
    if (!room) return
    room.delete()
    Rooms.rooms.delete(name)
  }

  public static clear() {
    Rooms.rooms.forEach(room => room.delete())
    Rooms.rooms.clear()
  }

  public static get count(): number {
    return Rooms.rooms.size
  }

  public static [Symbol.iterator](): IterableIterator<Room> {
    return Rooms.rooms.values()
  }
}
