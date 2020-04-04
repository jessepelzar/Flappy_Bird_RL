var myGamePiece;
var myObstacles = [];
var myScore;
var roundsPlayed;
var paused = false;
// flappy
function component(id, width, height, color, x, y, type) {
  this.type = type;
  if (type == "image") {
    this.image = new Image();
    this.image.src = color;
  }
  this.id = id;
  this.width = width;
  this.height = height;
  this.speedX = 0;
  this.speedY = 0;
  this.x = x;
  this.y = y;
  this.distToCeil = 0;
  this.distToFloor = 0;
  this.distToTopBar_y = 0;
  this.distToBottomBar_y = 0;
  this.optimalStateTop = 0;
  this.optimalStateBottom = 0;
  this.gravity = 0;
  this.gravitySpeed = 0;
  this.score = 0;
  this.round = 0;
  this.jumpMultiplier = 0;
  this.passedPlayer = false;
  this.update = () => {
    ctx = myGameArea.context;
    if (this.type == "text") {
      ctx.font = this.width + " " + this.height;
      ctx.fillStyle = color;
      ctx.fillText(this.text, this.x, this.y);
    } else if (type == "image") {
      ctx.drawImage(this.image,
        this.x,
        this.y,
        this.width, this.height);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  this.newPos = () => {
    this.y += this.speedY;
    this.checkDistCeiling();
    this.checkDistFloor();
  }
  this.checkDistCeiling = () => {
    if (this.y <= 0) {
      this.y = 0;
      this.speedY = this.gravitySpeed;
    }
    this.distToCeil = this.y;
  }
  this.checkDistFloor = () => {
    if (this.y >= myGameArea.canvas.height - this.height) {
      this.y = myGameArea.canvas.height - this.height;
    }
    this.distToFloor = myGameArea.canvas.height - (this.height + this.y);
  }

  this.crashWith = function(otherobj) {
    var myleft = this.x;
    var myright = this.x + (this.width);
    var mytop = this.y;
    var mybottom = this.y + (this.height);
    var otherleft = otherobj.x;
    var otherright = otherobj.x + (otherobj.width);
    var othertop = otherobj.y;
    var otherbottom = otherobj.y + (otherobj.height);
    var crash = true;
    // console.log(mytop);
    if (((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) && (mybottom < myGameArea.canvas.height)) {
      crash = false;
    }
    return crash;
  }
}

function startGame() {
  myGamePiece = new component("agent", 40, 30, "images/bird.png", 100, 120, "image");
  myGamePiece.gravitySpeed = 4.5;
  myGamePiece.jumpMultiplier = 4.0;
  // myGamePiece.gravitySpeed = 0;
  // myGamePiece.jumpMultiplier = 0;
  myGamePiece.gravity = 0;
  myScore = new component("text", "20px", "Roboto", "white", 280, 40, "text");
  roundsPlayed = new component("text", "20px", "Roboto", "white", 280, 70, "text");
  myGameArea.start();
}

let myGameArea = {
  canvas: document.createElement("canvas"),
  start: function() {
    this.canvas.width = 400;
    this.canvas.height = 270;
    this.context = this.canvas.getContext("2d");
    var background = new Image();
    background.src = "images/bg.png";
    background.onload = () => {
      this.context.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
    }
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 20);
  },
  clear: function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    var background = new Image();
    background.src = "images/bg.png";
    this.context.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
  },
  reset: () => {
    myGamePiece.y = 120;
    myGamePiece.score = 0;
    myObstacles = [];
    myGamePiece.round++;
    myGameArea.frameNo = 0;
  }
}


function updateGameArea() {
  if (paused) return;
  var x, height, gap, minHeight, maxHeight, minGap, maxGap, intervalVal, obsticalSpeedX;
  minHeight = 50;
  maxHeight = 120;
  gapHeight = 135;
  intervalVal = 100;
  obsticalSpeedX = -2.5;

  for (let i = 0; i < myObstacles.length; i++) {
    if (myGamePiece.crashWith(myObstacles[i])) {
      myGameArea.reset();
      /*Important: need to set penalty before termination*/
      return;
    }
  }
  setGamePieceSpeed();
  myGameArea.clear();
  myGameArea.frameNo += 1;
  if (myGameArea.frameNo == 1 || everyinterval(intervalVal)) {
    x = myGameArea.canvas.width;
    y = myGameArea.canvas.height;
    height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
    myObstacles.push(new component("tbar", 40, height, "images/tp.png", x, 0, "image"));
    myObstacles.push(new component("bbar", 40, y - height - gapHeight, "images/bp.png", x, height + gapHeight, "image"));
  }

  myGamePiece.optimalStateTop = myObstacles[0].height;
  myGamePiece.optimalStateBottom = myObstacles[1].height;
  myGamePiece.distToTopBar_y = myGamePiece.distToCeil - myObstacles[0].height;
  myGamePiece.distToBottomBar_y = myGamePiece.distToFloor - myObstacles[1].height;
  //

  for (let i = 0; i < myObstacles.length; i+=2) {
    myObstacles[i].x += obsticalSpeedX;
    myObstacles[i+1].x += obsticalSpeedX;

    // edge case to see if out of bounds, remove from array
    if (myObstacles[i].x + myObstacles[i].width < 0) {
      myObstacles.splice(0, 2);
    }
    myObstacles[i].update();
    myObstacles[i+1].update();
    // console.log(`${myObstacles[i].x} ${myGamePiece.x}`);
    if (myObstacles[i].x + myObstacles[i].width == myGamePiece.x) {
      // console.log("good");
      myGamePiece.score++;
      myObstacles[i+1].passedPlayer = true;
      myObstacles[i].passedPlayer = true;
      // myGamePiece.optimalStateTop = myObstacles[myObstacles.length-2].height;
      // myGamePiece.optimalStateBottom = myObstacles[myObstacles.length-1].height;
      // myGamePiece.distToTopBar_y = myGamePiece.distToCeil - myGamePiece.optimalStateTop;
      // myGamePiece.distToBottomBar_y = myGamePiece.distToFloor - myGamePiece.optimalStateBottom;
    }
    else if (myObstacles[i].x + myObstacles[i].width < myGamePiece.x) { // get Y distance to the next top and bottom pipes
      // console.log("pass");
      myGamePiece.optimalStateTop = myObstacles[myObstacles.length-2].height;
      myGamePiece.optimalStateBottom = myObstacles[myObstacles.length-1].height;
      myGamePiece.distToTopBar_y = myGamePiece.distToCeil - myGamePiece.optimalStateTop;
      myGamePiece.distToBottomBar_y = myGamePiece.distToFloor - myGamePiece.optimalStateBottom;
    }
  }
  if (myGamePiece.distToBottomBar_y < 10) {
    console.time();
    moveup();
    console.timeEnd();
  }
  // console.log(myGamePiece.optimalStateTop);
  // console.log(myGamePiece.optimalStateBottom);
  // console.log(`top ${myGamePiece.distToTopBar_y}`);
  // console.log(`bottom ${myGamePiece.distToBottomBar_y}`);



  myScore.text = "SCORE: " + myGamePiece.score;
  roundsPlayed.text = "ROUND: " + myGamePiece.round;
  myScore.update();
  roundsPlayed.update();
  myGamePiece.newPos();
  myGamePiece.update();
}

function setGamePieceSpeed() {
  if (myGamePiece.speedY > myGamePiece.gravitySpeed) {
    myGamePiece.speedY--;
  } else if (myGamePiece.speedY < myGamePiece.gravitySpeed) {
    myGamePiece.speedY++;
  }
  console.log(myGamePiece.speedY);
}


function everyinterval(n) {
  if ((myGameArea.frameNo / n) % 1 == 0) {
    return true;
  }
  return false;
}

function moveup() {
  if (myGamePiece.speedY < myGamePiece.gravitySpeed) return;
  myGamePiece.speedY -= 4 * myGamePiece.jumpMultiplier;
  myGamePiece.newPos();
}

document.body.onkeyup = function(e) {
  if (e.keyCode == 32) {
    //your code
    console.time();
    moveup();
    console.timeEnd();

  }
  if (e.keyCode == 13) {
    paused = !paused;
  }
}
