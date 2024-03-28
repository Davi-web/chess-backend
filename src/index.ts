import { Server } from 'socket.io';

import express, { Response, Request } from 'express';
import http from 'http';

import { v4 as uuidV4 } from 'uuid';
import { Move, Player, Room } from './interfaces';
import { RoomService, TimerService } from './service';

const app = express(); // initialize express
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello World',
  });
});

const server = http.createServer(app);

// set port to value received from environment variable or 8080 if null
const port = process.env.PORT || 8080;

// upgrade http server to websocket server
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const roomService = new RoomService();
const timerService = new TimerService();
// io.connection
io.on('connection', (socket) => {
  // socket refers to the client socket that just got connected.
  // each socket is assigned an id
  console.log(socket.id, 'connected');

  socket.on('user', (user) => {
    // console.log('user:', user);
    socket.data.user = user;
  });
  socket.on(
    'getTimeRemaining',
    (
      roomId: string,
      p1ID: string,
      p2ID: string,
      turn: 'w' | 'b',
      callback: (p1TimeRemaining: number, p2TimeRemaining: number) => void
    ) => {
      // console.log('connected to getTimeRemaining event!'); // <- 1
      // Call the getTimeRemaining method of the TimerService
      const { p1TimeRemaing, p2TimeRemaining } = timerService.getTimeRemaining(
        roomId,
        p1ID,
        p2ID,
        turn
      );
      // console.log('timeRemaining:', timeRemaining);

      // Emit the timeRemaining value to the client using the provided callback function
      callback(p1TimeRemaing, p2TimeRemaining);
    }
  );
  socket.on(
    'startTimers',
    (
      roomId: string,
      p1ID: string,
      p2ID: string,
      p1Orientation: 'w' | 'b',
      p2Orientation: 'w' | 'b',
      cb: () => void
    ) => {
      timerService.startTimers(
        roomId,
        p1ID,
        p2ID,
        30000,
        p1Orientation,
        p2Orientation
      ); // 30 seconds
      cb();
    }
  );

  socket.on('switchTurn', (roomId: string, playerId: string) => {
    console.log('switchTurn event:', roomId, playerId);
    timerService.switchTurn(roomId, playerId);
  });

  socket.on('createRoom', async (callback: (roomId: string) => void) => {
    // callback here refers to the callback function from the client passed as data
    const roomId = uuidV4(); // <- 1 create a new uuid
    await socket.join(roomId); // <- 2 make creating user join the room

    const firstPlayer = {
      id: socket.data?.user.id,
      socketId: socket.id,
      username: socket.data?.user.name,
      rating: socket.data?.user.rating,
    }; // create a player object with the socket id and username

    const roomData = {
      roomId,
      players: [firstPlayer],
    };
    // set roomId as a key and roomData including players as value in the map
    roomService.setRoom(roomId, roomData);
    // returns Map(1){'2b5b51a9-707b-42d6-9da8-dc19f863c0d0' => [{id: 'socketid', username: 'username1'}]}

    callback(roomId); // <- 4 respond with roomId to client by calling the callback function from the client
  });

  socket.on(
    'joinRandomRoom',
    async (
      callback: (room: Room | { error: boolean; message: string }) => void
    ) => {
      try {
        const room = await roomService.joinRandomRoom(callback, socket);
        if (!room) {
          console.error('joinRandomRoom error:', room);
          return;
        }
        await socket.join(room.roomId); // make the joining client join the room

        // emit an 'opponentJoined' event to the room to tell the other player that an opponent has joined
        socket.to(room.roomId).emit('opponentJoined', room);
      } catch (error) {
        console.error('joinRandomRoom error:', error);
      }
    }
  );

  socket.on(
    'joinRoom',
    async (
      args: { roomId: string },
      callback: (room: Room | { error: boolean; message: string }) => void
    ) => {
      try {
        const room = await roomService.joinRoom(args.roomId, callback, socket);
        await socket.join(args.roomId); // make the joining client join the room

        // emit an 'opponentJoined' event to the room to tell the other player that an opponent has joined
        socket.to(args.roomId).emit('opponentJoined', room);
      } catch (error) {
        console.error('joinRoom error:', error);
      }
    }
  );

  socket.on('move', (data: { room: string; move: Move }) => {
    // emit to all sockets in the room except the emitting socket.
    socket.to(data.room).emit('move', data.move);
  });

  socket.on('disconnect', () => {
    const gameRooms = roomService.getRooms(); // <- 1

    gameRooms.forEach((room) => {
      // <- 2
      const userInRoom = room.players.find(
        (player: Player) => player.socketId === socket.id
      ); // <- 3

      if (userInRoom) {
        // console.log('userInRoom:', userInRoom);
        if (room.players.length < 2) {
          // if there's only 1 player in the room, close it and exit.
          roomService.removeRoom(room.roomId);
          return;
        }

        socket.to(room.roomId).emit('playerDisconnected', userInRoom); // <- 4
      }
    });
  });

  socket.on('closeRoom', async (data: { roomId: string }) => {
    socket.to(data.roomId).emit('closeRoom', data); // <- 1 inform others in the room that the room is closing

    const clientSockets = await io.in(data.roomId).fetchSockets(); // <- 2 get all sockets in a room

    // loop over each socket client
    clientSockets.forEach((s) => {
      s.leave(data.roomId); // <- 3 and make them leave the room on socket.io
    });

    roomService.removeRoom(data.roomId); // <- 4 delete room from rooms map
  });
});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
