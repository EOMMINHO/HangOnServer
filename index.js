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
const socketHelper = require("./utils/socket");
const connection = require("./router/connection");

// Global variables
let roomSchema = {
  isEmpty: true,
  participants: {},
  maxSeats: 8,
  clinkInProgress: false,
  gameInProgress: false,
  attentionInProgress: false,
  youtubeLink:
    "https://www.youtube.com/watch?v=k7YzgZf-V5U&t=230s&ab_channel=%EC%86%8C%EB%A6%AC%EC%97%B0%EA%B5%AC%EC%86%8C-S.LAB",
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
  socket.on("disconnect", () => socketHelper.disconnect(io, socket, infoObj));
  // Server received a host call
  socket.on("host", (playerName) =>
    socketHelper.host(
      socket,
      infoObj,
      playerName,
      roomSchema,
      participantSchema
    )
  );
  // Server received a join call
  socket.on("join", (userName, roomName) =>
    socketHelper.join(
      io,
      socket,
      infoObj,
      userName,
      roomName,
      participantSchema
    )
  );
  // Clink call
  socket.on("clink", (userName, roomName) =>
    socketHelper.clink(io, socket, infoObj, userName, roomName)
  );
  /*
   * Game call
   */
  socket.on("game", (userName, gameName, roomName) =>
    socketHelper.game(io, infoObj, gameName, userName, roomName)
  );
  // Attention call
  socket.on("attention", (userName, roomName) =>
    socketHelper.attention(io, socket, infoObj, userName, roomName)
  );
  // Seat Swap
  socket.on("seatSwap", (playerName1, playerName2, roomName) =>
    socketHelper.seatSwap(io, infoObj, playerName1, playerName2, roomName)
  );
  // Seat Shuffle
  socket.on("seatShuffle", (roomName) =>
    socketHelper.seatShuffle(io, infoObj, roomName)
  );
  socket.on("emoji", (playerName, roomName, num) =>
    socketHelper.emoji(io, infoObj, playerName, roomName, num)
  );
  socket.on("icebreak", (playerName, roomName) =>
    socketHelper.icebreak(io, playerName, roomName)
  );
  // Background Image
  socket.on("backgroundImage", (roomName) => {});
  // Background Noise
  socket.on("backgroundSound", (roomName) => {});
  // Youtube link change
  socket.on("youtube link", (youtubelink, roomName) => {
    socketHelper.youtubeLink(io, infoObj, youtubelink, roomName);
  });
  socket.on("youtubeLinkRequest", (roomName) => {
    try {
      socket.emit("youtubeLinkResponse", infoObj[roomName].youtubeLink);
    } catch (error) {
      console.log(error);
    }
  });
  // video chat
  socket.on("RTC_offer", (data, offerer, receiver, roomName) =>
    socketHelper.RTC_offer(socket, data, offerer, receiver, roomName)
  );
  // video off
  socket.on("videoOff", (userName, roomName) =>
    socketHelper.videoOff(socket, roomName, userName)
  );
});
// Server listening

http.listen(process.env.HTTP_PORT, () => {
  console.log(`listening on port ${process.env.HTTP_PORT}`);
});
https.listen(process.env.HTTPS_PORT, () => {
  console.log(`listening on port ${process.env.HTTPS_PORT}`);
});
