module.exports = function(io, express) {
    var router = express.Router();
    var userSocketMap = {};
    var usernames = [];

    /* GET chat page */
    router.get('/', function(req, res) {
      res.render('chat', { title: 'My Simple Chat' });
    });

    io.on('connection', function(socket) {
        console.log("A user has connected to socket.io");

        socket.on('disconnect', function() {
            var username = userSocketMap[socket.id];

            console.log('User ' + '"' + username + '"' + ' has disconnected from the chat');

            index = usernames.indexOf(username);

            if (index >= 0) {
                usernames.splice(index, 1);
            }

            delete userSocketMap[socket.id];

            console.log(usernames);
            console.log(userSocketMap);

            //Broadcast to all active clients that a user just left.
            socket.broadcast.emit('user-left', {'username': username});
        });

        socket.on('init', function(info) {
            if (info && info.hasOwnProperty('username')) {
                userSocketMap[socket.id] = info.username;
                usernames.push(info.username);

                //Send the welcome message and a list of all current users to the new user.
                socket.emit('sys-message', {'user': 'system', 'message': 'Welcome to the chat!'});  
                socket.emit('userlist', usernames);

                //Send the new user to all current clients
                socket.broadcast.emit('user-joined', {'username': info.username}); 
            }
        });

        socket.on('send-message', function(message) {
            console.log('Received message: ' + message.message + ' from user: ' + message.user);

            socket.broadcast.emit('message', message);
            socket.emit('message-sent', {'success': 'true', 'message': message.message});
        });
    });

    return router;
}