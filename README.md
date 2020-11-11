# Introduction

This is a KAIST CS473 Project.

# Usage

## Deploy

command "npm start" will start the server with PORT written in .env file.

## API call

The following text shows how to call API as a socket io message.

- requestEventName (arguments)
  - (responseEventName) descriptions

Every API follows the above rull.

- host (playerName)
  - (hostResponse) returns the room name created
- join (playerName, roomName)
  - (joinResponse) return true if successful, otherwise return false
- clink (playerName, roomName)
  - (clinkResponse) return the player name who requested clinking
- game (playerName, gameName, roomName)
  - (gameResponse) return the player and game name requested
- attention (playerName, roomName)
  - (attentionResponse) return the player name who requested to attention
- seatSwap (playerName1, playerName2, roomName)
  - (seatSwapResponse) return the participants object
- seatShuffle (roomName)
  - (seatShuffleResponse) return the participants object
- backgroundImage
  - on developing
- backgroundSound
  - on developing

# Implementation Details

## Schema of global room variable

- isempty: whether the room is empty or not
- participants: pair of (name, seat#)
- maxSeats: maximum seat of a desk

```
{
  isEmpty: true,
  participants: {
      GilDong: 1,
      Buffet: 3,
      Merona: 2
  },
  maxSeats: 8,
};
```
