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
var numStates = 40;
var rewardExponent = 5;
var episodes = 10;
var iterations = 10000;
var gamma = 1.0;
var alpha = 0.05;
var epsilon = 0.2;
var speed = 3;
var speedUp = 3;
var speedDown = 1;
var jumpMode = true;
var humanMode = false;
var TERMINATE = false;
var q_table = Array(numStates).fill().map( () => Array(numStates).fill().map( () => Array(2).fill(0)));



function resetInputs() {
  numStates = 40;
  episodes = 10;
  iterations = 10000;
  gamma = 1.0;
  epsilon = 0.2;
  rewardExponent = 5;
  document.getElementById("number-states").value = numStates;
  document.getElementById("number-episodes").value = episodes;
  document.getElementById("number-iterations").value = iterations;
  document.getElementById("number-gamma").value = gamma;
  document.getElementById("number-epsilon").value = epsilon;
  document.getElementById("number-reward-exponent").value = rewardExponent;
}

function scanInputs() {
  numStates = document.getElementById("number-states").value;
  episodes = document.getElementById("number-episodes").value;
  iterations = document.getElementById("number-iterations").value;
  gamma = document.getElementById("number-gamma").value;
  epsilon = document.getElementById("number-epsilon").value;
  rewardExponent = document.getElementById("number-reward-exponent").value;
}

function resetButtonLabels() {
  document.getElementById('play-mode').innerHTML = 'Play Game';
  document.getElementById('learning-mode').innerHTML = 'Run Learning';
  document.getElementById('running-mode').innerHTML = 'Run Policy';
}


// inputs
/*
- numStates /
- Modes: Slow, Fast
- episodes /
- iterations /
- alpha
- gamma /
- rewardExponentialReductionValue /
- explorationRate /
------------------
buttons:
- generate policy
- run policy
- reset to defaults

jump modes:
- normal jump bounce
- strict up down
-
*/
// outputs
// flappy
class Component {
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
    this.interval = 0;

    this.distToCeil = 0;
    this.distToFloor = 0;
    this.deltaTopBar = 0;
    this.deltaBottomBar = 0;
    this.obstacleTopHeight = 0;
    this.obstacleBottomHeight = 0;
    this.gravity = 0;
    this.gravitySpeed = 4.5;
    this.score = 0;
    this.maxScore = 0;
    this.round = 0;
    this.jumpMultiplier = 3.0;
    this.obsticalPosition = 0;

