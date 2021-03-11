const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');
const {
  addUser,
  getUser,
  removeUser,
  getUsersInRoom,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
const publicPath = path.join(__dirname, '../public');

app.use(express.static(publicPath));


io.on('connection', (socket) => {
  

  socket.on('join', ({ username, room }, callback) => {
    const {error, user} = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }

    console.log(`${username} has joined room: ${user.room}`);

    socket.join(user.room);
    socket.emit(
      'message',
      generateMessage('Admin', 'Welcome!')
    );
    socket.broadcast.to(user.room).emit(
      'message',
      generateMessage('Admin',`${user.username} has joined!`)
    );
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback('User not found');
    }

    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed!');
    }
    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback();
  });

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback('User not found');
    }
    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(user.username, coords)
    );
    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.emit('message', generateMessage('Admin',`${user.username} has left room ${user.room}`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});



server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
