var myGamePiece;
var myObstacles = [];
var deadObstacles = [];
var myScore;
var roundsPlayed;
var paused = false;
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
    this.optimalStateTop = 0;
    this.optimalStateBottom = 0;
    this.gravity = 0;
    this.gravitySpeed = 0;
    this.score = 0;
    this.round = 0;
    this.jumpMultiplier = 0;
    this.obsticalPosition = 0;

    this.action = false;
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
  myScore = new component("text", "20px", "Roboto", "white", 280, 40, "text");
  roundsPlayed = new component("text", "20px", "Roboto", "white", 280, 70, "text");
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
  let env_dy = myGameArea.canvas.height / numStates;
  let topDy = parseInt(stateTop / env_dy);
  let bottomDy = parseInt(stateBottom / env_dy);
  let agentY = parseInt(myGamePiece.y);

  // console.log(`Top dY: ${topDy}`);
  // console.log(`Bottom dY: ${bottomDy}`);
  // console.log(`optimalStateBottom: ${myGamePiece.optimalStateBottom - myGamePiece.optimalStateTop}`);
  var num = myGamePiece.optimalStateBottom - myGamePiece.optimalStateTop;
  var val = Math.floor(num.map(myGamePiece.minHeight - myGamePiece.maxHeight, myGamePiece.maxHeight - myGamePiece.minHeight, 0, numStates-1));
  var agentval = Math.floor(myGamePiece.y.map(0, myGamePiece.env_y_max-myGamePiece.height, 0, numStates-1));
  // console.log(`val: ${val}`);
  // console.log(`agent val: ${agentval}`);
  //
  // console.log("-------------");
  return {val, agentval};
}

async function main() {
  let episodes = 100000;
  let eps = 0.02;
  let initial_lr = 1.0;
  let min_lr = 0.003;
  let gamma = 1.0;
  // setInterval(updateGameArea, 20);

  var q_table = Array(numStates).fill().map( () => Array(numStates).fill().map( () => Array(2).fill(0)));

  for (let i = 0; i < episodes; i++) {
    myGamePiece.totalReward = 0;
    let eta = Math.max(min_lr, initial_lr * (Math.pow(0.85, (Math.floor(i/100)))));
    // console.log(`deltaTopBar: ${myGamePiece.deltaTopBar}`);
    // console.log(`deltaBottomBar: ${myGamePiece.deltaBottomBar}`);
    // await sleep(200);

    for (let j = 0; j < 10000; j++) {
      // console.log(myGamePiece.deltaTopBar);
      let stateMap = toState(myGamePiece.deltaTopBar, myGamePiece.deltaBottomBar);
      let a = stateMap.val;
      let b = stateMap.agentval;
      // console.log(a);
      // console.log(b);
      await sleep(.01);
      updateGameArea();

      let action = 0;
      // if (Math.floor(Math.random() * 2)) {
      if (Math.random() < 0.1) {
        myGamePiece.action = true;
        action = 1;
      } else {
        myGamePiece.action = false;
        action = 0;
      }
      myGamePiece.totalReward += (Math.pow(gamma, j)) * myGamePiece.reward;
      let stateMap_n = toState(myGamePiece.deltaTopBar, myGamePiece.deltaBottomBar);
      let a_n = stateMap.val;
      let b_n = stateMap.agentval;
      // console.log(a);
      // console.log(b);
      // console.log(a_n);
      // console.log(b_n);
      // console.log(q_table[a][b][action]);
      // console.log(q_table[a_n][b_n][action]);
      q_table[a][b][action] = q_table[a][b][action] + eta * (myGamePiece.reward + gamma * Math.max(q_table[a_n][b_n]) - q_table[a][b][action]);
      // if (myGamePiece.done) {
      //   // reuse policy
      // }
      // console.log(`total reward: ${myGamePiece.totalReward}`);
      // console.log(`action: ${action}`);
    }
    if (i % 100 == 0) {
      console.log(`Iteration ${i+1} -- Total reward = ${myGamePiece.totalReward}`);
    }

  }
}


