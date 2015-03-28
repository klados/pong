
var canvas;
var ctx;
var dir ={x:2,y:2};
var leftScore = 0;
var rightScore = 0;
var WIDTH=500;
var HEIGHT=300;

//------------
$("#myModal").modal('hide');

var socket = io().connect('http://snf-537850.vm.okeanos.grnet.gr');
var game = io.connect('/pong-namespace');


var usernames = window.location.pathname; //store the username
usernames = usernames.substr(10); //remove the '/PongGame/'
var t = usernames.indexOf("-"); //format name1-name2
//the first name always will be my name and the second will my opponent name
var myName = usernames.substr(0,t); //first name
var friendName = usernames.substr(t+1); //second name
var pos; // -1->left side, 1->rigth side
pos = myName.localeCompare(friendName);
//if the player A toke the left side the player B will take the rigth side



setTimeout(function(){
  if(pos == -1){
    $("#leftName").text(myName+":");
    $("#rightName").text(friendName+":");
  }
  else if(pos == 1){
    $("#leftName").text(friendName+":");
    $("#rightName").text(myName+":");
  }
},1000);
//---------------

//###
var opponent_id;

game.emit("ponk connect",{myName:myName,friendName:friendName}); //send the data to the new namespace

game.on("second player id",function(id){//receave the id of the opponet , (if i am the second player that has connected)
    console.log("second player, accepted id:",id);
    opponent_id = id; //store the id from the opponet player
    //game.broadcast.to(id.friend).emit("first player id",id.my); //send my id to the first player
});

game.on("sound",function(data){ //play sound
  if(opponent_id == data.id && pos == 1){
    document.getElementById("ball").play();
  }
});

game.on("first player id",function(id){ //if i connect first
  console.log("first player, accepted id:",id);
  opponent_id = id; //store the id from the opponet player, if i connect first
});

game.on("bar",function(data){//receive the bar coordinates of the opponent player
  //console.log("->",data.coordinates);
  if( (pos == -1)&&(data.id == opponent_id ) ){//me: left side, opponent: rigth side
    right_bar.y = data.coordinates;
  }
  else if( (pos == 1)&&(data.id == opponent_id) ){//me: rigth side, opponent: left side
    left_bar.y = data.coordinates;
  }
});


game.on("ball",function(data){//receive the ball position
 if( (pos== 1) && (data.id == opponent_id) ){
   //console.log("data:",data.x,data.y);
   ball.x = data.x; ball.y = data.y;
  }
});

game.on("score",function(data){ //update the score
  if(pos == 1 && data.id == opponent_id){
    $("#leftScore").html(data.left);
    $("#rightScore").html(data.right);
  }
});

game.on("offline player",function(ans){//receive the id of the player that leave a game

  //if(id == opponent){//he is my opponent
  if(ans==true){
    $("#demoCanvas").hide();
    $("#myModal").modal('show');
    $("#error_message").text("the other player left the game!");
    //alert("the other player left the game!");
    //$("#canvas_tag").hide(); //hide the canvas element
  }
  //}//else ignore

});

//###

// socket.on("players",function(table){// accept the table array and load it to the html
//   $('#players_list').empty(); //empty the old list
//
//   for(var i=0;i<table.length; i++) {
//     $('#players_list').append( $( "<li>",{}).text(table[i]) ); //add item to the list
//   }
// });

//------------------


setInterval( fps ,4000);//print the fps to the screans

function fps(){//TO DO
  $("#fps").html("fps:");
}//end of fps


window.addEventListener("beforeunload", function (e) {
  saveFormData();
   (e || window.event);
   return;
});

function saveFormData() {
  game.emit("mydisconnect",opponent_id);
}


