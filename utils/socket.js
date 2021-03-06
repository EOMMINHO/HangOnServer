const Joi = require("joi");
const utils = require("./utils");
const cloneDeep = require("lodash.clonedeep");
const shuffle = require("shuffle-array");

const userNameSchema = Joi.object({
  userName: Joi.string().min(3).max(64),
});

function disconnect(io, socket, infoObj) {
  // delete participants in the room.
  if (socket.roomName && socket.playerName) {
    let deletedSeat =
      infoObj[socket.roomName].participants[socket.playerName].seatNumber;
    delete infoObj[socket.roomName].participants[socket.playerName];
    if (Object.keys(infoObj[socket.roomName].participants).length === 0) {
      delete infoObj[socket.roomName];
    } else {
      utils.squeezeSeats(infoObj, socket.roomName, deletedSeat);
      io.to(socket.roomName).emit(
        "disconnectResponse",
        infoObj[socket.roomName].participants,
        socket.playerName
      );
    }
  }
}

function host(socket, infoObj, playerName, roomSchema, participantSchema) {
  // validate UserName
  const { error } = userNameSchema.validate({ userName: playerName });
  if (error) {
    return socket.emit("hostResponse", false, error.details[0].message);
  }
  // make an empty room
  let emptyRoom = utils.newRoomName(infoObj);
  infoObj[emptyRoom] = cloneDeep(roomSchema);
  console.log(`${emptyRoom} has been hosted`);
  // change object information
  socket.join(emptyRoom);
  socket.roomName = emptyRoom;
  socket.playerName = playerName;
  infoObj[emptyRoom].participants[playerName] = cloneDeep(participantSchema);
  infoObj[emptyRoom].participants[playerName].seatNumber = 1;
  // emit message
  socket.emit("hostResponse", true, emptyRoom, infoObj[emptyRoom].participants);
}

function join(io, socket, infoObj, playerName, roomName, participantSchema) {
  // validate UserName
  const { error } = userNameSchema.validate({ userName: playerName });
  if (error) {
    return socket.emit("joinResponse", false, error.details[0].message);
  }
  // change object information
  if (Object.keys(infoObj).includes(roomName)) {
    // if the room is full, emit false and close.
    if (
      Object.keys(infoObj[roomName].participants).length >=
      infoObj[roomName].maxSeats
    ) {
      return socket.emit("joinResponse", false, "Room is full");
    }
    // if there is duplicated userName, emit false and close.
    if (Object.keys(infoObj[roomName].participants).includes(playerName)) {
      return socket.emit("joinResponse", false, "Duplicated userName");
    }
    socket.join(roomName);
    socket.roomName = roomName;
    socket.playerName = playerName;
    infoObj[roomName].participants[playerName] = cloneDeep(participantSchema);
    infoObj[roomName].participants[playerName].seatNumber = utils.getRemainSeat(
      infoObj,
      roomName
    );
    io.to(roomName).emit("joinResponse", true, infoObj[roomName].participants);
  } else {
    // if there is no corresponding room, emit false.
    return socket.emit("joinResponse", false, "There is no such room");
  }
}

function clink(io, socket, infoObj, playerName, roomName) {
  try {
    io.to(roomName).emit("clinkResponse", true, playerName);
  } catch (error) {
    console.log(error);
  }
}

function clinkAgree(io, infoObj, userName, roomName) {
  try {
    if (infoObj[roomName].clinkInProgress) {
      // someone already requested clink
      infoObj[roomName].clinkInProgress = false;
      io.to(roomName).emit("clinkAgreeResponse", userName);
    }
  } catch (error) {
    console.log(error);
  }
}

function game(io, infoObj, gameName, userName, roomName) {
  try {
    if (infoObj[roomName].gameInProgress) {
      io.to(roomName).emit("gameResponse", false, "Game already in progress");
    } else {
      infoObj[roomName].gameInProgress = true;
      io.to(roomName).emit("gameResponse", true, userName, gameName);
    }
  } catch (error) {
    console.log(error);
  }
}