function updateGameArea() {
  if (paused) return;

  for (let i = 0; i < myObstacles.length; i++) {
    if (myGamePiece.crashWith(myObstacles[i])) {
      myGamePiece.totalReward = -1;
      myGameArea.reset();
      /* Important: need to set penalty before termination */
      return;
    }
  }

  setGamePieceSpeed();
  myGameArea.clear();
  myGameArea.frameNo += 1;

  if (myGameArea.frameNo == 1 || everyinterval(myGamePiece.intervalVal)) {
    let x = myGameArea.canvas.width;
    let y = myGameArea.canvas.height;
    let height = Math.floor(Math.random() * (myGamePiece.maxHeight - myGamePiece.minHeight + 1) + myGamePiece.minHeight);
    myObstacles.push(new component("tbar", 40, height, "images/tp.png", x, 0, "image"));
    myObstacles.push(new component("bbar", 40, y - height - myGamePiece.gapHeight, "images/bp.png", x, height + myGamePiece.gapHeight, "image"));
  }

  myGamePiece.optimalStateTop = myObstacles[0].height;
  myGamePiece.optimalStateBottom = myObstacles[1].height;
  myGamePiece.deltaTopBar = myGamePiece.distToCeil - myObstacles[0].height;
  myGamePiece.deltaBottomBar = myGamePiece.distToFloor - myObstacles[1].height;
  myGamePiece.env_y_obs_min = myGamePiece.optimalStateTop;
  myGamePiece.env_y_obs_max = myGamePiece.env_y_max - myGamePiece.optimalStateBottom;

  for (let i = 0; i < myObstacles.length; i += 2) {
    // edge case to see if out of bounds, remove from array
    if (myObstacles[i].x + myObstacles[i].width == myGamePiece.x) {
      // deadObstacles.push(myObstacles[i]) // add to passed array
      myGamePiece.score++;
      deadObstacles.push(new component("tbar", 40, myObstacles[i].height, "images/tp.png", myObstacles[i].x, myObstacles[i].y, "image"));
      deadObstacles.push(new component("bbar", 40, myObstacles[i+1].height, "images/bp.png", myObstacles[i].x, myObstacles[i+1].y, "image"));
      myObstacles.splice(0, 2); // remove from obs array not passed
      // get next values in queue
      myGamePiece.optimalStateTop = myObstacles[i].height;
      myGamePiece.optimalStateBottom = myObstacles[i+1].height;
      myGamePiece.deltaTopBar = myGamePiece.distToCeil - myGamePiece.optimalStateTop;
      myGamePiece.deltaBottomBar = myGamePiece.distToFloor - myGamePiece.optimalStateBottom;
      myGamePiece.env_y_obs_min = myGamePiece.optimalStateTop;
      myGamePiece.env_y_obs_max = myGamePiece.env_y_max - myGamePiece.optimalStateBottom;
      myGamePiece.done = true;
      // myGamePiece.totalReward = 0;
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

  // console.log('-----------------------');
  // console.log(`env_y_obs_min: ${myGamePiece.env_y_obs_min}`);
  // console.log(`env_y_obs_max: ${myGamePiece.env_y_obs_max}`);
  if (myGamePiece.deltaTopBar <= 0 || myGamePiece.deltaBottomBar <= 0) {
    myGamePiece.reward = -1;
  } else {
    myGamePiece.reward = 1;
  }

  if (myGamePiece.action) {
    moveup();
  }

  myScore.text = "SCORE: " + myGamePiece.score;
  roundsPlayed.text = "ROUND: " + myGamePiece.round;
  myScore.update();
  roundsPlayed.update();
  myGamePiece.newPos();
  myGamePiece.update();

  // console.log(`deltaTopBar: ${myGamePiece.deltaTopBar}`);
  // console.log(`deltaBottomBar: ${myGamePiece.deltaBottomBar}`);

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
  myGamePiece.speedY -= 4 * myGamePiece.jumpMultiplier;
  myGamePiece.newPos();
}

document.body.onkeyup = function(e) {
  if (e.keyCode == 32) {
    moveup();
  }
  if (e.keyCode == 13) {
    paused = !paused;
  }
}
