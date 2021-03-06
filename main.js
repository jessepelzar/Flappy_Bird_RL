var myGamePiece;
var myObstacles = [];
var deadObstacles = [];
var myScore;
var maxScore;
var scorePercent;
var roundsPlayed;
var episode;
var iteration;
var paused = false;
var slow = false;
var numStates;
var rewardExponent;
var episodes;
var iterations;
var gamma;
var alpha = 0.05;
var epsilon;
var speedLearning = 1;
var speedRunning = 1;
var speedUp = 5;
var speedDown = 5;
var maxRounds = 50;
var jumpMode = true;
var humanMode = false;
var TERMINATE = false;
var sleep;
var timeoutId;
var q_table = Array(numStates).fill().map( () => Array(numStates).fill().map( () => Array(2).fill(0)));



function resetInputs() {
  numStates = 5;
  episodes = 10;
  iterations = 1000;
  gamma = 0.5;
  epsilon = 0.1;
  rewardExponent = 5;
  maxRounds = 50;
  // document.getElementById("number-rounds").value = maxRounds;
  document.getElementById("number-states").value = numStates;
  document.getElementById("number-episodes").value = episodes;
  document.getElementById("number-iterations").value = iterations;
  document.getElementById("number-gamma").value = gamma;
  document.getElementById("number-epsilon").value = epsilon;
  document.getElementById("number-reward-exponent").value = rewardExponent;
  document.getElementById("jump-value").value = speedUp;
  document.getElementById("fall-value").value = speedDown;
  resetQtable()
}

function scanInputs() {
  // maxRounds = parseInt(document.getElementById("number-rounds").value);
  numStates = parseInt(document.getElementById("number-states").value);
  episodes = document.getElementById("number-episodes").value;
  iterations = document.getElementById("number-iterations").value;
  gamma = document.getElementById("number-gamma").value;
  epsilon = document.getElementById("number-epsilon").value;
  rewardExponent = document.getElementById("number-reward-exponent").value;
  speedLearning = parseInt(document.getElementById('run-learning-speeds').value);
  speedRunning = parseInt(document.getElementById('run-policy-speeds').value);
  speedUp = parseInt(document.getElementById('jump-value').value);
  speedDown = parseInt(document.getElementById('fall-value').value);
  if ( parseInt(document.getElementById('jump-modes').value) == 0) {
    jumpMode = true;
    document.getElementById("linear-jump-values").style.display = "none";
  } else {
    jumpMode = false;
    document.getElementById("linear-jump-values").style.display = "block";
  }
}




function resetButtonLabels() {
  document.getElementById('play-mode').innerHTML = 'Play Game';
  document.getElementById('learning-mode').innerHTML = 'Run Learning';
  document.getElementById('running-mode').innerHTML = 'Run Policy';
}

function resetQtable() {
  q_table = Array(numStates).fill().map( () => Array(numStates).fill().map( () => Array(2).fill(0)));
}

class RanGen {
  constructor() {
    this.m_w = 123456789;
    this.m_z = 987654321;
    this.mask = 0xffffffff;
  }
  // Takes any integer
  seed(i) {
      this.m_w = (123456789 + i) & this.mask;
      this.m_z = (987654321 - i) & this.mask;
  }
  // Returns number between 0 (inclusive) and 1.0 (exclusive),
  // just like Math.random().
  random() {
      this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
      this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
      var result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0;
      result /= 4294967296;
      return result;
  }
}

var key = new RanGen();
key.seed(100);

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
    this.maxHeight = 125;
    this.gapHeight = 135;
    this.minHeight = this.env_y_max - this.maxHeight - this.gapHeight;
    this.intervalVal = 100;
    this.interval = 0;

    this.distToCeil = 0;
    this.distToFloor = 0;
    this.deltaTopBar = 0;
    this.deltaBottomBar = 0;
    this.obstacleTopHeight = 0;
    this.obstacleBottomHeight = 0;
    this.gravity = 0;
    this.gravitySpeed = 4.0;
    this.score = 0;
    this.round = 0;
    this.maxScore = 0;
    this.totalScoreWins = 0;
    this.totalScorePercent = 0;

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


function assignGameComponents() {
  myGamePiece = new Component("agent", 40, 30, "images/bird.png", 100, 120, "image");
  myScore = new Component("text", "15px", "Roboto", "white", 280, 40, "text");
  roundsPlayed = new Component("text", "15px", "Roboto", "white", 280, 70, "text");
  episode = new Component("text", "15px", "Roboto", "white", 280, 100, "text");
  iteration = new Component("text", "15px", "Roboto", "white", 280, 130, "text");
  maxScore = new Component("text", "10px", "Roboto", "white", 280, 160, "text");
  scorePercent = new Component("text", "10px", "Roboto", "white", 280, 190, "text");
}


