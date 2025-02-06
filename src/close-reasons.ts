type Reason = [number, string]

export const CloseReasons: Record<string, Reason> = {
  UNAUTHORIZED: [3100, 'Unauthorized'],

  NO_TOKEN: [3101, 'No token provided'],
  INVALID_TOKEN: [3102, 'Invalid token provided'],

  LOBBY_TIMEOUT: [3201, 'Timeout waiting for room'],
  ROOM_DELETED: [3202, 'Room was deleted'],
  LEFT_ROOM: [3203, 'You left the room'],
}
