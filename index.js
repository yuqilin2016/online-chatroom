let express = require('express')
let http = require('http')
let app = express()
let path = require('path')
let server = http.createServer(app)
let io = require('socket.io')(server);

let port = process.env.PORT || 3000
server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')))

let numUsers = 0

io.on('connection', (socket) => {
	let addedUser = false
  socket.on('add user', (username) => {
    if (addedUser) {
    	return false
    }
    socket.username = username
    ++numUsers
    addedUser = true
    socket.emit('login', {
      numUsers: numUsers
    })
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    })
  })

  socket.on('new message', (data) => {
  	socket.broadcast.emit('new message', {
  		username: socket.username,
  		message: data
  	})
  })

  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    })
  })

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    })
  })

  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers
    }
    socket.broadcast.emit('user left', {
      username: socket.username,
      numUsers: numUsers
    })
  })
});