function startGame(mode) {

  // edge cases
  sleep = new Sleep()
  if (humanMode && mode !== 2) {
     clearTimeout(myGamePiece.interval);
  }
  switch (mode) {
    case 0:
        if (document.getElementById('learning-mode').innerHTML == 'Stop') {
          TERMINATE = true;
          document.getElementById('learning-mode').innerHTML = 'Run Learning';
          myGameArea.reset();
          myGameArea.preload();
          sleep.stop();
          // return;
        } else {
          sleep.stop();
          TERMINATE = false;
          assignGameComponents();
          resetButtonLabels();
          scanInputs();
          resetQtable();
          console.log(`epsilon: ${epsilon}`);
          document.getElementById('learning-mode').innerHTML = 'Stop';
          document.getElementById('running-mode').innerHTML = 'Run Policy';
          myGameArea.reset();
          myGameArea.start();
          humanMode = false;
          main();
        }
    break;
    case 1:
        if (document.getElementById('running-mode').innerHTML == 'Stop') {
          TERMINATE = true;
          document.getElementById('running-mode').innerHTML = 'Run Policy';
          myGameArea.reset();
          // myGameArea.preload();
          sleep.stop();
          // return;
        } else {
          sleep.stop();
          TERMINATE = false;
          assignGameComponents();
          resetButtonLabels();
          scanInputs();
          console.log(`epsilon: ${epsilon}`);
          document.getElementById('running-mode').innerHTML = 'Stop';
          document.getElementById('learning-mode').innerHTML = 'Run Learning';
          myGameArea.reset();
          myGameArea.start();
          humanMode = false;
          runPolicy();

        }
    break;
    case 2:
        if (document.getElementById('play-mode').innerHTML == 'Jump') {
          standardJumpAction();
          return;
        } else {
          sleep.stop();
          assignGameComponents();
          resetButtonLabels();
          myGameArea.reset();
          myGameArea.start();
          humanMode = true;
          myGamePiece.interval = setInterval(updateGameArea, 20);
        }
        TERMINATE = true;
    break;
  }
}

function preloadEnv() {
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


function Sleep() {
  this.pause = (ms) => {
    return new Promise(resolve => timeoutId = setTimeout(resolve, ms));
  }
  this.stop = () => {
    clearTimeout(timeoutId);
  }
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
  console.log("main");
  let eps = 0.02;
  let initial_lr = 1.0;
  let min_lr = 0.001;
  console.log(numStates)
  for (let i = 0; i < episodes; i++) {
    if (TERMINATE) return;
    myGamePiece.totalReward = 0;
    myGamePiece.episode = i+1;
    let eta = Math.max(min_lr, initial_lr * (Math.pow(0.85, Math.floor(i))));
    console.log(eta);
    for (let j = 0; j < iterations; j++) {
      if (TERMINATE) return;
      myGamePiece.iteration = j+1;

      switch (speedLearning) {
        case 0: await sleep.pause(200); break;
        case 1: await sleep.pause(20); break;
        case 2: await sleep.pause(0.0001); break;
      }

      let stateMap = toState(myGamePiece.deltaTopBar, myGamePiece.deltaBottomBar);
      let a = stateMap.deltaTop;
      let b = stateMap.deltaBottom;

      if (key.random() < epsilon) {
        myGamePiece.action = Math.floor(key.random() * 2);
      } else {
        myGamePiece.action = q_table[a][b].indexOf(Math.max(...q_table[a][b]));
      }
      updateGameArea();
      myGamePiece.totalReward += (Math.pow(gamma, j)) * myGamePiece.reward;
      let stateMap_n = toState(myGamePiece.deltaTopBar, myGamePiece.deltaBottomBar);
      let a_n = stateMap_n.deltaTop;
      let b_n = stateMap_n.deltaBottom;
      q_table[a][b][myGamePiece.action] = (1 - eta) * q_table[a][b][myGamePiece.action] + (eta * (myGamePiece.reward + (gamma * Math.max(...q_table[a_n][b_n]))));
    }
    console.log(`Iteration ${i+1} -- Total reward = ${myGamePiece.totalReward} ${eta}`);
    if (speedLearning == 3) {
      await sleep.pause(0.0001);
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
    if (TERMINATE) return;
    updateGameArea();
    let stateMap = toState(myGamePiece.deltaTopBar, myGamePiece.deltaBottomBar);
    let a = stateMap.deltaTop;
    let b = stateMap.deltaBottom;

    myGamePiece.action = q_table[a][b].indexOf(Math.max(...q_table[a][b]));


    switch (speedRunning) {
      case 0: await sleep.pause(200); break;
      case 1: await sleep.pause(20); break;
      case 2: await sleep.pause(0.0001); break;
    }
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
        humanMode = false;
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
    let height = Math.floor(key.random() * (myGamePiece.maxHeight - myGamePiece.minHeight + 1) + myGamePiece.minHeight);
    myObstacles.push(new Component("tbar", 40, height, "images/tp.png", x, 0, "image"));
    myObstacles.push(new Component("bbar", 40, y - height - myGamePiece.gapHeight, "images/bp.png", x, height + myGamePiece.gapHeight, "image"));
  }

  if (jumpMode == false) {
    if (myGamePiece.action == 1) {
      linearJumpActionUp();
    }
    else {
      linearJumpActionDown();
    }
  } else {
    if (myGamePiece.action == 1) {
      standardJumpAction();
    }
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
      myGamePiece.totalScoreWins++;
      myGamePiece.totalScorePercent = (myGamePiece.totalScoreWins / (myGamePiece.totalScoreWins + myGamePiece.round)) * 100;
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
  scorePercent.text = "%: " + myGamePiece.totalScorePercent;
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
  scorePercent.update();
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

function standardJumpAction() {

  if (myGamePiece.speedY < myGamePiece.gravitySpeed && !humanMode) return;
  myGamePiece.speedY -= 4 * myGamePiece.jumpMultiplier;
  myGamePiece.newPos();
}

function linearJumpActionUp() {
  myGamePiece.speedY = -1 * speedUp;
  myGamePiece.newPos();
}
function linearJumpActionDown() {
  myGamePiece.speedY = speedDown;
  myGamePiece.newPos();
}
