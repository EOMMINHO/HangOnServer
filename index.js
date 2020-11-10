const { Http2ServerRequest } = require('http2');

let app = require("express")();
let http = require("http").createServer(app);
let io = require("socket.io")(http);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
})

io.on("connection", (socket) => {
    // 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
    // socket.broadcast.emit('chat', msg);

    // 메시지를 전송한 클라이언트에게만 메시지를 전송한다
    // socket.emit('s2c chat', msg);

    // 접속된 모든 클라이언트에게 메시지를 전송한다
    // io.emit('s2c chat', msg);

    // 특정 클라이언트에게만 메시지를 전송한다
    // io.to(id).emit('s2c chat', data);

    socket.on('join', (roomId) => {
        const roomClients = io.sockets.adapter.rooms[roomId] || { length: 0 }
        const numberOfClients = roomClients.length
    
        // These events are emitted only to the sender socket.
        if (numberOfClients == 0) {
            console.log(`Creating room ${roomId} and emitting room_created socket event`)
            socket.join(roomId)
            socket.emit('room_created', roomId)
        } else if (numberOfClients == 8) {
            console.log(`Can't join room ${roomId}, emitting full_room socket event`)
            socket.emit('full_room', roomId)
        } else {
            console.log(`Joining room ${roomId} and emitting room_joined socket event`)
            socket.join(roomId)
            socket.emit('room_joined', roomId)
        }
    })

    // These events are emitted to all the sockets connected to the same room except the sender.
    socket.on('start_call', (roomId) => {
        console.log(`Broadcasting start_call event to peers in room ${roomId}`)
        socket.broadcast.to(roomId).emit('start_call')
    })
    socket.on('webrtc_offer', (event) => {
        console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
    })
    socket.on('webrtc_answer', (event) => {
        console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
    })
    socket.on('webrtc_ice_candidate', (event) => {
        console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
    })
    
    socket.on('login', function(data) {
        console.log('Client logged-in:\n name:' + data.name + '\n userid: ' + data.userid);

        // socket에 클라이언트 정보를 저장한다
        socket.name = data.name;
        socket.userid = data.userid;

        // 접속된 모든 클라이언트에게 메시지를 전송한다
        io.emit('login', data.name);
    });

    console.log("a user connected");
    socket.on("disconnect", ()=>{
        console.log("user disconnected");
    })
    socket.emit("test1", 1, 2);

    socket.on('disconnect', function() {
        console.log('user disconnected: ' + socket.name);
    });
})

http.listen(3000, () => {
    console.log("listening on port 3000");
})