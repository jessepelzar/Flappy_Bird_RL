var myGamePiece;
var myObstacles = [];
var myScore;
var roundsPlayed;
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
  this.gravity = 0;
  this.gravitySpeed = 0;
  this.score = 0;
  this.round = 0;
  this.jumpMultiplier = 0;
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
    this.x += this.speedX;
    this.y += this.speedY;
    this.hitTop();
    this.hitBottom();
  }
  this.hitTop = () => {
    if (this.y <= 0) {
      this.y = 0;
      this.speedY = this.gravitySpeed;
    }
  }
  this.hitBottom = () => {
    if (this.y >= myGameArea.canvas.height - this.height) {
      this.y = myGameArea.canvas.height - this.height;
    }
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
    if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
      crash = false;
    }
    return crash;
  }
}

function startGame() {
  myGamePiece = new component("agent", 40, 30, "images/bird.png", 100, 120, "image");
  myGamePiece.gravitySpeed = 4.5;
  myGamePiece.jumpMultiplier = 4.0;
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
    var bottomBar = new Image();
    var topBar = new Image();
    var bird = new Image();

    background.src = "images/bg.png";
    bottomBar.src = "images/bp.png";
    topBar.src = "images/tp.png";
    bird.src = "images/bird.png";

    background.onload = () => {
      this.context.drawImage(background,0,0, this.canvas.width, this.canvas.height);
    }

    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 20);
  },
  clear: function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    var background = new Image();
    background.src = "images/bg.png";
    this.context.drawImage(background,0,0, this.canvas.width, this.canvas.height);
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
  var x, height, gap, minHeight, maxHeight, minGap, maxGap, intervalVal, obsticalSpeedX;
  minHeight = 50;
  maxHeight = 120;
  gapHeight = 135;
  intervalVal = 100;
  obsticalSpeedX = -2.5;

  for (let i = 0; i < myObstacles.length; i++) {
    if (myGamePiece.crashWith(myObstacles[i])) {
      myGameArea.reset();
      return;
    }
  }

  myGameArea.clear();
  myGameArea.frameNo += 1;
  if (myGameArea.frameNo == 1 || everyinterval(intervalVal)) {
    x = myGameArea.canvas.width;
    height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
    myObstacles.push(new component("tbar", 40, height, "images/tp.png", x, 0, "image"));
    myObstacles.push(new component("bbar", 40, x - height - gapHeight, "images/bp.png", x, height + gapHeight, "image"));
  }
  let t = true;
  for (let i = 0; i < myObstacles.length; i++) {
    myObstacles[i].x += obsticalSpeedX;
    myObstacles[i].update();
    if (myObstacles[i].x + myObstacles[i].width == myGamePiece.x) {
      if (t === true) {
        console.log("good");
        myGamePiece.score++;
      }
      t = false;
    }
  }

  setGamePieceSpeed();

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
}


function everyinterval(n) {
  if ((myGameArea.frameNo / n) % 1 == 0) {
    return true;
  }
  return false;
}

function moveup() {
  myGamePiece.speedY -= 4 * myGamePiece.jumpMultiplier;
  myGamePiece.newPos();
}

document.body.onkeyup = function(e) {
  if (e.keyCode == 32) {
    //your code
    moveup();
  }
}
