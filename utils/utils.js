const randomstring = require("randomstring");

function getRemainSeat(infoObj, roomName) {
  for (let i = 1; i <= infoObj[roomName].maxSeats; i++) {
    if (!Object.values(infoObj[roomName].participants).includes(i)) {
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

module.exports.getRemainSeat = getRemainSeat;
module.exports.newRoomName = newRoomName;
