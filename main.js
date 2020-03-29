var myGamePiece;
var myObstacles = [];
var myScore;

function component(width, height, color, x, y, type) {
  this.width = width;
  this.height = height;
  this.speedX = 0;
  this.speedY = 0;
  this.x = x;
  this.y = y;
  this.gravity = 0;
  this.gravitySpeed = 0;
  this.type = type;
  this.score = 0;
  this.jumpMultiplier = 0;
  this.update = () => {
    ctx = myGameArea.context;
    if (this.type == "text") {
      ctx.font = this.width + " " + this.height;
      ctx.fillStyle = color;
      ctx.fillText(this.text, this.x, this.y);
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
  myGamePiece = new component(30, 30, "red", 100, 120);
  myGamePiece.gravitySpeed = 4;
  myGamePiece.jumpMultiplier = 3.7;
  myGamePiece.gravity = 0;
  myScore = new component("30px", "Consolas", "black", 280, 40, "text");
  myGameArea.start();
}

let myGameArea = {
  canvas: document.createElement("canvas"),
  start: function() {
    this.canvas.width = 480;
    this.canvas.height = 270;
    this.context = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 20);
  },
  clear: function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}


function updateGameArea() {
  var x, height, gap, minHeight, maxHeight, minGap, maxGap;
  minHeight = 50;
  maxHeight = 150;
  gapHeight = 130;

  for (i = 0; i < myObstacles.length; i += 1) {
    if (myGamePiece.crashWith(myObstacles[i])) {
      return;
    }
  }
  myGameArea.clear();
  myGameArea.frameNo += 1;
  if (myGameArea.frameNo == 1 || everyinterval(300)) {
    x = myGameArea.canvas.width;
    height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
    myObstacles.push(new component(50, height, "green", x, 0));
    myObstacles.push(new component(50, x - height - gapHeight, "green", x, height + gapHeight));
  }
  let t = true;
  for (let i = 0; i < myObstacles.length; i++) {
    myObstacles[i].x += -1;
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
  myScore.update();
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
