export class ClientError extends Error {
  public static readonly AUTHENTICATION_FAILED: string = 'Authentication failed'
  public static readonly INVALID_API_KEY: string = 'Invalid API key'
  public static readonly RATE_LIMIT_EXCEEDED: string = 'Rate limit exceeded'

  constructor(message?: string) {
    super(message)
    this.name = 'ClientError'
  }
}

export class RequestError extends Error {
  public static readonly INVALID_MESSAGE: string = 'Invalid message'
  public static readonly PEER_NOT_IN_A_ROOM: string = 'Peer not in a room'
  public static readonly PEER_ALREADY_IN_A_ROOM: string = 'Peer already in a room'

  public static readonly INVALID_ROOM: string = 'Invalid room'
  public static readonly ROOM_ALREADY_EXISTS: string = 'Room already exists'
  public static readonly ROOM_NOT_FOUND: string = 'Room not found'
  public static readonly ROOM_FULL: string = 'Room is full'
  
  public static readonly INVALID_PEER: string = 'Invalid peer'

  constructor(message?: string) {
    super(message)
    this.name = 'RequestError'
  }
}


export class ValidationError extends Error {
  public static readonly INVALID_NAME: string = 'Invalid name'
  public static readonly NAME_MAY_ONLY_CONTAIN_LETTERS_NUMBERS_AND_HYPHENS: string = 'Name may only contain letters, numbers, and hyphens'

  public static readonly INVALID_MAX_PEERS: string = 'Invalid maxPeers'
  public static readonly MAX_PEERS_MUST_BE_BETWEEN_1_AND_10: string = 'maxPeers must be between 1 and 10'

  public static readonly INVALID_LIFETIME: string = 'Invalid lifetime'
  public static readonly LIFETIME_MUST_BE_BETWEEN_1_AND_60: string = 'lifetime must be between 1 and 60'

  constructor(message?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
