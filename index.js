require("dotenv").config();
const app = require("express")();
const http = require("http").createServer(app);
const fs = require("fs");
const options = {
  key: fs.readFileSync(
    "/etc/letsencrypt/live/hangonserver.minhoeom.com/privkey.pem"
  ),
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/hangonserver.minhoeom.com/fullchain.pem"
  ),
};
const https = require("https").createServer(options, app);
const io = require("socket.io")(https, {
  cors: {
    origin: "*",
    methods: "*",
  },
});
const connection = require("./router/connection");
const utils = require("./utils/utils");
const shuffle = require("shuffle-array");
const cloneDeep = require("lodash.clonedeep");

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
          infoObj[socket.roomName].participants,
          socket.playerName
        );
      }
    }
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
      // if there is duplicated userName, emit false and close.
      if (Object.keys(infoObj[roomName].participants).includes(playerName)) {
        return socket.emit("joinResponse", false, "Duplicated userName");
      }
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
      socket.emit("joinResponse", false, "There is no such room");
    }
  });
  // Clink call
  socket.on("clink", (playerName, roomName) => {
    try {
      if (infoObj[roomName].clinkInProgress) {
        // someone already request clink
        socket.emit("clinkResponse", false, playerName);
      } else {
        infoObj[roomName].clinkInProgress = true;
        io.to(roomName).emit("clinkResponse", true, playerName);
      }
    } catch (error) {
      console.log(error);
    }
  });
  // Clink Agreement call
  socket.on("clinkAgree", (userName, roomName) => {
    try {
      if (infoObj[roomName].clinkInProgress) {
        // someone already requested clink
        infoObj[roomName].clinkInProgress = false;
        io.to(roomName).emit("clinkAgreeResponse", userName);
      }
    } catch (error) {
      console.log(error);
    }
  });
  // Game call
  socket.on("game", (playerName, gameName, roomName) => {
    try {
      if (infoObj[roomName].gameInProgress) {
        io.to(roomName).emit("gameFail", playerName);
      } else {
        io.to(roomName).emit("gameResponse", playerName, gameName);
      }
    } catch (error) {
      console.log(error);
    }
  });
  // Attention call
  socket.on("attention", (playerName, roomName) => {
    try {
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
    } catch (error) {
      console.log(error);
    }
  });
  // Attention agree call
  socket.on("attentionAgree", (playerName, roomName) => {
    try {
      infoObj[roomName].participants[playerName].attention = true;
      io.to(roomName).emit(
        "attentionAgreeResponse",
        infoObj[roomName].participants
      );
      if (utils.isEveryAttention(infoObj)) {
        infoObj[roomName].attentionInProgress = false;
      }
    } catch (error) {
      console.log(error);
    }
  });
  // Seat Swap
  socket.on("seatSwap", (playerName1, playerName2, roomName) => {
    // swap
    try {
      let tmp = infoObj[roomName].participants[playerName1];
      infoObj[roomName].participants[playerName1] =
        infoObj[roomName].participants[playerName2];
      infoObj[roomName].participants[playerName2] = tmp;
      io.to(roomName).emit("seatSwapResponse", infoObj[roomName].participants);
    } catch (error) {
      console.log(error);
    }
  });
  // Seat Shuffle
  socket.on("seatShuffle", (roomName) => {
    try {
      let newSeats = shuffle(Object.values(infoObj[roomName].participants));
      Object.keys(infoObj[roomName].participants).forEach((key, idx) => {
        infoObj[roomName].participants[key] = newSeats[idx];
      });
      io.to(roomName).emit(
        "seatShuffleResponse",
        infoObj[roomName].participants
      );
    } catch (error) {
      console.log(error);
    }
  });
  // Background Image
  socket.on("backgroundImage", (roomName) => {});
  // Background Noise
  socket.on("backgroundSound", (roomName) => {});
  // video chat
  socket.on("RTC_offer", (data, offerer, receiver, roomName) => {
    try {
      socket.to(roomName).emit("RTC_answer", offerer, receiver, data);
    } catch (error) {
      console.log(error);
    }
  });
});

// Server listening

http.listen(process.env.HTTP_PORT, () => {
  console.log(`listening on port ${process.env.HTTP_PORT}`);
});
https.listen(process.env.HTTPS_PORT, () => {
  console.log(`listening on port ${process.env.HTTPS_PORT}`);
});
