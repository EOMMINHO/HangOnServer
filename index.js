let app = require("express")();
let http = require("http").createServer(app);
let io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: "*",
  },
});
let connection = require("./router/connection");
const utils = require("./utils/utils");
const shuffle = require("shuffle-array");
const cloneDeep = require("lodash.clonedeep");

// Global variables
let roomSchema = {
  isEmpty: true,
  participants: {},
  maxSeats: 8,
};

let infoObj = {};

// Routers
app.use("/connection", connection);

// Socket IO
io.on("connection", (socket) => {
  // Disconnection
  socket.on("disconnect", () => {
    // delete participants in the room.
    if (socket.roomName && socket.playerName) {
      delete infoObj[socket.roomName].participants[socket.playerName];
      if (Object.keys(infoObj[socket.roomName].participants).length === 0) {
        delete infoObj[socket.roomName];
      } else {
        io.to(socket.roomName).emit(
          "disconnectResponse",
          infoObj[socket.roomName].participants
        );
      }
    }
    console.log(infoObj);
  });
  // Server received a host call
  socket.on("host", (playerName) => {
    // make an empty room
    let emptyRoom = utils.newRoomName(infoObj);
    infoObj[emptyRoom] = cloneDeep(roomSchema);
    console.log(`${emptyRoom} has been hosted`);
    // change object information
    socket.join(emptyRoom);
    socket.roomName = emptyRoom;
    socket.playerName = playerName;
    infoObj[emptyRoom].isEmpty = false;
    infoObj[emptyRoom].participants[playerName] = 1;
    // emit message
    socket.emit("hostResponse", emptyRoom, infoObj[emptyRoom].participants);
  });
  // Server received a join call
  socket.on("join", (playerName, roomName) => {
    // change object information
    if (Object.keys(infoObj).includes(roomName)) {
      socket.join(roomName);
      socket.roomName = roomName;
      socket.playerName = playerName;
      infoObj[roomName].participants[playerName] = utils.getRemainSeat(
        infoObj,
        roomName
      );
      io.to(roomName).emit(
        "joinResponse",
        true,
        infoObj[roomName].participants
      );
    } else {
      // fail to enter the room
      socket.emit("joinResponse", false);
    }
  });
  // Clink call
  socket.on("clink", (playerName, roomName) => {
    io.to(roomName).emit("clinkResponse", playerName);
  });
  // Game call
  socket.on("game", (playerName, gameName, roomName) => {
    io.to(roomName).emit("gameResponse", playerName, gameName);
  });
  // Attention call
  socket.on("attention", (playerName, roomName) => {
    io.to(roomName).emit("attentionResponse", playerName);
  });
  // Seat Swap
  socket.on("seatSwap", (playerName1, playerName2, roomName) => {
    // swap
    let tmp = infoObj[roomName].participants[playerName1];
    infoObj[roomName].participants[playerName1] =
      infoObj[roomName].participants[playerName2];
    infoObj[roomName].participants[playerName2] = tmp;
    io.to(roomName).emit("seatSwapResponse", infoObj[roomName].participants);
  });
  // Seat Shuffle
  socket.on("seatShuffle", (roomName) => {
    let newSeats = shuffle(Object.values(infoObj[roomName].participants));
    Object.keys(infoObj[roomName].participants).forEach((key, idx) => {
      infoObj[roomName].participants[key] = newSeats[idx];
    });
    io.to(roomName).emit("seatShuffleResponse", infoObj[roomName].participants);
  });
  // Background Image
  socket.on("backgroundImage", (roomName) => {});
  // Background Noise
  socket.on("backgroundSound", (roomName) => {});
});

// Server listening
http.listen(5000, () => {
  console.log("listening on port 5000");
});