function attention(io, socket, infoObj, userName, roomName) {
  try {
    if (infoObj[roomName].attentionInProgress) {
      infoObj[roomName].attentionInProgress = false;
      infoObj[roomName].participants[userName].attention = false;
      io.to(roomName).emit(
        "attentionResponse",
        false,
        userName,
        infoObj[roomName].participants
      );
    } else {
      infoObj[roomName].attentionInProgress = true;
      infoObj[roomName].participants[userName].attention = true;
      io.to(roomName).emit(
        "attentionResponse",
        true,
        userName,
        infoObj[roomName].participants
      );
    }
  } catch (error) {
    console.log(error);
  }
}

function attentionAgree(io, infoObj, playerName, roomName) {
  try {
    infoObj[roomName].participants[playerName].attention = true;
    io.to(roomName).emit(
      "attentionAgreeResponse",
      infoObj[roomName].participants
    );
    if (utils.isEveryAttention(infoObj, roomName)) {
      infoObj[roomName].attentionInProgress = false;
      io.to(roomName).emit("attentionOn", infoObj[roomName].participants);
    }
  } catch (error) {
    console.log(error);
  }
}

function clinkAgree(io, infoObj, userName, roomName) {
  try {
    if (infoObj[roomName].clinkInProgress) {
      // someone already requested clink
      infoObj[roomName].clinkInProgress = false;
      io.to(roomName).emit("clinkAgreeResponse", userName);
    }
  } catch (error) {
    console.log(error);
  }
}

function seatSwap(io, infoObj, playerName1, playerName2, roomName) {
  // swap
  try {
    let tmp = infoObj[roomName].participants[playerName1].seatNumber;
    infoObj[roomName].participants[playerName1].seatNumber =
      infoObj[roomName].participants[playerName2].seatNumber;
    infoObj[roomName].participants[playerName2].seatNumber = tmp;
    io.to(roomName).emit("seatSwapResponse", infoObj[roomName].participants);
  } catch (error) {
    console.log(error);
  }
}

function seatShuffle(io, infoObj, roomName) {
  try {
    let newSeats = shuffle(Object.values(infoObj[roomName].participants));
    Object.keys(infoObj[roomName].participants).forEach((key, idx) => {
      infoObj[roomName].participants[key] = newSeats[idx];
    });
    io.to(roomName).emit("seatShuffleResponse", infoObj[roomName].participants);
  } catch (error) {
    console.log(error);
  }
}

function emoji(io, infoObj, playerName, roomName, num) {
  try {
    io.to(roomName).emit("emojiResponse", playerName, num);
  } catch (error) {
    console.log(error);
  }
}

function icebreak(io, playerName, roomName){
  try {
    io.to(roomName).emit("icebreakResponse", playerName);
  } catch (error) {
    console.log(error);
  }
}

function youtubeLink(io, infoObj, youtubelink, roomName) {
  try {
    infoObj[roomName].youtubeLink = youtubelink;
    io.to(roomName).emit("youtube link", youtubelink);
  } catch (error) {
    console.log(error);
  }
}

function RTC_offer(socket, data, offerer, receiver, roomName) {
  try {
    socket.to(roomName).emit("RTC_answer", offerer, receiver, data);
  } catch (error) {
    console.log(error);
  }
}

function videoOff(socket, roomName, userName) {
  try {
    socket.to(roomName).emit("videoOffResponse", userName);
  } catch (error) {
    console.log(error);
  }
}

module.exports.disconnect = disconnect;
module.exports.host = host;
module.exports.join = join;
module.exports.clink = clink;
module.exports.clinkAgree = clinkAgree;
module.exports.game = game;
module.exports.attention = attention;
module.exports.attentionAgree = attentionAgree;
module.exports.seatSwap = seatSwap;
module.exports.seatShuffle = seatShuffle;
module.exports.emoji = emoji;
module.exports.youtubeLink = youtubeLink;
module.exports.RTC_offer = RTC_offer;
module.exports.videoOff = videoOff;
module.exports.icebreak = icebreak;
