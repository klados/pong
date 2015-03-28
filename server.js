// pong project
//depends express , socket.io , nodemon

//io.sockets.emit --> send to all the clients
//socket.emit -> send only to the current client

var  express = require('express');
var app = express();

var	server = require('http').createServer(app);
var	io = require('socket.io').listen(server);

//server.listen(9000);
server.listen(9000,function(){
  var host = server.address().addres;
  var port = server.address().port;
  console.log('Server listening at http://%s:%s', host, port);
});

var online_users = 0; //total online players (lobby)
var username_table = []; //array that hold all the usernames

var socket_id_table = []; //store the socket id from each player (establish connection player with player)
var usernames_in_game = []; // store the name after the redirection
//------------------

//###
var game = io.of('/pong-namespace')
.on('connection', function(socket){
  console.log("new connection to pong namespace...");


  socket.on("ponk connect",function(names){//when the client try to 'play'

    if(usernames_in_game.indexOf(names.myName) <0 ){ //the myName does not exists

      game.username = names.myName;
      socket_id_table.push(socket.id);
      usernames_in_game.push(names.myName);
      console.log("socket id table: %s\nusernames: %s",socket_id_table,usernames_in_game);

      if(usernames_in_game.indexOf(names.friendName)>-1){ //if the other player has already connected
        var t = usernames_in_game.indexOf(names.friendName); //frind the socket id of the opponent
        var temp = usernames_in_game.indexOf(names.myName);
        //στέλνω στον αντίπαλο (στο id του) ,το id μου
        socket.to(socket_id_table[t]).emit("first player id", socket_id_table[temp]);//send my socket id to the other oppenet

        //και στον εαυτό μου το id του άλλου
        socket.emit("second player id",socket_id_table[t]);//send to myself the id of my opponent
      }
      //else you are the first player that has been connected, you will receave your opponent's id when he will be connected

    }
    else{
      console.log("error the name exists!");
      //To Do: send an error message back to the client, close connection
    }

  });//end of "connect" socket


  socket.on("bar",function(data){//send to the opponent player the coordinates of my bar and my id
    //console.log("sender username "+game.username+" opponent id "+data.id);
    //socket.to(data.id).emit("bar",data.coordinates);
    var t = usernames_in_game.indexOf(data.username);
    socket.to(data.id).emit("bar",{coordinates:data.coordinates,id:socket_id_table[t]});
    //socket.broadcast.to( data.id ).emit('bar',{coordinates:data.coordinates,id:socket_id_table[t]});
  });


  socket.on("ball",function(data){
    //console.log("sender:"+game.username+" ball.y:"+data.y+" ball.x:"+data.x);
    var t = usernames_in_game.indexOf(data.username);
    socket.to(data.id).emit("ball",{x:data.x,y:data.y,id:socket_id_table[t]} );
  });


  socket.on("score",function(data){//update the score
    var t = usernames_in_game.indexOf(data.username);
    socket.to(data.id).emit("score",{left:data.left,right:data.right,id:socket_id_table[t]} );
  });


  socket.on("sound",function(data){
    var t = usernames_in_game.indexOf(data.username);
    socket.to(data.id).emit("sound",{id:socket_id_table[t]} );
  });


  socket.on('mydisconnect',function(op_id){ //disconnect user
    var t = socket_id_table.indexOf(op_id);
    if(t >-1){ //if the id exists
      //io.sockets.emit("offline player",op_id);//that player is offline ,from the "game" from now
      socket.to(op_id).emit("offline player",true);
      usernames_in_game.splice(t,1);//remove the name and the id from the arrays
      socket_id_table.splice(t,1);
      console.log("names %s \n id %s",usernames_in_game,socket_id_table);
    }
  });//end of disconnect

});

//###


io.sockets.on('connection', function(socket){ //receive data
//console.log("socket: "+ socket.id);

  io.sockets.emit("players",username_table);//send all the player's names, when a new player connect

  socket.on("username",function(name){ //accept the username for the client
      console.log("welcome "+ name+" online players: "+ ++online_users);
      socket.username = name;

      //socket_id_table.push(socket.id); // add the socket.id to the array
      username_table.push(name); // add the player to the list

      io.sockets.emit("players",username_table); //send the array to all the players
      //io.sockets.emit("socket id",socket_id_table);
  });

  socket.on("play",function(fname){ //send a request to play with someone
    console.log("fname:%s myname:%s",fname,socket.username);
    io.sockets.emit("play",{from:socket.username,to:fname});//send the proposal to the player
  });

  socket.on("play ans",function(a){ //send back to the first player the decision of the second player
    io.sockets.emit("play ans",a /*{to:a.to,ans:a.ans}*/);
  });

  socket.on("disconnect",function(){  //when the user leave the chat ....
    if(socket.username != undefined ){
      console.log(socket.username +" disconnected");
      var t = username_table.indexOf(socket.username);
      if(t>-1){
        username_table.splice(t,1); //delete the name from the array
        //socket_id_table.splice(t,1); //delete the socket
      }
      io.sockets.emit("players",username_table); //send the new array to all the players
      //io.sockets.emit("socket id",socket_id_table); //send the new array to all the players
      online_users--;
    }
    else console.log("bye bye unknown user");
  });

});//end of big function

//----------------

app.get('/PongGame/:id', function (req, res){
  res.sendFile(__dirname + '/pong.html' );
  console.log("new user --> " + req.params.id );
});

app.get('/Lobby',function(req,res){
  res.sendFile(__dirname + '/lobby.html' );
  console.log("new player!");
});
