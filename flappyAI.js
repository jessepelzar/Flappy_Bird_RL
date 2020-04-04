class Agent {
  constructor(minPosition, maxPosition) {
    this.steps = 0; // number of jumps
    this.actions = [0, 1];
    this.minPosition = minPosition; //ceiling
    this.maxPosition = maxPosition; //floor
    this.curState = 0;
    this
  }
}

// 3 states:
// reward state:
//    state 0 - gap between bars
// penalty states:
//    state 1 - space between top bar and ceiling
//    state 2 - space between bottom bar and floor

// 2 actions:
//    0: dont jump
//    1: jump

// policy:
// S0 -> S1, A1
// S0 -> S2, A0

// S1 -> S0, A0
// S2 -> S0, A1
