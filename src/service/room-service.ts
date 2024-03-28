import { Socket } from 'socket.io';
import { Player, Room } from '../interfaces';
import { v4 as uuidV4 } from 'uuid';

export class RoomService {
  private readonly rooms: Map<string, Room>;
  constructor() {
    this.rooms = new Map<string, Room>();
  }

  createRoom(player: Player) {
    const roomId = uuidV4();
    const room: Room = {
      roomId,
      players: [],
    };
    this.rooms.set(roomId, {
      // <- 3
      roomId,
      players: [player],
    });
    return roomId;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  setRoom(roomId: string, room: Room) {
    this.rooms.set(roomId, room);
  }

  async joinRoom(
    roomId: string,
    cb: (room: Room | { error: boolean; message: string }) => void,
    socket: Socket
  ): Promise<Room | void> {
    const room = this.getRoom(roomId);
    let error = false;
    let message = '';

    if (!room) {
      // if room does not exist
      error = true;
      message = 'room does not exist!';
    } else if (room.players.length <= 0) {
      // if room is empty set appropriate message
      error = true;
      message = 'room is empty';
    } else if (room.players.length >= 2) {
      // if room is full
      error = true;
      message = 'room is full'; // set message to 'room is full'
    }
    if (error) {
      cb({
        error,
        message,
      });
      return;
    }

    // add the joining user's data to the list of players in the room
    const roomUpdate = {
      ...room,
      players: [
        ...(room?.players || []),
        {
          id: socket.data?.user.id,
          socketId: socket.id,
          username: socket.data?.user.name,
          rating: socket.data?.user.rating,
        },
      ],
    } as Room;
    this.setRoom(roomId, roomUpdate); // update the room in the rooms map (roomService.rooms

    cb(roomUpdate); // respond to the client with the room details.
    return roomUpdate;
  }

  async joinRandomRoom(
    cb: (room: Room | { error: boolean; message: string }) => void,
    socket: Socket
  ) {
    const rooms = this.getAvailableRooms();
    let roomToJoin: Room | undefined;

    rooms.forEach((room) => {
      if (room.players.length === 1) {
        roomToJoin = room;
      }
    });

    if (!roomToJoin) {
      cb({
        error: true,
        message: 'No room available to join',
      });
      return;
    }

    const room = await this.joinRoom(roomToJoin.roomId, cb, socket);
    return room;
  }

  removePlayerFromRoom(roomId: string, playerId: string) {
    const room = this.getRoom(roomId);
    if (room) {
      room.players = room.players.filter((player) => player.id !== playerId);
    }
  }

  getAvailableRooms() {
    return Array.from(this.rooms.values()).filter(
      (room) => room.players.length < 2
    );
  }

  removeRoom(roomId: string) {
    this.rooms.delete(roomId);
  }

  getRooms() {
    return Array.from(this.rooms.values());
  }

  getRoomByPlayerId(playerId: string) {
    return Array.from(this.rooms.values()).find((room) =>
      room.players.some((player) => player.id === playerId)
    );
  }
}
