function disconnect(io, socket, infoObj) {
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
}

module.exports.disconnect = disconnect;
