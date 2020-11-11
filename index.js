require("dotenv").config();
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
const { info } = require("console");

// Global variables
let roomSchema = {
  isEmpty: true,
  participants: {},
  maxSeats: 8,
  clinkInProgress: false,
  gameInProgress: false,
  attentionInProgress: false,
};

let participantSchema = {
  seatNumber: null,
  attention: false,
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
    infoObj[emptyRoom].participants[playerName] = cloneDeep(participantSchema);
    infoObj[emptyRoom].participants[playerName].seatNumber = 1;
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
      infoObj[roomName].participants[playerName] = cloneDeep(participantSchema);
      infoObj[roomName].participants[
        playerName
      ].seatNumber = utils.getRemainSeat(infoObj, roomName);
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
    if (infoObj[roomName].clinkInProgress) {
      // someone already request clink
      socket.emit("clinkResponse", false, playerName);
    } else {
      infoObj[roomName].clinkInProgress = true;
      io.to(roomName).emit("clinkResponse", true, playerName);
    }
  });
  // Clink Agreement call
  socket.on("clinkAgree", (playerName, roomName) => {
    if (infoObj[roomName].clinkInProgress) {
      // someone already request clink
      io.to(roomName).emit("clinkAgreeResponse", playerName);
    }
  });
  // Game call
  socket.on("game", (playerName, gameName, roomName) => {
    if (infoObj[roomName].gameInProgress) {
      io.to(roomName).emit("gameFail", playerName);
      // 누가 사용 중이면 요청 실패 전송
    } else {
      io.to(roomName).emit("gameResponse", playerName, gameName);
    }
  });
  // Attention call
  socket.on("attention", (playerName, roomName) => {
    if (infoObj[roomName].attentionInProgress) {
      socket.emit("attentionResponse", false, playerName);
    } else {
      infoObj[roomName].attentionInProgress = true;
      infoObj[roomName].participants[playerName].attention = true;
      io.to(roomName).emit(
        "attentionResponse",
        true,
        infoObj[roomName].participants
      );
    }
  });
  // Attention agree call
  socket.on("attentionAgree", (playerName, roomName) => {
    infoObj[roomName].participants[playerName].attention = true;
    io.to(roomName).emit(
      "attentionAgreeResponse",
      infoObj[roomName].participants
    );
    if (utils.isEveryAttention(infoObj)) {
      infoObj[roomName].attentionInProgress = false;
    }
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
http.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
