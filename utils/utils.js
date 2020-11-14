const randomstring = require("randomstring");

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
  let rand = randomstring.generate(7);
  while (true) {
    if (!Object.keys(infoObj).includes(rand)) {
      return rand;
    }
    rand = randomstring.generate(7);
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

module.exports.getRemainSeat = getRemainSeat;
module.exports.newRoomName = newRoomName;
module.exports.isEveryAttention = isEveryAttention;