    this.action = 0;
    this.reward = 0;
    this.totalReward = 0;
    this.done = false;
    this.episode = 0;
    this.iteration = 0;
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

function startGame(mode) {
  scanInputs();
  if (mode == 0 && document.getElementById('learning-mode').innerHTML == 'Stop') {
    TERMINATE = true;
    document.getElementById('learning-mode').innerHTML = 'Run Learning';
    myGameArea.reset();
    myGameArea.preload();
    return;
  }
  if (mode == 1 && document.getElementById('running-mode').innerHTML == 'Stop') {
    TERMINATE = true;
    document.getElementById('running-mode').innerHTML = 'Run Policy';
    myGameArea.reset();
    myGameArea.preload();
    return;
  }
  if (mode == 2 && document.getElementById('play-mode').innerHTML == 'Jump') {
    console.log("kncjsakcasjnk");
    moveup();
    return;
  }
  myGamePiece = new Component("agent", 40, 30, "images/bird.png", 100, 120, "image");
  myScore = new Component("text", "15px", "Roboto", "white", 280, 40, "text");
  roundsPlayed = new Component("text", "15px", "Roboto", "white", 280, 70, "text");
  episode = new Component("text", "15px", "Roboto", "white", 280, 100, "text");
  iteration = new Component("text", "15px", "Roboto", "white", 280, 130, "text");
  maxScore = new Component("text", "10px", "Roboto", "white", 280, 160, "text");
  if (mode == 0) {
    TERMINATE = false;
    resetButtonLabels();
    document.getElementById('learning-mode').innerHTML = 'Stop';
    myGameArea.reset();
    myGameArea.start();
    humanMode = false;
    main();
  } else if (mode == 1) {
    TERMINATE = false;
    resetButtonLabels();
    document.getElementById('running-mode').innerHTML = 'Stop';
    myGameArea.reset();
    myGameArea.start();
    humanMode = false;
    runPolicy();
  } else if (mode == 2) {
    TERMINATE = false;
    resetButtonLabels();
    myGameArea.reset();
    myGameArea.start();
    humanMode = true;
    // if (myGamePiece.done) {
    //   clearTimeout(myGamePiece.interval);
    // }
    myGamePiece.interval = setInterval(updateGameArea, 20);

    // document.getElementById('play-mode').innerHTML == 'Play Game';
    // myGameArea.reset();
    // myGameArea.preload();
    // console.log("crash");
    // clearTimeout(myGamePiece.interval);
  }
}

document.body.onload = () => {
  myGameArea.preload();
}

let myGameArea = {
  canvas: document.createElement("canvas"),
  preload: function() {
    this.canvas.width = 400;
    this.canvas.height = 300;
    this.context = this.canvas.getContext("2d");
    var background = new Image();
    background.src = "images/THUMBNAIL.png";
    background.onload = () => {
      this.context.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
    }
    document.body.insertBefore(this.canvas, document.body.childNodes[4]);
    this.frameNo = 0;
  },
  start: function() {
    this.canvas.width = 400;
    this.canvas.height = myGamePiece.env_y_max;
    this.context = this.canvas.getContext("2d");
    var background = new Image();
    background.src = "images/bg.png";
    background.onload = () => {
      this.context.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
    }
    document.body.insertBefore(this.canvas, document.body.childNodes[2]);
    this.frameNo = 0;

    // setInterval(updateGameArea, 20);
  },
  clear: function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    var background = new Image();
    background.src = "images/bg.png";
    this.context.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
  },
  reset: function() {
    // resetButtonLabels();
    myGamePiece.y = 120;
    myGamePiece.score = 0;
    myObstacles = [];
    deadObstacles = [];
    myGamePiece.round++;
    myGameArea.frameNo = 0;
    myGamePiece.done = false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Number.prototype.map = function(in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function toState(stateTop, stateBottom) {
  var deltaTop = Math.floor(myGamePiece.deltaTopBar.map(-1 * myGamePiece.maxHeight, myGamePiece.env_y_max - myGamePiece.minHeight - myGamePiece.height, 0, numStates-1));
  var deltaBottom = Math.floor(myGamePiece.deltaBottomBar.map(-1 * myGamePiece.maxHeight, myGamePiece.env_y_max - myGamePiece.minHeight - myGamePiece.height, 0, numStates-1));
  var reward = Math.abs(Math.pow(Math.abs(deltaTop - deltaBottom), rewardExponent)) * -1;
  myGamePiece.reward = reward;
  return {deltaTop, deltaBottom};
}

// ================================================================ //
// =====================  MAIN RL TRAINING ======================== //
// ================================================================ //

async function main() {
  let eps = 0.02;
  let initial_lr = 1.0;
  let min_lr = 0.0001;

  for (let i = 0; i < episodes; i++) {
    if (TERMINATE) break;
    myGamePiece.totalReward = 0;
    myGamePiece.episode = i;
    let eta = Math.max(min_lr, initial_lr * (Math.pow(0.85, Math.floor(i))));

    for (let j = 0; j < iterations; j++) {
      if (TERMINATE) break;

      myGamePiece.iteration = j;
      if (speed == 4) {
        await sleep(1);
      }
      if (speed == 2) {
        await sleep(0.000001);
      }
      if (speed == 1) {
        await sleep(20);
      }
      if (speed == 0) {
        await sleep(200);
      }

      let stateMap = toState(myGamePiece.deltaTopBar, myGamePiece.deltaBottomBar);
      let a = stateMap.deltaTop;
      let b = stateMap.deltaBottom;

      if (Math.random() < epsilon) {
        myGamePiece.action = Math.floor(Math.random() * 2);
      } else {
        myGamePiece.action = q_table[a][b].indexOf(Math.max(...q_table[a][b]));
      }
      updateGameArea();
      myGamePiece.totalReward += (Math.pow(gamma, j)) * myGamePiece.reward;
      let stateMap_n = toState(myGamePiece.deltaTopBar, myGamePiece.deltaBottomBar);
      let a_n = stateMap_n.deltaTop;
      let b_n = stateMap_n.deltaBottom;
      q_table[a][b][myGamePiece.action] = (1 - eta) * q_table[a][b][myGamePiece.action] + (eta * (myGamePiece.reward + (gamma * Math.max(...q_table[a_n][b_n]))));
      // let next = myGamePiece.reward + gamma * Math.max(...q_table[a_n][b_n]);
      // let current = q_table[a][b][myGamePiece.action]
      // q_table[a][b][myGamePiece.action] = current + eta * (next - current);

    }
    console.log(`Iteration ${i+1} -- Total reward = ${myGamePiece.totalReward} ${eta}`);
    if (speed == 3) {
      await sleep(0.0001);
    }
    if (speed == 4) {
      await sleep(2);
    }
  }
  console.log(`${myGamePiece.totalReward} ${myGamePiece.maxScore}`);
  myGameArea.reset();
  return;
}

// ================================================================ //
// =====================   Run Policy      ======================== //
// ================================================================ //

async function runPolicy() {
  // get failiure rate by running policy x times until dead or solething like that
  while (!myGamePiece.done) {
    if (TERMINATE) break;
    console.log("running");

    let stateMap = toState(myGamePiece.deltaTopBar, myGamePiece.deltaBottomBar);
    let a = stateMap.deltaTop;
    let b = stateMap.deltaBottom;

    myGamePiece.action = q_table[a][b].indexOf(Math.max(...q_table[a][b]));
    // myGamePiece.action = q_table[a][b];
    console.log(`d top: ${myGamePiece.deltaTopBar}, d bottom: ${myGamePiece.deltaBottomBar}`);
    console.log(`d top: ${a}, d bottom: ${b} ${q_table[a][b]}`);

    // myGamePiece.action = Math.floor(Math.random() * 2);
    console.log(myGamePiece.action);
    updateGameArea();
    await sleep(20);
  }
}


document.body.onkeyup = function(e) {
  if (e.keyCode == 32) {
    console.log("hjghj");
    moveup();
    // myGamePiece.action = 1;
    // setGamePieceSpeed();
  }
  if (e.keyCode == 13) {
    paused = !paused;
    // slow = !slow;
  }
}

// ================================================================ //
// =====================   Update Game     ======================== //
// ================================================================ //

function updateGameArea() {
  if (paused) return;
  for (let i = 0; i < myObstacles.length; i++) {
    if (myGamePiece.crashWith(myObstacles[i])) {
      if (humanMode) {
        resetButtonLabels();
        clearTimeout(myGamePiece.interval);
        return;
      }
      myGamePiece.done = true;
      myGameArea.reset();
      return -1;
    }
  }
  // myGamePiece.done = false;
  myGameArea.clear();
  myGameArea.frameNo += 1;
  if (myGameArea.frameNo == 1 || everyinterval(myGamePiece.intervalVal)) {
    let x = myGameArea.canvas.width;
    let y = myGameArea.canvas.height;
    let height = Math.floor(Math.random() * (myGamePiece.maxHeight - myGamePiece.minHeight + 1) + myGamePiece.minHeight);
    // let bars = [115, 50, 80];
    // height = bars[Math.floor(Math.random() * 3)];
    myObstacles.push(new Component("tbar", 40, height, "images/tp.png", x, 0, "image"));
    myObstacles.push(new Component("bbar", 40, y - height - myGamePiece.gapHeight, "images/bp.png", x, height + myGamePiece.gapHeight, "image"));
  }


  // if (playMode !== "human") {
  //   if (jumpMode == false) {
  //     if (myGamePiece.action == 1) {
  //       moveUp();
  //     }
  //     else {
  //       moveDown();
  //     }
  //   } else {
  //     if (myGamePiece.action == 1) {
  //       moveup();
  //     }
  //     setGamePieceSpeed();
  //   }
  // } else {
  //   setGamePieceSpeed();
  // }

  if (jumpMode == false) {
    if (myGamePiece.action == 1) {
      moveUp();
    }
    else {
      moveDown();
    }
  } else {
    if (myGamePiece.action == 1) {
      moveup();
    }

    // myGamePiece.action = 0;
  }
  setGamePieceSpeed();



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
      deadObstacles.push(new Component("tbar", 40, myObstacles[i].height, "images/tp.png", myObstacles[i].x, myObstacles[i].y, "image"));
      deadObstacles.push(new Component("bbar", 40, myObstacles[i+1].height, "images/bp.png", myObstacles[i].x, myObstacles[i+1].y, "image"));
      myObstacles.splice(0, 2); // remove from obs array not passed
      // get next values in queue
      myGamePiece.obstacleTopHeight = myObstacles[i].height;
      myGamePiece.obstacleBottomHeight = myObstacles[i+1].height;
      myGamePiece.deltaTopBar = myGamePiece.distToCeil - myGamePiece.obstacleTopHeight;
      myGamePiece.deltaBottomBar = myGamePiece.distToFloor - myGamePiece.obstacleBottomHeight;
      myGamePiece.env_y_obs_min = myGamePiece.obstacleTopHeight;
      myGamePiece.env_y_obs_max = myGamePiece.env_y_max - myGamePiece.obstacleBottomHeight;
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

  // setGamePieceSpeed();
  myScore.text = "SCORE: " + myGamePiece.score;
  roundsPlayed.text = "ROUND: " + myGamePiece.round;
  maxScore.text = "MAX SCORE: " + myGamePiece.maxScore;
  iteration.text = "ITERATION: " + myGamePiece.iteration;
  iteration.update();
  episode.text = "EPISODE: " + myGamePiece.episode;
  episode.update();
  myScore.update();
  maxScore.update();
  roundsPlayed.update();
  myGamePiece.newPos();
  myGamePiece.update();
  console.log("end");
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

  if (myGamePiece.speedY < myGamePiece.gravitySpeed && !humanMode) return;
  myGamePiece.speedY -= 4 * myGamePiece.jumpMultiplier;
  myGamePiece.newPos();
}

function moveUp() {
  myGamePiece.speedY = -1 * speedUp;
  myGamePiece.newPos();
}
function moveDown() {
  myGamePiece.speedY = speedDown;
  myGamePiece.newPos();
}