function keypressed(event){ // key pressed event (move the left bar up or down)
if( opponent_id != undefined ){
  if(pos== -1){ //left side
      if(event.keyCode == 87 || event.keyCode == 119 ){ // w or W pressed
          if( left_bar.y  > 0 ){
            left_bar.y += -10;
            game.emit("bar",{coordinates:left_bar.y  ,id:opponent_id,username:myName});

          }
      }
      else if(event.keyCode == 83 || event.keyCode == 115){ // s or S pressed
          if( left_bar.y +100 < HEIGHT  ){
            left_bar.y += 10;
            game.emit("bar",{coordinates:left_bar.y ,id:opponent_id,username:myName});

          }
      }
  }
  else{ //right side
    if(event.keyCode == 87 || event.keyCode == 119 ){ // w or W pressed
        if( right_bar.y  > 0 ){
          right_bar.y +=  -10;
          game.emit("bar",{coordinates:right_bar.y ,id:opponent_id,username:myName});

        }
    }
    else if(event.keyCode == 83 || event.keyCode == 115){ // s or S pressed
        if( right_bar.y +100 < HEIGHT  ){
          right_bar.y += 10;
          game.emit("bar",{coordinates:right_bar.y ,id:opponent_id,username:myName});

        }
    }
  }//end of left-right side

} //opponent_id undefined ckeck
}//end of function


function muteSound(){ //mute/unmute sound
 if( $("#ball").prop('muted') ) {
    $("#ball").prop('muted', false);
  }
  else {
    $("#ball").prop('muted', true);
  }
}


var ball ={
  x:null,
  y:null,
  side:20,
  update:function(){
  if(pos == -1){
    this.x += dir.x;
    this.y += dir.y;
    //5 -> velocity
    if(this.y+2 <= 0 || this.y+this.side +2>= HEIGHT){//out of the canvas (up/down)
      dir.y = -dir.y;
      game.emit("sound",{id:opponent_id,username:myName});
      document.getElementById("ball").play();
    }

    game.emit("ball",{x:ball.x,y:ball.y,id:opponent_id,username:myName}); //send the coordinates of the ball

    var col = function(ax,ay,aw,ah,bx,by,bw,bh){
      return ax < bx+bw && ay < by+bh && bx < ax+aw && by < ay+ah;
    }

    var pdle = dir.x < 0 ? left_bar : right_bar;
    if(col(pdle.x, pdle.y, pdle.width ,pdle.height,this.x,this.y,this.side,this.side)){
      dir.x = - dir.x;
    }

    if( this.x+this.side<0){//left goal
      rightScore++;
      $("#rightScore").text(rightScore);
      game.emit("score",{left:leftScore,right:rightScore,id:opponent_id,username:myName});

      ball.x = (WIDTH - ball.side)/2;
      ball.y = (HEIGHT - ball.side)/2;
    }
    else if( this.x>WIDTH){//right goal
      leftScore++;
      $("#leftScore").text(leftScore);
      game.emit("score",{left:leftScore,right:rightScore,id:opponent_id,username:myName});

      ball.x = (WIDTH - ball.side)/2;
      ball.y = (HEIGHT - ball.side)/2;
    }
  }
  },
  draw:function(){
    ctx.fillRect(this.x,this.y,this.side,this.side);
  }

};

var left_bar ={
  x:null,
  y:null,
  width:10,
  height:100,

  update:function(){

  },
  draw:function(){
    ctx.fillRect(this.x,this.y,this.width,this.height);
  }

};

var right_bar ={
  x:null,
  y:null,
  width:10,
  height:100,

  update:function(){

  },
  draw:function(){
    ctx.fillRect(this.x,this.y,this.width,this.height);
  }

};


function update(){
  left_bar.update();
  right_bar.update();
  ball.update();
}

function draw(){
  ctx.fillRect(0,0,WIDTH,HEIGHT);

  ctx.save();

  ctx.fillStyle = "#fff";
  left_bar.draw();
  right_bar.draw();
  ball.draw();

  ctx.restore();
}

function init(){
  left_bar.x = left_bar.width;
  left_bar.y = (HEIGHT -left_bar.height)/2;

  right_bar.x = WIDTH - (left_bar.width + right_bar.width);
  right_bar.y = (HEIGHT - right_bar.height)/2;

  ball.x = (WIDTH - ball.side)/2;
  ball.y = (HEIGHT - ball.side)/2;
}


function main(){
  canvas = document.getElementById('demoCanvas');
  ctx = canvas.getContext("2d");

  this.addEventListener("keydown", keypressed);

  init();

  var loop = function(){
    update();
    draw();
    window.requestAnimationFrame(loop,canvas);
  };

  window.requestAnimationFrame(loop,canvas);

}//end of main function


// setTimeout(function(){
//   if(pos == -1){main();} // the left player control the game
// },2000);
