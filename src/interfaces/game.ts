export interface Player {
  id: string;
  socketId: string;
  username: string;
  rating: number;
  imageUrl: string;
}
export interface Room {
  roomId: string;
  players: Player[];
}

export interface Move {
  color: string;
  piece: string;
  from: string;
  to: string;
  san: string;
  flags: string;
  lan: string;
  before: string;
  after: string;
}

export interface Timer {
  playerId: string;
  startTime: number;
}
