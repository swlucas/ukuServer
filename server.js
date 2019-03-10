var express = require("express");
var app = express();

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  next();
});


var server = require("http").createServer(app);
var socketio = require("socket.io");
var io = socketio.listen(server);
var usersOnId = [];
var waitingRoom = [];

io.on("connection", function (socket) {
  usersOnId.push(socket.id);
  console.log("Um novo dispositivo foi conectado com o id: " + socket.id);
  console.log(usersOnId);


  socket.on("disconnect", function () {
    console.log('usuario desconectado' + socket.id);
    waitingRoom.pop(socket);
    usersOnId.pop(socket.id);
  });

  socket.on("anonymous-name-change", (data) => {
    socket.anonymousName = data;
    console.log(socket.anonymousName);
  });

  socket.on("new-message", (data) => {
    console.log(data.room);
    data["from"] = socket.id;
    io.to(data.room).emit('message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data).emit('typing');
  });

  socket.on('status-chat', (data) => {
    socket.to(data.room).emit('status-chat', data.status);
  })

  socket.on('leave-room', (data) => {
    socket.to(data).emit('leave-room');
    socket.leave(data);
    console.log("saiu " + data);
  });

  socket.on('rotary', function () {

    waitingRoom[waitingRoom.length] = socket;
    io.emit('rotary', 'TESTANDO');
    rotary();
  });


  function rotary() {
    while ((waitingRoom.length != 0) && (waitingRoom.length % 2 == 0)) {
      let selected1 = row();
      let selected2 = row();
      let room = new Date().toString();
      let data1 = { "room": room, "anonymousId": selected1.id, "anonymousName": selected2.anonymousName };
      let data2 = { "room": room, "anonymousId": selected2.id, "anonymousName": selected1.anonymousName };


      selected1.join(room);
      selected2.join(room);
      // selected1.emit('room',data1);
      // selected2.emit('room',room);
      // selected1.emit('chatFound','ok');
      // selected2.emit('chatFound','ok');
      selected1.emit('chat-config', data1);
      selected2.emit('chat-config', data2);
    }
  }

  function row() {
    let first = waitingRoom[0];
    waitingRoom.splice(0, 1);
    return first;
  }

});


server.listen(3000, function () {
  console.log("Listering on port " + process.env.PORT);
});

