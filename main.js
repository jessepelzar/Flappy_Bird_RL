var myGamePiece;
var myObstacles = [];
var deadObstacles = [];
var myScore;
var maxScore;
var roundsPlayed;
var episode;
var iteration;
var paused = false;
var slow = false;
var numStates = 60;
// flappy
class component {
  constructor(id, width, height, color, x, y, type) {
    this.type = type;
    this.color = color;
    if (this.type == "image") {
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

    this.obsticalSpeedX = -2.5;
    this.env_y_min = 0;
    this.env_y_max = 300;
    this.env_y_obs_min = 0;
    this.env_y_obs_max = 0;
    this.minHeight = 50;
    this.maxHeight = 115;
    this.gapHeight = 135;
    this.intervalVal = 100;

    this.distToCeil = 0;
    this.distToFloor = 0;
    this.deltaTopBar = 0;
    this.deltaBottomBar = 0;
    this.obstacleTopHeight = 0;
    this.obstacleBottomHeight = 0;
    this.gravity = 0;
    this.gravitySpeed = 0;
    this.score = 0;
    this.maxScore = 0;
    this.round = 0;
    this.jumpMultiplier = 0;
    this.obsticalPosition = 0;

    this.action = 0;
    this.reward = 0;
    this.totalReward = 0;
    this.done = false;
  }
  update() {
    let ctx = myGameArea.context;
    if (this.type == "text") {
      ctx.font = this.width + " " + this.height;
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, this.x, this.y);
    } else if (this.type == "image") {
      ctx.drawImage(this.image,
        this.x,
        this.y,
        this.width, this.height);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  newPos() {
    this.y += this.speedY;
    this.checkDistCeiling();
    this.checkDistFloor();
  }
  checkDistCeiling() {
    if (this.y <= 0) {
      this.y = 0;
      this.speedY = this.gravitySpeed;
    }
    this.distToCeil = this.y;
  }
  checkDistFloor() {
    if (this.y >= myGameArea.canvas.height - this.height) {
      this.y = myGameArea.canvas.height - this.height;
    }
    this.distToFloor = myGameArea.canvas.height - (this.height + this.y);
  }

  crashWith(otherobj) {
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
  myScore = new component("text", "15px", "Roboto", "white", 280, 40, "text");
  roundsPlayed = new component("text", "15px", "Roboto", "white", 280, 70, "text");
  episode = new component("text", "15px", "Roboto", "white", 280, 100, "text");
  iteration = new component("text", "15px", "Roboto", "white", 280, 130, "text");
  maxScore = new component("text", "15px", "Roboto", "white", 280, 160, "text");
  myGameArea.start();
}

let myGameArea = {
  canvas: document.createElement("canvas"),
  start: function() {
    this.canvas.width = 400;
    this.canvas.height = myGamePiece.env_y_max;
    this.context = this.canvas.getContext("2d");
    var background = new Image();
    background.src = "images/bg.png";
    background.onload = () => {
      this.context.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
    }
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.frameNo = 0;
    main();
    // setInterval(updateGameArea, 20);
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
    deadObstacles = [];
    myGamePiece.round++;
    myGameArea.frameNo = 0;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Number.prototype.map = function(in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function toState(stateTop, stateBottom) {

  // var num = myGamePiece.obstacleBottomHeight - myGamePiece.obstacleTopHeight;
  // var val = Math.floor(num.map(myGamePiece.minHeight - myGamePiece.maxHeight, myGamePiece.maxHeight - myGamePiece.minHeight, 0, numStates-1));
  // var agentval = Math.floor(myGamePiece.y.map(0, myGamePiece.env_y_max-myGamePiece.height, 0, numStates-1));
  var deltaTop = Math.floor(myGamePiece.deltaTopBar.map(-115, 220, 0, numStates-1));
  var deltaBottom = Math.floor(myGamePiece.deltaBottomBar.map(-115, 220, 0, numStates-1));
  var reward = Math.abs(Math.pow(Math.abs(deltaTop - deltaBottom), 3)) * -1;
  myGamePiece.reward = reward;
  return {deltaTop, deltaBottom};
}

async function main() {
  let episodes = 10000;
  let eps = 0.02;
  let initial_lr = 1.0;
  let min_lr = 0.003;
  let gamma = 1.0;
  let alpha = 0.05;
  // setInterval(updateGameArea, 20);

  var q_table = Array(numStates).fill().map( () => Array(numStates).fill().map( () => Array(2).fill(0)));


  for (let i = 0; i < episodes; i++) {
    myGamePiece.totalReward = 0;
    let eta = Math.max(min_lr, initial_lr * (Math.pow(0.85, Math.floor(i/100))));

    for (let j = 0; j < 5000; j++) {
      await sleep(.0001);
      let stateMap = toState(myGamePiece.deltaTopBar, myGamePiece.deltaBottomBar);
      let a = stateMap.deltaTop;
      let b = stateMap.deltaBottom;
      // console.log("--------------");
      // console.log(`a: ${a}`);
      // console.log(`b: ${b}`);
      // console.log(`reeee: ${myGamePiece.reward}`);
      if (Math.random() < 0.1) {
        myGamePiece.action = Math.floor(Math.random() * 2);
      } else {
        myGamePiece.action = q_table[a][b].indexOf(Math.max(...q_table[a][b]));
        // console.log(`${q_table[a][b]} ${myGamePiece.action}`);
      }

      updateGameArea();

      // console.log(`reward: ${myGamePiece.reward}`);
      myGamePiece.totalReward += (Math.pow(gamma, j)) * myGamePiece.reward;
      let stateMap_n = toState(myGamePiece.deltaTopBar, myGamePiece.deltaBottomBar);
      let a_n = stateMap_n.deltaTop;
      let b_n = stateMap_n.deltaBottom;
      // console.log(`aN: ${a_n}`);
      // console.log(`bN: ${b_n}`);
      // console.log(`reeee: ${myGamePiece.reward}`);
      // console.log("--------------");
      // console.log( myGamePiece.reward);

      q_table[a][b][myGamePiece.action] = (1 - alpha) * q_table[a][b][myGamePiece.action] + (alpha * (myGamePiece.reward + (gamma * Math.max(...q_table[a_n][b_n]))));
      // let next = myGamePiece.reward + gamma * Math.max(...q_table[a_n][b_n]);
      // let current = q_table[a][b][myGamePiece.action]
      // q_table[a][b][myGamePiece.action] = current + eta * (next - current);
      iteration.text = "ITERATION: " + j;
      iteration.update();
      episode.text = "EPISODE: " + i;
      episode.update();
    }
    console.log(`Iteration ${i+1} -- Total reward = ${myGamePiece.totalReward} ${eta}`);
    // await sleep(.0001);
  }
  console.log(`${myGamePiece.totalReward} ${myGamePiece.maxScore}`);
}


function updateGameArea() {
  if (paused) return;


  for (let i = 0; i < myObstacles.length; i++) {
    if (myGamePiece.crashWith(myObstacles[i])) {
      // myGamePiece.reward = -1000;
      myGameArea.reset();
      /* Important: need to set penalty before termination */
      return -1;
    }
  }


  myGameArea.clear();
  myGameArea.frameNo += 1;

  if (myGameArea.frameNo == 1 || everyinterval(myGamePiece.intervalVal)) {
    let x = myGameArea.canvas.width;
    let y = myGameArea.canvas.height;
    let height = Math.floor(Math.random() * (myGamePiece.maxHeight - myGamePiece.minHeight + 1) + myGamePiece.minHeight);
    // let bars = [115, 50, 80];
    // height = bars[Math.floor(Math.random() * 3)];
    myObstacles.push(new component("tbar", 40, height, "images/tp.png", x, 0, "image"));
    myObstacles.push(new component("bbar", 40, y - height - myGamePiece.gapHeight, "images/bp.png", x, height + myGamePiece.gapHeight, "image"));
  }


  if (myGamePiece.action == 1) {
    moveUp();
  }
  else {
    moveDown();
  }

  // if (myGamePiece.deltaTopBar !== Math.floor(myGamePiece.gapHeight / 2)) {
  //   myGamePiece.reward = -10;
  // } else {
  //   myGamePiece.reward = 0;
  // }

  // console.log(` ${myGamePiece.deltaTopBar} ${Math.floor(myGamePiece.gapHeight / 2)} ${myGamePiece.reward}`);

  myGamePiece.obstacleTopHeight = myObstacles[0].height;
  myGamePiece.obstacleBottomHeight = myObstacles[1].height;
  myGamePiece.deltaTopBar = myGamePiece.distToCeil - myGamePiece.obstacleTopHeight;
  myGamePiece.deltaBottomBar = myGamePiece.distToFloor - myGamePiece.obstacleBottomHeight;
  myGamePiece.env_y_obs_min = myGamePiece.obstacleTopHeight;
  myGamePiece.env_y_obs_max = myGamePiece.env_y_max - myGamePiece.obstacleBottomHeight;

  for (let i = 0; i < myObstacles.length; i += 2) {
    // edge case to see if out of bounds, remove from array
    if (myObstacles[i].x + myObstacles[i].width == myGamePiece.x) {
      // deadObstacles.push(myObstacles[i]) // add to passed array
      myGamePiece.score++;
      if (myGamePiece.score > myGamePiece.maxScore) {myGamePiece.maxScore = myGamePiece.score}
      deadObstacles.push(new component("tbar", 40, myObstacles[i].height, "images/tp.png", myObstacles[i].x, myObstacles[i].y, "image"));
      deadObstacles.push(new component("bbar", 40, myObstacles[i+1].height, "images/bp.png", myObstacles[i].x, myObstacles[i+1].y, "image"));
      myObstacles.splice(0, 2); // remove from obs array not passed
      // get next values in queue
      myGamePiece.obstacleTopHeight = myObstacles[i].height;
      myGamePiece.obstacleBottomHeight = myObstacles[i+1].height;
      myGamePiece.deltaTopBar = myGamePiece.distToCeil - myGamePiece.obstacleTopHeight;
      myGamePiece.deltaBottomBar = myGamePiece.distToFloor - myGamePiece.obstacleBottomHeight;
      myGamePiece.env_y_obs_min = myGamePiece.obstacleTopHeight;
      myGamePiece.env_y_obs_max = myGamePiece.env_y_max - myGamePiece.obstacleBottomHeight;
      myGamePiece.done = true;
      // myGamePiece.reward = 1000;
    }
    myObstacles[i].x += myGamePiece.obsticalSpeedX;
    myObstacles[i+1].x += myGamePiece.obsticalSpeedX;
    myObstacles[i].update();
    myObstacles[i+1].update();

    if (deadObstacles.length !== 0) {
      deadObstacles[i].x += myGamePiece.obsticalSpeedX;
      deadObstacles[i+1].x += myGamePiece.obsticalSpeedX;
      deadObstacles[i].update();
      deadObstacles[i+1].update();
      if (deadObstacles[i].x + deadObstacles[i].width < 0) {
        deadObstacles.splice(0, 2);
      }
    }


  }





  // if (myGamePiece.deltaTopBar <= 10 || myGamePiece.deltaBottomBar <= 10) {
  //   myGamePiece.reward = -100;
  // } else {
  //   myGamePiece.reward = 1;
  // }





  // if (myGamePiece.action == 1) {
  //   moveup();
  // }
  // setGamePieceSpeed();

  myScore.text = "SCORE: " + myGamePiece.score;
  roundsPlayed.text = "ROUND: " + myGamePiece.round;
  maxScore.text = "MAX SCORE: " + myGamePiece.maxScore;
  myScore.update();
  maxScore.update();
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
  // console.log(myGamePiece.speedY);
}


function everyinterval(n) {
  if ((myGameArea.frameNo / n) % 1 == 0) {
    return true;
  }
  return false;
}

function moveup() {
  if (myGamePiece.speedY < myGamePiece.gravitySpeed) return;
  // myGamePiece.speedY -= 4 * myGamePiece.jumpMultiplier;
  myGamePiece.speedY -= 4 * myGamePiece.jumpMultiplier;
  myGamePiece.newPos();
}

function moveUp() {
  myGamePiece.speedY = -5;
  myGamePiece.newPos();
}
function moveDown() {
  myGamePiece.speedY = 1;
  myGamePiece.newPos();
}

document.body.onkeyup = function(e) {
  if (e.keyCode == 32) {
    moveup();
  }
  if (e.keyCode == 13) {
    // paused = !paused;
    slow = !slow;
  }
}
