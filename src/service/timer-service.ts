interface PlayerTimer {
  startTime: number;
  lastMoveTime: number;
  orientation: 'w' | 'b';
}

export interface RoomTimers {
  players: {
    [playerId: string]: PlayerTimer;
  };
  duration: number;
}

export class TimerService {
  private roomTimers: { [roomId: string]: RoomTimers } = {};

  constructor() {}

  startTimers(
    roomId: string,
    player1Id: string,
    player2Id: string,
    p1Orientation: 'w' | 'b',
    p2Orientation: 'w' | 'b'
  ): void {
    if (!roomId) {
      return;
    }
    // if (!this.roomTimers[roomId])
    //   this.roomTimers[roomId] = { players: {}, duration: 0 };
    this.roomTimers[roomId] = {
      players: {
        [player1Id]: {
          startTime: Date.now(),
          lastMoveTime: Date.now(),
          orientation: p1Orientation,
        },
        [player2Id]: {
          startTime: Date.now(),
          lastMoveTime: Date.now(),
          orientation: p2Orientation,
        },
      },
      //set to same value if duration exists else 0
      duration: this.roomTimers[roomId].duration,
    };
  }

  getTimeRemaining(
    roomId: string,
    p1ID: string,
    p2ID: string,
    turn: 'w' | 'b'
  ): { p1TimeRemaing: number; p2TimeRemaining: number } {
    const timer = this.roomTimers[roomId];
    // console.log('roomTimers:', roomTimers);
    if (!timer || !timer.players[p1ID] || !timer.players[p2ID])
      return { p1TimeRemaing: 0, p2TimeRemaining: 0 };
    //Time Remaining = Total Duration - (Current Time - Last Move Time)
    // console.log('It is ', turn, ' turn');

    const p1TimeRemaining =
      turn === timer.players[p1ID].orientation
        ? timer.duration - (Date.now() - timer.players[p1ID].lastMoveTime)
        : timer.duration;
    const p2TimeRemaining =
      turn === timer.players[p2ID].orientation
        ? timer.duration - (Date.now() - timer.players[p2ID].lastMoveTime)
        : timer.duration;
    //   timer[p1ID].duration - (Date.now() - timer[p1ID].lastMoveTime);
    // const p2TimeRemaining =
    //   timer[p2ID].duration - (Date.now() - timer[p2ID].lastMoveTime);
    const p1TimeRemainingInSeconds = Math.floor(p1TimeRemaining / 1000);
    const p2TimeRemainingInSeconds = Math.floor(p2TimeRemaining / 1000);
    return {
      p1TimeRemaing: Math.max(0, p1TimeRemainingInSeconds), // Ensure that the time remaining is not negative (i.e. the time has run out)
      p2TimeRemaining: Math.max(0, p2TimeRemainingInSeconds),
    };
  }
  switchTurn(roomId: string, playerId: string): void {
    const timer = this.roomTimers[roomId];
    if (!timer) return;

    const playerTimer = timer.players[playerId];
    playerTimer.lastMoveTime = Date.now(); // Reset the start time for the player's turn
  }
  getAllTimers(): { [roomId: string]: RoomTimers } {
    return this.roomTimers;
  }

  getTimersByRoomId(roomId: string): RoomTimers | undefined {
    return this.roomTimers[roomId];
  }

  clearTimers(roomId: string): void {
    delete this.roomTimers[roomId];
  }

  setRoomDuration(roomId: string, duration: number): void {
    //if room doesn't exist create a dummy room
    if (!this.roomTimers[roomId]) {
      this.roomTimers[roomId] = { players: {}, duration: 0 };
    }
    this.roomTimers[roomId].duration = duration;
  }
}
