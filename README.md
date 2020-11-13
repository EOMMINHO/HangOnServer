# Introduction

This is a KAIST CS473 Project aims to solve the following problem statement.

Drinking online via the current video chat system fails to give the liveness of offline parties and has difficulties in providing dynamic interactions between the group members.

# Usage

## Settings

- .env file describes the environment variables the problem will use.
- Paste the path of key and certification to use HTTPS (required)

## Deploy

1. command "npm i" will install every dependencies required to run the server.

2. command "npm start" will start the server with PORT written in .env file.

- When deploying server at previleged ports (e.g. 80), first need to be a superuser. command "sudo -i" will change you to root user.

## API call

The following text shows how to call API as a socket io message.

- requestEventName (arguments)
  - (responseEventName) descriptions

Every API follows the above rull.

- host (userName)
  - (hostResponse) returns the pair (roomName, participants).
- join (userName, roomName)
  - (joinResponse) returns (true, participants) if successful, otherwise return false.
- disconnect ()
  - (disconnectResponse) delete the user disconnected from the global varaible, and return the updated participants.
- clink (userName, roomName)
  - (clinkResponse) return the player name who requested clinking.
- clinkAgree (userName, roomName)
  - (clinkAgreeResponse) return the userName who agreed on clinking.
- game (userName, gameName, roomName)
  - (gameResponse) return the player and game name requested
- attention (userName, roomName)
  - (attentionResponse) return the player name who requested to attention
- attentionAgree (userName, roomName)
  - (attentionAgreeResponse) return the participants.
- seatSwap (userName1, userName2, roomName)
  - (seatSwapResponse) return the participants object
- seatShuffle (roomName)
  - (seatShuffleResponse) return the participants object
- backgroundImage
  - on developing
- backgroundSound
  - on developing
- RTC_offer (data, offerer, receiver, roomName)
  - (RTC_answer) return (offerer, receiver, data)

# Implementation Details

## Schema of global room variable

- isempty: whether the room is empty or not
- participants: pair of (name, participant instance)
- maxSeats: maximum seat of a desk
- clinkInProgress: whether the clink is on-going or not.
- gameInProgress: whether the game is on-going or not.
- attentionInProgress: whether the attention is on-going or not.

```
roomSchema = {
  isEmpty: false,
  participants: {
    userName: instanceOf(ParticipantSchema)
  }
  maxSeats: 8,
  clinkInProgress: false,
  gameInProgress: false,
  attentionInProgress: false
};
```

## Schema of participants variable

- seatNumber: number according to seat configuration
- attention: whether the participant is in-attention

```
participantSchema = {
  seatNumber: null,
  attention: false
}
```

## Seat Configurations (unconfirmed)

1 2 3 4

5 6 7 8
