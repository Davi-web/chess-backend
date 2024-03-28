interface PlayerTimer {
  startTime: number;
  lastMoveTime: number;
  duration: number; // Total duration for the player's turn in milliseconds
  orientation: 'w' | 'b';
}

interface RoomTimers {
  players: {
    [playerId: string]: PlayerTimer;
  };
}

export class TimerService {
  private roomTimers: { [roomId: string]: RoomTimers } = {};

  constructor() {}

  startTimers(
    roomId: string,
    player1Id: string,
    player2Id: string,
    duration: number,
    p1Orientation: 'w' | 'b',
    p2Orientation: 'w' | 'b'
  ): void {
    if (!roomId) {
      return;
    }
    if (!this.roomTimers[roomId]) this.roomTimers[roomId] = { players: {} };
    this.roomTimers[roomId] = {
      players: {
        [player1Id]: {
          startTime: Date.now(),
          lastMoveTime: Date.now(),
          duration,
          orientation: p1Orientation,
        },
        [player2Id]: {
          startTime: Date.now(),
          lastMoveTime: Date.now(),
          duration,
          orientation: p2Orientation,
        },
      },
    };
  }

  getTimeRemaining(
    roomId: string,
    p1ID: string,
    p2ID: string,
    turn: 'w' | 'b'
  ): { p1TimeRemaing: number; p2TimeRemaining: number } {
    const roomTimers = this.roomTimers[roomId];
    // console.log('roomTimers:', roomTimers);
    if (!roomTimers || !roomTimers.players[p1ID] || !roomTimers.players[p2ID])
      return { p1TimeRemaing: 0, p2TimeRemaining: 0 };
    //Time Remaining = Total Duration - (Current Time - Last Move Time)
    // console.log('It is ', turn, ' turn');

    const p1TimeRemaining =
      turn === roomTimers.players[p1ID].orientation
        ? roomTimers.players[p1ID].duration -
          (Date.now() - roomTimers.players[p1ID].lastMoveTime)
        : roomTimers.players[p1ID].duration;
    const p2TimeRemaining =
      turn === roomTimers.players[p2ID].orientation
        ? roomTimers.players[p2ID].duration -
          (Date.now() - roomTimers.players[p2ID].lastMoveTime)
        : roomTimers.players[p2ID].duration;
    //   roomTimers[p1ID].duration - (Date.now() - roomTimers[p1ID].lastMoveTime);
    // const p2TimeRemaining =
    //   roomTimers[p2ID].duration - (Date.now() - roomTimers[p2ID].lastMoveTime);
    const p1TimeRemainingInSeconds = Math.floor(p1TimeRemaining / 1000);
    const p2TimeRemainingInSeconds = Math.floor(p2TimeRemaining / 1000);
    return {
      p1TimeRemaing: Math.max(0, p1TimeRemainingInSeconds), // Ensure that the time remaining is not negative (i.e. the time has run out)
      p2TimeRemaining: Math.max(0, p2TimeRemainingInSeconds),
    };
  }
  switchTurn(roomId: string, playerId: string): void {
    const roomTimers = this.roomTimers[roomId];
    if (!roomTimers) return;

    const playerTimer = roomTimers.players[playerId];
    playerTimer.lastMoveTime = Date.now(); // Reset the start time for the player's turn
  }
  getAllTimers(): { [roomId: string]: RoomTimers } {
    return this.roomTimers;
  }

  clearTimers(roomId: string): void {
    delete this.roomTimers[roomId];
  }
}
