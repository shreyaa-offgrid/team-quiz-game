const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Game state
let gameState = {
  round: 1,
  maxRounds: 5,
  leftTeam: {
    name: 'Left Team',
    members: [],
    score: 0,
    currentQuestion: '',
    currentAsker: null
  },
  rightTeam: {
    name: 'Right Team',
    members: [],
    score: 0,
    currentQuestion: '',
    currentAsker: null
  },
  gamePhase: 'lobby', // lobby, left-asks, right-answers, grading, right-asks, left-answers
  answerSubmitted: false,
  currentAnswer: '',
  gradingScore: 0
};

// API Routes

// Get current game state
app.get('/api/state', (req, res) => {
  res.json(gameState);
});

// Join team
app.post('/api/join', (req, res) => {
  const { name, team } = req.body;

  if (team === 'left') {
    gameState.leftTeam.members.push(name);
  } else if (team === 'right') {
    gameState.rightTeam.members.push(name);
  }

  res.json({ success: true, message: `${name} joined ${team} team` });
});

// Start game
app.post('/api/start-game', (req, res) => {
  gameState.round = 1;
  gameState.leftTeam.score = 0;
  gameState.rightTeam.score = 0;
  gameState.gamePhase = 'left-asks';
  gameState.leftTeam.currentQuestion = '';
  gameState.rightTeam.currentQuestion = '';
  gameState.answerSubmitted = false;
  gameState.currentAnswer = '';

  res.json({ success: true, phase: gameState.gamePhase });
});

// Submit question
app.post('/api/submit-question', (req, res) => {
  const { question } = req.body;

  if (gameState.gamePhase === 'left-asks') {
    gameState.leftTeam.currentQuestion = question;
    gameState.gamePhase = 'right-answers';
    gameState.answerSubmitted = false;
    gameState.currentAnswer = '';
  } else if (gameState.gamePhase === 'right-asks') {
    gameState.rightTeam.currentQuestion = question;
    gameState.gamePhase = 'left-answers';
    gameState.answerSubmitted = false;
    gameState.currentAnswer = '';
  }

  res.json({ success: true, phase: gameState.gamePhase });
});

// Submit answer
app.post('/api/submit-answer', (req, res) => {
  const { answer } = req.body;
  gameState.currentAnswer = answer;
  gameState.answerSubmitted = true;
  gameState.gamePhase += '-grading';

  res.json({ success: true });
});

// Submit grade
app.post('/api/submit-grade', (req, res) => {
  const { score } = req.body;

  if (gameState.gamePhase === 'right-answers-grading') {
    gameState.rightTeam.score += score;
    gameState.gamePhase = 'right-asks';
    gameState.round++;
  } else if (gameState.gamePhase === 'left-answers-grading') {
    gameState.leftTeam.score += score;
    gameState.gamePhase = 'right-asks';
    gameState.round++;
  }

  // Check if game is over
  if (gameState.round > gameState.maxRounds) {
    gameState.gamePhase = 'finished';
  }

  gameState.leftTeam.currentQuestion = '';
  gameState.rightTeam.currentQuestion = '';
  gameState.answerSubmitted = false;
  gameState.currentAnswer = '';

  res.json({ success: true });
});

// Reset game
app.post('/api/reset', (req, res) => {
  gameState = {
    round: 1,
    maxRounds: 5,
    leftTeam: {
      name: 'Left Team',
      members: [],
      score: 0,
      currentQuestion: '',
      currentAsker: null
    },
    rightTeam: {
      name: 'Right Team',
      members: [],
      score: 0,
      currentQuestion: '',
      currentAsker: null
    },
    gamePhase: 'lobby',
    answerSubmitted: false,
    currentAnswer: '',
    gradingScore: 0
  };

  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Team Quiz Game running on port ${PORT}`);
});
