/**
 * ============================================================================
 * GUESS THE NUMBER - CYBER PC BATTLE
 * Logic, State Management, Web Audio Synthesizer, Confetti & Interactive UI
 * ============================================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Sound Synthesizer (Web Audio API - 100% Offline & Reliable)
     -------------------------------------------------------------------------- */
  class CyberSoundSystem {
    constructor() {
      this.ctx = null;
      this.isMuted = localStorage.getItem('gtn_sound_muted') === 'true';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem('gtn_sound_muted', this.isMuted);
      return !this.isMuted;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15, rampFreq = null) {
      if (this.isMuted) return;
      try {
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (rampFreq) {
          osc.frequency.exponentialRampToValueAtTime(rampFreq, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio play failed:', e);
      }
    }

    playClick() {
      this.playTone(850, 'triangle', 0.04, 0.08);
    }

    playLow() {
      // Ascending double tone indicating user should go UP
      if (this.isMuted) return;
      this.playTone(280, 'sine', 0.12, 0.15, 380);
      setTimeout(() => {
        this.playTone(380, 'sine', 0.18, 0.18, 520);
      }, 110);
    }

    playHigh() {
      // Descending double tone indicating user should go DOWN
      if (this.isMuted) return;
      this.playTone(560, 'sine', 0.12, 0.15, 420);
      setTimeout(() => {
        this.playTone(420, 'sine', 0.18, 0.18, 290);
      }, 110);
    }

    playError() {
      // Dissonant low buzz for invalid inputs
      if (this.isMuted) return;
      this.playTone(160, 'sawtooth', 0.22, 0.2, 110);
    }

    playStart() {
      // Futuristic game start whoosh
      if (this.isMuted) return;
      this.playTone(200, 'sine', 0.35, 0.12, 680);
    }

    playWin() {
      // Triumphant cyber victory fanfare
      if (this.isMuted) return;
      const notes = [
        { f: 523.25, d: 0.14, t: 0 },    // C5
        { f: 659.25, d: 0.14, t: 130 },  // E5
        { f: 783.99, d: 0.16, t: 260 },  // G5
        { f: 1046.50, d: 0.45, t: 400 }, // C6
        { f: 1318.51, d: 0.65, t: 550 }  // E6
      ];

      notes.forEach(n => {
        setTimeout(() => {
          this.playTone(n.f, 'triangle', n.d, 0.22);
        }, n.t);
      });
    }
  }

  /* --------------------------------------------------------------------------
     2. Confetti Particle System (HTML5 Canvas)
     -------------------------------------------------------------------------- */
  class ConfettiManager {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.animId = null;
      this.colors = ['#00f3ff', '#bc13fe', '#00ff9d', '#ff007f', '#ffd700', '#ffffff'];

      this.resize = this.resize.bind(this);
      window.addEventListener('resize', this.resize);
      this.resize();
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    fire() {
      if (!this.canvas || !this.ctx) return;
      this.particles = [];
      const count = Math.min(140, Math.floor(window.innerWidth / 10));

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: window.innerWidth * 0.5 + (Math.random() * 200 - 100),
          y: window.innerHeight * 0.5 + (Math.random() * 100 - 50),
          vx: (Math.random() - 0.5) * 22,
          vy: (Math.random() - 0.7) * 22 - 6,
          size: Math.random() * 8 + 5,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          decay: Math.random() * 0.008 + 0.005,
          gravity: 0.4
        });
      }

      if (!this.animId) {
        this.loop();
      }
    }

    loop() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        if (p.opacity > 0) {
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.globalAlpha = Math.max(0, p.opacity);
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          this.ctx.restore();
        }
      }

      this.particles = this.particles.filter(p => p.opacity > 0 && p.y < this.canvas.height + 20);

      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(this.loop.bind(this));
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.animId = null;
      }
    }

    stop() {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.particles = [];
    }
  }

  /* --------------------------------------------------------------------------
     3. Game State & Logic Controller
     -------------------------------------------------------------------------- */
  class GuessTheNumberGame {
    constructor() {
      // Sound & FX
      this.sound = new CyberSoundSystem();
      this.confetti = new ConfettiManager('confettiCanvas');

      // Round Core State
      this.minRange = 1;
      this.maxRange = 100;
      this.secretNumber = null;
      this.attempts = 0;
      this.currentRoundGuesses = []; // list of { guess, result: 'high' | 'low' }
      this.knownMin = 1;
      this.knownMax = 100;
      this.difficulty = 'Medium';
      this.roundStartTime = null;
      this.isGameOver = false;

      // Persistence
      this.roundNumber = 1;
      this.bestScore = this.loadBestScore();
      this.gameHistory = this.loadHistory();

      // DOM Elements Cache
      this.cacheDOMElements();

      // Taunts and PC Speech Lines
      this.initBotDialogues();

      // Event Listeners
      this.bindEvents();

      // Initialize Sound Icon UI
      this.updateSoundIcon();

      // Update Header Stats
      this.updateHeaderStats();

      // Start First Game
      this.startNewRound();
    }

    cacheDOMElements() {
      // Header
      this.bestScoreVal = document.getElementById('bestScoreValue');
      this.soundToggleBtn = document.getElementById('soundToggleBtn');
      this.soundIconOn = document.getElementById('soundIconOn');
      this.soundIconOff = document.getElementById('soundIconOff');
      this.historyToggleBtn = document.getElementById('historyToggleBtn');
      this.historyBadge = document.getElementById('historyBadge');
      this.helpToggleBtn = document.getElementById('helpToggleBtn');

      // PC Opponent
      this.botScreen = document.getElementById('botScreen');
      this.pcStatusText = document.getElementById('pcStatusText');
      this.pcDialogText = document.getElementById('pcDialogText');
      this.statusOrb = document.getElementById('statusOrb');

      // Range Display & Tracker
      this.rangeMinEl = document.getElementById('rangeMin');
      this.rangeMaxEl = document.getElementById('rangeMax');
      this.difficultyTag = document.getElementById('difficultyTag');
      this.diffIcon = document.getElementById('diffIcon');
      this.diffName = document.getElementById('diffName');
      this.narrowedBoundsText = document.getElementById('narrowedBoundsText');
      this.boundsFill = document.getElementById('boundsFill');
      this.pinLow = document.getElementById('pinLow');
      this.pinHigh = document.getElementById('pinHigh');
      this.possibleCountText = document.getElementById('possibleCountText');

      // Feedback Area
      this.feedbackCard = document.getElementById('feedbackCard');
      this.feedbackEmoji = document.getElementById('feedbackEmoji');
      this.feedbackTitle = document.getElementById('feedbackTitle');
      this.feedbackDesc = document.getElementById('feedbackDesc');
      this.hintMin = document.getElementById('hintMin');
      this.hintMax = document.getElementById('hintMax');

      // Form & Controls
      this.guessForm = document.getElementById('guessForm');
      this.guessInput = document.getElementById('guessInput');
      this.guessBtn = document.getElementById('guessBtn');
      this.btnMinus10 = document.getElementById('btnMinus10');
      this.btnMinus1 = document.getElementById('btnMinus1');
      this.btnPlus1 = document.getElementById('btnPlus1');
      this.btnPlus10 = document.getElementById('btnPlus10');
      this.attemptsCount = document.getElementById('attemptsCount');
      this.restartBtn = document.getElementById('restartBtn');

      // Round Guesses Tray
      this.guessesChipsList = document.getElementById('guessesChipsList');
      this.emptyTrayHint = document.getElementById('emptyTrayHint');

      // Victory Modal
      this.victoryModal = document.getElementById('victoryModal');
      this.revealedSecretNum = document.getElementById('revealedSecretNum');
      this.vicAttempts = document.getElementById('vicAttempts');
      this.vicRank = document.getElementById('vicRank');
      this.vicDifficulty = document.getElementById('vicDifficulty');
      this.vicTime = document.getElementById('vicTime');
      this.vicNextRoundBtn = document.getElementById('vicNextRoundBtn');
      this.vicShareBtn = document.getElementById('vicShareBtn');
      this.copyBtnText = document.getElementById('copyBtnText');

      // History Modal
      this.historyModal = document.getElementById('historyModal');
      this.closeHistoryBtn = document.getElementById('closeHistoryBtn');
      this.dismissHistoryBtn = document.getElementById('dismissHistoryBtn');
      this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
      this.historyList = document.getElementById('historyList');
      this.histTotalRounds = document.getElementById('histTotalRounds');
      this.histBestRecord = document.getElementById('histBestRecord');
      this.histAvgAttempts = document.getElementById('histAvgAttempts');

      // Rules Modal
      this.rulesModal = document.getElementById('rulesModal');
      this.closeRulesBtn = document.getElementById('closeRulesBtn');
      this.gotItRulesBtn = document.getElementById('gotItRulesBtn');

      // Toast
      this.toastContainer = document.getElementById('toastContainer');
    }

    initBotDialogues() {
      this.dialogues = {
        start: [
          '"I have chosen a secret number inside the range. You will never crack my algorithm!"',
          '"Calculating encrypted numeric sequence... Can your human intuition solve this?"',
          '"Round initiated! Let us see how many attempts you will waste today."',
          '"My CPU generated a formidable number. Proceed at your own risk!"'
        ],
        tooHigh: [
          '"Way too high! Did your sensors malfunction? هبط شوية 🔽"',
          '"Overshot the target! You need to lower your frequency. هبط شوية 🔽"',
          '"Ha! My secret number is nowhere near that high. هبط شوية 🔽"',
          '"Too high, human! Your logic needs recalibration. هبط شوية 🔽"'
        ],
        tooLow: [
          '"Too low! Aim higher if you want to challenge me! طلع شوية 🔼"',
          '"Undershot! Come on, give me a real challenge! طلع شوية 🔼"',
          '"Not even close, that is too small! طلع شوية 🔼"',
          '"Aim for the stars, human! You are way too low. طلع شوية 🔼"'
        ],
        invalid: [
          '"Invalid input! Are you trying to hack my firewall with illegal characters?"',
          '"That number is outside the defined boundaries! Read the instructions, human!"',
          '"Error 404: Logic not found. Enter a number within the range!"'
        ],
        repeated: [
          '"You already tried that number earlier! Running out of RAM?"',
          '"Memory buffer error? You guessed that exact number already!"'
        ],
        win: [
          '"CRITICAL FAILURE! HOW DID YOU CRACK MY ENCRYPTION?! 🏆"',
          '"SYSTEM OVERLOAD! Impossible! You actually defeated me! 🏆"',
          '"ACCESS GRANTED! You have outsmarted the PC! 🏆"'
        ]
      };
    }

    bindEvents() {
      // Guess Submission
      this.guessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleGuess();
      });

      // Quick Adjustment Buttons
      this.btnMinus10.addEventListener('click', () => this.adjustInput(-10));
      this.btnMinus1.addEventListener('click', () => this.adjustInput(-1));
      this.btnPlus1.addEventListener('click', () => this.adjustInput(1));
      this.btnPlus10.addEventListener('click', () => this.adjustInput(10));

      // Restart Button
      this.restartBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.startNewRound(true);
      });

      // Victory Modal Actions
      this.vicNextRoundBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.closeModal(this.victoryModal);
        this.startNewRound();
      });

      this.vicShareBtn.addEventListener('click', () => {
        this.handleCopyResult();
      });

      // Sound Toggle
      this.soundToggleBtn.addEventListener('click', () => {
        const isSoundOn = this.sound.toggleMute();
        this.updateSoundIcon();
        if (isSoundOn) {
          this.sound.playClick();
          this.showToast('Sound enabled 🔊', 'info');
        } else {
          this.showToast('Sound muted 🔇', 'info');
        }
      });

      // History Modal Triggers
      this.historyToggleBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.renderHistoryModal();
        this.openModal(this.historyModal);
      });

      this.closeHistoryBtn.addEventListener('click', () => this.closeModal(this.historyModal));
      this.dismissHistoryBtn.addEventListener('click', () => this.closeModal(this.historyModal));
      this.clearHistoryBtn.addEventListener('click', () => this.handleClearHistory());

      // Rules Modal Triggers
      this.helpToggleBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.openModal(this.rulesModal);
      });

      this.closeRulesBtn.addEventListener('click', () => this.closeModal(this.rulesModal));
      this.gotItRulesBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.closeModal(this.rulesModal);
      });

      // Close modals on overlay backdrop click
      [this.victoryModal, this.historyModal, this.rulesModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal(modal);
          }
        });
      });

      // Global Keyboard Shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (!this.victoryModal.classList.contains('hidden')) {
            this.closeModal(this.victoryModal);
          } else if (!this.historyModal.classList.contains('hidden')) {
            this.closeModal(this.historyModal);
          } else if (!this.rulesModal.classList.contains('hidden')) {
            this.closeModal(this.rulesModal);
          }
        }
      });
    }

    /* --------------------------------------------------------------------------
       4. Random Range Generator (Core PC Opponent System)
       -------------------------------------------------------------------------- */
    generateRandomRange() {
      /**
       * The PC randomly chooses a minimum and maximum number.
       * Range must change randomly every new round.
       * Secret number must always be inside selected range.
       * Range tiers can produce diverse, exciting matchups:
       * - Easy: span ~ 60 - 150
       * - Medium: span ~ 180 - 400
       * - Hard: span ~ 450 - 900
       * - Extreme: span ~ 950 - 2000
       */
      const tierChance = Math.random();
      let min = 1;
      let span = 100;
      let diff = 'Medium';

      if (tierChance < 0.25) {
        // Easy Tier
        const minChoices = [1, 5, 10, 20, 25, 50];
        min = minChoices[Math.floor(Math.random() * minChoices.length)];
        span = Math.floor(Math.random() * 90) + 60; // 60 to 150
        diff = 'Easy';
      } else if (tierChance < 0.65) {
        // Medium Tier
        const minChoices = [1, 10, 20, 30, 45, 50, 75, 100];
        min = minChoices[Math.floor(Math.random() * minChoices.length)];
        span = Math.floor(Math.random() * 220) + 180; // 180 to 400
        diff = 'Medium';
      } else if (tierChance < 0.88) {
        // Hard Tier
        const minChoices = [1, 25, 50, 80, 100, 150, 200];
        min = minChoices[Math.floor(Math.random() * minChoices.length)];
        span = Math.floor(Math.random() * 450) + 450; // 450 to 900
        diff = 'Hard';
      } else {
        // Extreme / Nightmare Tier
        const minChoices = [1, 50, 100, 150, 200, 300];
        min = minChoices[Math.floor(Math.random() * minChoices.length)];
        span = Math.floor(Math.random() * 900) + 950; // 950 to 1850
        diff = 'Extreme';
      }

      const max = min + span;
      return { min, max, diff };
    }

    startNewRound(isManualRestart = false) {
      this.sound.playStart();
      this.confetti.stop();

      // Generate PC Random Range
      const range = this.generateRandomRange();
      this.minRange = range.min;
      this.maxRange = range.max;
      this.difficulty = range.diff;

      // Generate Secret Number (always inside selected range)
      // Math.floor(Math.random() * (max - min + 1)) + min
      this.secretNumber = Math.floor(Math.random() * (this.maxRange - this.minRange + 1)) + this.minRange;

      // Reset State
      this.attempts = 0;
      this.currentRoundGuesses = [];
      this.knownMin = this.minRange;
      this.knownMax = this.maxRange;
      this.roundStartTime = Date.now();
      this.isGameOver = false;

      // Update Input Element Constraints
      this.guessInput.disabled = false;
      this.guessInput.value = '';
      this.guessInput.min = this.minRange;
      this.guessInput.max = this.maxRange;
      this.guessInput.placeholder = `Between ${this.minRange} and ${this.maxRange}`;
      this.guessBtn.disabled = false;
      this.setQuickButtonsDisabled(false);

      // Reset PC Avatar Expression
      this.setBotFace('idle');
      this.pcStatusText.textContent = 'THINKING OF A SECRET NUMBER...';
      const randomStartDialog = this.dialogues.start[Math.floor(Math.random() * this.dialogues.start.length)];
      this.pcDialogText.textContent = randomStartDialog;
      this.statusOrb.style.background = 'var(--neon-cyan)';
      this.statusOrb.style.boxShadow = '0 0 10px var(--neon-cyan)';

      // Update UI Range Numbers
      this.rangeMinEl.textContent = this.minRange;
      this.rangeMaxEl.textContent = this.maxRange;

      // Update Difficulty Badge
      this.updateDifficultyBadge();

      // Reset Feedback Area
      this.resetFeedbackArea();

      // Reset Bounds Visualizer
      this.updateBoundsTracker();

      // Reset Attempts Counter
      this.attemptsCount.textContent = '0';

      // Clear Guesses Tray
      this.renderGuessesChips();

      // Focus Input Field
      setTimeout(() => {
        this.guessInput.focus();
      }, 100);

      if (isManualRestart) {
        this.showToast(`New round generated: [ ${this.minRange} — ${this.maxRange} ]`, 'info');
      }
    }

    updateDifficultyBadge() {
      this.difficultyTag.className = 'difficulty-tag';
      if (this.difficulty === 'Easy') {
        this.difficultyTag.classList.add('diff-easy');
        this.diffIcon.textContent = '🌱';
        this.diffName.textContent = 'EASY';
      } else if (this.difficulty === 'Medium') {
        this.difficultyTag.classList.add('diff-medium');
        this.diffIcon.textContent = '⚡';
        this.diffName.textContent = 'MEDIUM';
      } else if (this.difficulty === 'Hard') {
        this.difficultyTag.classList.add('diff-hard');
        this.diffIcon.textContent = '🔥';
        this.diffName.textContent = 'HARD';
      } else {
        this.difficultyTag.classList.add('diff-extreme');
        this.diffIcon.textContent = '💀';
        this.diffName.textContent = 'EXTREME';
      }
    }

    resetFeedbackArea() {
      this.feedbackCard.className = 'feedback-card';
      this.feedbackEmoji.textContent = '🎯';
      this.feedbackTitle.textContent = 'Make Your First Guess!';
      this.feedbackDesc.innerHTML = `Enter a number between <span id="hintMin">${this.minRange}</span> and <span id="hintMax">${this.maxRange}</span> to test your luck.`;
      this.hintMin = document.getElementById('hintMin');
      this.hintMax = document.getElementById('hintMax');
    }

    /* --------------------------------------------------------------------------
       5. Guess Handling & Game Rules Implementation
       -------------------------------------------------------------------------- */
    handleGuess() {
      if (this.isGameOver) return;

      const rawVal = this.guessInput.value.trim();

      // 1. Validation: Empty input
      if (rawVal === '') {
        this.triggerInputError('Please enter a number before guessing!');
        this.setBotFace('invalid');
        this.pcDialogText.textContent = '"You clicked GUESS without entering any number! Enter a guess!"';
        this.sound.playError();
        return;
      }

      const guessNum = parseInt(rawVal, 10);

      // 2. Validation: Non-integer or NaN
      if (isNaN(guessNum)) {
        this.triggerInputError('Invalid number format!');
        this.setBotFace('invalid');
        this.sound.playError();
        return;
      }

      // 3. Validation: Range bounds
      if (guessNum < this.minRange || guessNum > this.maxRange) {
        this.triggerInputError(`Number out of bounds! Must be between ${this.minRange} and ${this.maxRange}.`);
        this.setBotFace('invalid');
        this.pcDialogText.textContent = `"${guessNum} is outside the range [${this.minRange} — ${this.maxRange}]! Read carefully, human!"`;
        this.sound.playError();
        return;
      }

      // 4. Validation: Already guessed number
      const alreadyGuessed = this.currentRoundGuesses.some(g => g.guess === guessNum);
      if (alreadyGuessed) {
        this.triggerInputError(`You already guessed ${guessNum}! Pick a different number.`);
        this.setBotFace('invalid');
        const repeatedLine = this.dialogues.repeated[Math.floor(Math.random() * this.dialogues.repeated.length)];
        this.pcDialogText.textContent = repeatedLine;
        this.sound.playError();
        return;
      }

      // Valid Guess: Increment attempts counter
      this.attempts++;
      this.attemptsCount.textContent = this.attempts;

      // Check Against PC Secret Number
      if (guessNum > this.secretNumber) {
        this.handleTooHigh(guessNum);
      } else if (guessNum < this.secretNumber) {
        this.handleTooLow(guessNum);
      } else {
        this.handleVictory(guessNum);
      }

      // Keep input focused and selected for convenient subsequent guessing
      this.guessInput.value = '';
      this.guessInput.focus();
    }

    handleTooHigh(guess) {
      // Update known maximum bound
      if (guess - 1 < this.knownMax) {
        this.knownMax = guess - 1;
      }

      // Store in round guesses
      this.currentRoundGuesses.push({ guess, result: 'high' });

      // Visuals & Sound
      this.sound.playHigh();
      this.setBotFace('smug');

      // PC Status & Taunt
      this.pcStatusText.textContent = 'OPPONENT: SMUG & CONFIDENT';
      const highDialog = this.dialogues.tooHigh[Math.floor(Math.random() * this.dialogues.tooHigh.length)];
      this.pcDialogText.textContent = highDialog;
      this.statusOrb.style.background = 'var(--neon-red)';
      this.statusOrb.style.boxShadow = '0 0 10px var(--neon-red)';

      // Feedback Card: EXACT USER SPEC: "Too High! هبط شوية 🔽"
      this.feedbackCard.className = 'feedback-card hint-high';
      this.feedbackEmoji.textContent = '🔽';
      this.feedbackTitle.textContent = 'Too High! هبط شوية 🔽';
      this.feedbackDesc.textContent = `Your guess (${guess}) is higher than the secret number. Try something lower!`;

      // Update Visuals
      this.updateBoundsTracker();
      this.renderGuessesChips();
    }

    handleTooLow(guess) {
      // Update known minimum bound
      if (guess + 1 > this.knownMin) {
        this.knownMin = guess + 1;
      }

      // Store in round guesses
      this.currentRoundGuesses.push({ guess, result: 'low' });

      // Visuals & Sound
      this.sound.playLow();
      this.setBotFace('taunting');

      // PC Status & Taunt
      this.pcStatusText.textContent = 'OPPONENT: TAUNTING YOUR WEAKNESS';
      const lowDialog = this.dialogues.tooLow[Math.floor(Math.random() * this.dialogues.tooLow.length)];
      this.pcDialogText.textContent = lowDialog;
      this.statusOrb.style.background = 'var(--neon-cyan)';
      this.statusOrb.style.boxShadow = '0 0 10px var(--neon-cyan)';

      // Feedback Card: EXACT USER SPEC: "Too Low! طلع شوية 🔼"
      this.feedbackCard.className = 'feedback-card hint-low';
      this.feedbackEmoji.textContent = '🔼';
      this.feedbackTitle.textContent = 'Too Low! طلع شوية 🔼';
      this.feedbackDesc.textContent = `Your guess (${guess}) is lower than the secret number. Try something higher!`;

      // Update Visuals
      this.updateBoundsTracker();
      this.renderGuessesChips();
    }

    handleVictory(guess) {
      this.isGameOver = true;
      this.currentRoundGuesses.push({ guess, result: 'win' });

      // Disable Guess Inputs
      this.guessBtn.disabled = true;
      this.guessInput.disabled = true;
      this.setQuickButtonsDisabled(true);

      // Sound & Confetti
      this.sound.playWin();
      this.confetti.fire();

      // Bot Face Defeated
      this.setBotFace('defeated');
      this.pcStatusText.textContent = 'AI OPPONENT: DEFEATED';
      const winDialog = this.dialogues.win[Math.floor(Math.random() * this.dialogues.win.length)];
      this.pcDialogText.textContent = winDialog;
      this.statusOrb.style.background = 'var(--neon-green)';
      this.statusOrb.style.boxShadow = '0 0 14px var(--neon-green)';

      // Feedback Card: EXACT USER SPEC: "Congratulations! You defeated the PC! 🏆"
      this.feedbackCard.className = 'feedback-card hint-win';
      this.feedbackEmoji.textContent = '🏆';
      this.feedbackTitle.textContent = 'Congratulations! You defeated the PC! 🏆';
      this.feedbackDesc.textContent = `Incredible work! You unlocked the secret code in ${this.attempts} attempt${this.attempts === 1 ? '' : 's'}!`;

      // Update bounds to pin on secret number
      this.knownMin = this.secretNumber;
      this.knownMax = this.secretNumber;
      this.updateBoundsTracker();
      this.renderGuessesChips();

      // Time taken
      const elapsedMs = Date.now() - this.roundStartTime;
      const formattedTime = this.formatTime(elapsedMs);

      // Calculate Rank
      const rank = this.calculateRank(this.attempts, this.maxRange - this.minRange);

      // Check / Update Best Score (fewest attempts)
      if (this.bestScore === null || this.attempts < this.bestScore) {
        this.bestScore = this.attempts;
        this.saveBestScore(this.bestScore);
        this.updateHeaderStats();
        this.showToast(`New Personal Best Record: ${this.attempts} attempts! 🌟`, 'success');
      }

      // Record History
      const roundRecord = {
        round: this.roundNumber++,
        range: `[${this.minRange} — ${this.maxRange}]`,
        secret: this.secretNumber,
        attempts: this.attempts,
        difficulty: this.difficulty,
        time: formattedTime,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      this.saveHistoryRecord(roundRecord);
      this.updateHeaderStats();

      // Trigger Victory Screen Overlay after brief delay for dramatic effect
      setTimeout(() => {
        this.revealedSecretNum.textContent = this.secretNumber;
        this.vicAttempts.textContent = this.attempts;
        this.vicRank.textContent = rank;
        this.vicDifficulty.textContent = this.difficulty;
        this.vicTime.textContent = formattedTime;
        this.copyBtnText.textContent = 'Copy Result';
        this.openModal(this.victoryModal);
      }, 750);
    }

    /* --------------------------------------------------------------------------
       6. Bound Tracking & Visualizer
       -------------------------------------------------------------------------- */
    updateBoundsTracker() {
      const totalSpan = this.maxRange - this.minRange;
      if (totalSpan <= 0) return;

      const lowPct = Math.max(0, Math.min(100, ((this.knownMin - this.minRange) / totalSpan) * 100));
      const highPct = Math.max(0, Math.min(100, ((this.knownMax - this.minRange) / totalSpan) * 100));

      this.boundsFill.style.left = `${lowPct}%`;
      this.boundsFill.style.right = `${100 - highPct}%`;

      this.pinLow.style.left = `${lowPct}%`;
      this.pinLow.textContent = this.knownMin;

      this.pinHigh.style.left = `${highPct}%`;
      this.pinHigh.textContent = this.knownMax;

      this.narrowedBoundsText.textContent = `Range: [ ${this.knownMin} — ${this.knownMax} ]`;

      const remainingCandidates = Math.max(1, this.knownMax - this.knownMin + 1);
      this.possibleCountText.textContent = `${remainingCandidates} possible number${remainingCandidates === 1 ? '' : 's'} remaining`;
    }

    renderGuessesChips() {
      this.guessesChipsList.innerHTML = '';
      if (this.currentRoundGuesses.length === 0) {
        this.emptyTrayHint.style.display = 'block';
        return;
      }

      this.emptyTrayHint.style.display = 'none';
      this.currentRoundGuesses.forEach(item => {
        const chip = document.createElement('div');
        chip.className = `guess-chip chip-${item.result}`;
        if (item.result === 'high') {
          chip.innerHTML = `<span>🔽</span><span>${item.guess} (High)</span>`;
        } else if (item.result === 'low') {
          chip.innerHTML = `<span>🔼</span><span>${item.guess} (Low)</span>`;
        } else {
          chip.innerHTML = `<span>🏆</span><span>${item.guess} (Correct!)</span>`;
        }
        this.guessesChipsList.appendChild(chip);
      });
    }

    /* --------------------------------------------------------------------------
       7. Input Helpers & Quick Adjust
       -------------------------------------------------------------------------- */
    adjustInput(delta) {
      if (this.isGameOver) return;
      this.sound.playClick();

      let currentVal = parseInt(this.guessInput.value, 10);
      if (isNaN(currentVal)) {
        // If empty, start at current known midpoint
        currentVal = Math.floor((this.knownMin + this.knownMax) / 2);
      } else {
        currentVal += delta;
      }

      // Clamp within min and max range
      currentVal = Math.max(this.minRange, Math.min(this.maxRange, currentVal));
      this.guessInput.value = currentVal;
      this.guessInput.focus();
    }

    setQuickButtonsDisabled(state) {
      this.btnMinus10.disabled = state;
      this.btnMinus1.disabled = state;
      this.btnPlus1.disabled = state;
      this.btnPlus10.disabled = state;
    }

    triggerInputError(msg) {
      this.guessInput.classList.remove('input-shake');
      void this.guessInput.offsetWidth; // Force CSS reflow
      this.guessInput.classList.add('input-shake');

      this.showToast(msg, 'error');
    }

    /* --------------------------------------------------------------------------
       8. Bot Face Expressions
       -------------------------------------------------------------------------- */
    setBotFace(expression) {
      this.botScreen.classList.remove('smug', 'taunting', 'defeated');
      if (expression === 'smug') {
        this.botScreen.classList.add('smug');
      } else if (expression === 'taunting') {
        this.botScreen.classList.add('taunting');
      } else if (expression === 'defeated') {
        this.botScreen.classList.add('defeated');
      }
    }

    /* --------------------------------------------------------------------------
       9. Modals & History Management
       -------------------------------------------------------------------------- */
    openModal(modal) {
      modal.classList.remove('hidden');
    }

    closeModal(modal) {
      modal.classList.add('hidden');
    }

    loadBestScore() {
      const saved = localStorage.getItem('gtn_best_score');
      return saved !== null ? parseInt(saved, 10) : null;
    }

    saveBestScore(val) {
      localStorage.setItem('gtn_best_score', val.toString());
    }

    loadHistory() {
      try {
        const raw = localStorage.getItem('gtn_game_history');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    saveHistoryRecord(record) {
      this.gameHistory.unshift(record);
      if (this.gameHistory.length > 30) {
        this.gameHistory.pop(); // Keep last 30 rounds
      }
      localStorage.setItem('gtn_game_history', JSON.stringify(this.gameHistory));
    }

    handleClearHistory() {
      if (this.gameHistory.length === 0) return;
      if (confirm('Are you sure you want to clear all battle records?')) {
        this.gameHistory = [];
        localStorage.removeItem('gtn_game_history');
        this.renderHistoryModal();
        this.updateHeaderStats();
        this.showToast('All battle records cleared.', 'info');
      }
    }

    updateHeaderStats() {
      if (this.bestScore !== null) {
        this.bestScoreVal.textContent = `${this.bestScore} tries`;
      } else {
        this.bestScoreVal.textContent = '--';
      }

      const totalRounds = this.gameHistory.length;
      this.historyBadge.textContent = totalRounds;
    }

    renderHistoryModal() {
      const totalRounds = this.gameHistory.length;
      this.histTotalRounds.textContent = totalRounds;

      if (this.bestScore !== null) {
        this.histBestRecord.textContent = `${this.bestScore} att.`;
      } else {
        this.histBestRecord.textContent = '--';
      }

      if (totalRounds > 0) {
        const sumAttempts = this.gameHistory.reduce((acc, r) => acc + r.attempts, 0);
        const avg = (sumAttempts / totalRounds).toFixed(1);
        this.histAvgAttempts.textContent = `${avg} att.`;
      } else {
        this.histAvgAttempts.textContent = '--';
      }

      this.historyList.innerHTML = '';
      if (totalRounds === 0) {
        this.historyList.innerHTML = '<div class="empty-history-placeholder">No rounds recorded yet. Outsmart the PC to build your history!</div>';
        return;
      }

      this.gameHistory.forEach((r, idx) => {
        const row = document.createElement('div');
        row.className = 'history-item-row';
        row.innerHTML = `
          <div class="hist-left">
            <span class="hist-round-num">Round #${totalRounds - idx} (${r.difficulty})</span>
            <span class="hist-range-meta">Target: ${r.range} • ${r.time}</span>
          </div>
          <div class="hist-right">
            <span class="hist-secret-pill" title="Secret Number">Secret: ${r.secret}</span>
            <span class="hist-attempts-text">${r.attempts} try${r.attempts === 1 ? '' : 's'}</span>
          </div>
        `;
        this.historyList.appendChild(row);
      });
    }

    calculateRank(attempts, rangeSpan) {
      // Optimal binary search theoretically requires ~ log2(rangeSpan) attempts
      const optimal = Math.ceil(Math.log2(rangeSpan || 100));
      if (attempts <= optimal) {
        return 'SSS Rank';
      } else if (attempts <= optimal + 2) {
        return 'S Rank';
      } else if (attempts <= optimal + 5) {
        return 'A Rank';
      } else if (attempts <= optimal + 9) {
        return 'B Rank';
      } else {
        return 'C Rank';
      }
    }

    formatTime(ms) {
      const totalSec = Math.floor(ms / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    handleCopyResult() {
      const shareText = `🎮 Guess The Number: Cyber PC Battle\n🏆 Defeated NEXUS-AI in ${this.attempts} attempts!\n🎯 Target Range: [${this.minRange} — ${this.maxRange}]\n⚡ Rank: ${this.vicRank.textContent}\nCan you beat my score?`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
          this.copyBtnText.textContent = 'Copied! ✅';
          this.showToast('Score copied to clipboard! 📋', 'success');
          setTimeout(() => {
            this.copyBtnText.textContent = 'Copy Result';
          }, 2500);
        }).catch(() => {
          this.fallbackCopy(shareText);
        });
      } else {
        this.fallbackCopy(shareText);
      }
    }

    fallbackCopy(text) {
      const tempArea = document.createElement('textarea');
      tempArea.value = text;
      document.body.appendChild(tempArea);
      tempArea.select();
      try {
        document.execCommand('copy');
        this.copyBtnText.textContent = 'Copied! ✅';
        this.showToast('Score copied to clipboard! 📋', 'success');
        setTimeout(() => {
          this.copyBtnText.textContent = 'Copy Result';
        }, 2500);
      } catch (err) {
        this.showToast('Unable to copy automatically.', 'error');
      }
      document.body.removeChild(tempArea);
    }

    updateSoundIcon() {
      if (this.sound.isMuted) {
        this.soundIconOn.classList.add('hidden');
        this.soundIconOff.classList.remove('hidden');
        this.soundToggleBtn.title = 'Sound: OFF (Click to Unmute)';
      } else {
        this.soundIconOn.classList.remove('hidden');
        this.soundIconOff.classList.add('hidden');
        this.soundToggleBtn.title = 'Sound: ON (Click to Mute)';
      }
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;

      let icon = 'ℹ️';
      if (type === 'error') icon = '⚠️';
      if (type === 'success') icon = '🎉';

      toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
      this.toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  /* --------------------------------------------------------------------------
     10. Ambient Background Particles Generator
     -------------------------------------------------------------------------- */
  function initAmbientParticles() {
    const container = document.getElementById('bgParticles');
    if (!container) return;

    const count = 35;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'bg-particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${Math.random() * 8 + 6}s`;
      p.style.animationDelay = `${Math.random() * 8}s`;
      p.style.width = `${Math.random() * 2 + 1}px`;
      p.style.height = p.style.width;
      if (Math.random() > 0.5) {
        p.style.background = 'var(--neon-cyan)';
        p.style.boxShadow = '0 0 6px var(--neon-cyan)';
      } else {
        p.style.background = 'var(--neon-purple)';
        p.style.boxShadow = '0 0 6px var(--neon-purple)';
      }
      container.appendChild(p);
    }
  }

  // Bootstrap when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initAmbientParticles();
    window.gameInstance = new GuessTheNumberGame();
  });
})();
