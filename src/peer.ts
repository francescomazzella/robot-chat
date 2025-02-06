import { v4 } from "uuid"
import WebSocket from "ws"
import { MessageType } from "./message"

export class Peer {

  public readonly id: string

  get room(): string | undefined {
    return this._room
  }

  set room(room: string) {
    if (this._room) {
      throw new Error('Peer already in a room')
    }
    this._room = room
  }

  private constructor(
    public readonly ws: WebSocket,
    name?: string,
    private _room?: string
  ) {
    if (!ws) {
      throw new Error('Invalid WebSocket')
    }

    this.id = `${name || 'guest'}-${v4()}`

    ws.send(JSON.stringify({ type: MessageType.Connected, id: this.id }))
  }

  public static create(ws: WebSocket, name?: string, room?: string) {
    return new Peer(ws, name, room)
  }
}
