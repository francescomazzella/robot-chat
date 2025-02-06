import { RoomSettings } from "./room"

export interface Message {
  type: MessageType
  sender: string
}

export interface ConnectedMessage extends Message {
  type: MessageType.Connected
  id: string
}

export interface CreateRoomMessage extends Message {
  type: MessageType.CreateRoom
  settings: RoomSettings
}

export interface RoomCreatedMessage extends Message {
  type: MessageType.RoomCreated
  room: string
}

export interface JoinMessage extends Message {
  type: MessageType.Join
  room: string
}

export interface JoinedMessage extends Message {
  type: MessageType.Joined
  id: string
}

export interface ListMessage extends Message {
  type: MessageType.List
  peers: string[]
}

export interface LeaveMessage extends Message {
  type: MessageType.Leave
}

export interface DataMessage extends Message {
  type: MessageType.Data
  data: any
}


export enum MessageType {
  Connected = 'connected',
  CreateRoom = 'create-room',
  RoomCreated = 'room-created',
  Join = 'join',
  Joined = 'joined',
  List = 'list',
  Leave = 'leave',
  Data = 'data',
  Error = 'error',
}
