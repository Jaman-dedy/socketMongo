const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// connect to mongo

mongo.connect('mongodb://127.0.0.1/mongochat', function (err, db) {
  if (err) {
    throw err;
  }
  console.log('MongoDb connected...');

  // Connect to socket .io

  client.on('connection', function (socket) {
    let chat = db.collection('chats');

    // send status to the server

    sendStatus = function (s) {
      socket.emit('status', s);
    };

    // get chats from mongo collection
    chat
      .find()
      .limit(100)
      .sort({ _id: 1 })
      .toArray(function (err, res) {
        if (err) {
          throw err;
        }

        // Emit the messages

        socket.emit('output', res);
      });

    //Handle input events

    socket.on('input', function (data) {
      let name = data.name;
      let message = data.message;

      // check for name and message

      if (name == '' || message == '') {
        // send error status

        sendStatus('please enter a name and message');
      } else {
        // Insert in the db

        chat.insert({ name: name, message: message }, function () {
          client.emit('output', [data]);

          // send status object
          sendStatus({
            message: 'Message sent',
            clear: true,
          });
        });
      }
    });
    // handle clear

    socket.on('clear', function () {
      // remove all chats from the collection

      chat.remove({}, function () {
        // Emit cleared
        socket.emit('clear');
      });
    });
  });
});
