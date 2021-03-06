// const randomstring = require("randomstring");
var randomWords = require('random-words');

function getRemainSeat(infoObj, roomName) {
  let seatNumbers = Object.keys(infoObj[roomName].participants).map((name) => {
    return infoObj[roomName].participants[name].seatNumber;
  });
  for (let i = 1; i <= infoObj[roomName].maxSeats; i++) {
    if (!seatNumbers.includes(i)) {
      return i;
    }
  }
}

function newRoomName(infoObj) {
  //let rand = randomstring.generate({ length: 12, readable: true });
  let rand = randomWords({ exactly: 2, join: ' ' })
  while (true) {
    if (!Object.keys(infoObj).includes(rand)) {
      return rand;
    }
    rand = randomWords({ exactly: 2, join: ' ' })
    //rand = randomstring.generate({ length: 12, readable: true });
  }
}

function isEveryAttention(infoObj, roomName) {
  let attention = Object.keys(infoObj[roomName].participants).map((name) => {
    return infoObj[roomName].participants[name].attention;
  });
  if (attention.includes(false)) {
    return false;
  }
  return true;
}

function squeezeSeats(infoObj, roomName, deletedNumber) {
  Object.keys(infoObj[roomName].participants).forEach((name) => {
    let seat = infoObj[roomName].participants[name].seatNumber;
    if (seat > deletedNumber) {
      infoObj[roomName].participants[name].seatNumber = seat - 1;
    }
  });
}

module.exports.getRemainSeat = getRemainSeat;
module.exports.newRoomName = newRoomName;
module.exports.isEveryAttention = isEveryAttention;
module.exports.squeezeSeats = squeezeSeats;
