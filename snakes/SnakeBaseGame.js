GRID_SIZE = 20;

BasicGame.SnakeBaseGame = function (game) {
};



BasicGame.SnakeBaseGame.prototype = {

  NUM_ROWS: 0,
  NUM_COLS: 0,
  FONT_SIZE: 24,

  SNAKE_START_LENGTH: 4,
  SNAKE_START_X: 11,
  SNAKE_START_Y: 11,
  SNAKE_TICK: 0.15,
  NEW_BODY_PIECES_PER_APPLE: 3,
  SNAKE_FLICKER_SPEED: 0.2,

  APPLE_SCORE: 10,
  MAX_SCORE: 9999999990,
  APPLE_DELAY: 1500,

  DEATH_DELAY: 3,

  textGrid: [],

  score: 0,

  wallGroup: null,
  apple: null,


  create: function () {

    this.textGrid = [];
    this.dead = false;
    this.stateName = 'Snake';
    this.inputEnabled = true;

    this.NUM_ROWS = this.game.height/GRID_SIZE;
    this.NUM_COLS = this.game.width/GRID_SIZE;

    this.CONTROLS_X = 8;
    this.CONTROLS_Y = 7;

    this.WALL_LEFT = 1;
    this.WALL_RIGHT = this.NUM_COLS-2;
    this.WALL_TOP = 3;
    this.WALL_BOTTOM = this.NUM_ROWS - this.WALL_TOP - 1;


    this.instructionsButtonGroup = this.game.add.group();

    this.createWalls();
    this.createApple();
    this.createTexts();
    this.createSnake();
    this.createInput();

    this.appleSFX = this.game.add.audio('apple',0.2);

    // Set up for score
    this.score = 0;
    this.scoreX = this.NUM_COLS - 2;
    this.scoreY = 1;
    this.setScoreText(this.score.toString());

    // Set up for game over
    this.GAME_OVER_X = 4;
    this.GAME_OVER_Y = Math.floor(this.NUM_ROWS/2) - 2;

    this.appleTimer = this.game.time.create(false);

    // Create the update tick
    ticker = this.game.time.create(false);
    ticker.add(Phaser.Timer.SECOND * this.SNAKE_TICK, this.tick, this);
    ticker.start();
  },

  createWalls: function () {
    // Create the walls
    this.wallGroup = this.game.add.group();
    for (var y = this.WALL_TOP; y <= this.WALL_BOTTOM; y++) {
      for (var x = this.WALL_LEFT; x <= this.WALL_RIGHT; x++) {
        if (y == this.WALL_TOP || y == this.WALL_BOTTOM || x == this.WALL_LEFT || x == this.WALL_RIGHT) {
          // var wall = this.wallGroup.create(x*GRID_SIZE,y*GRID_SIZE,'wall')
          var wall = this.wallGroup.create(x*GRID_SIZE,y*GRID_SIZE,'wall')
          // this.game.physics.enable(wall, Phaser.Physics.ARCADE);
        }
      }
    }
  },

  createSnake: function () {
    this.snake = new Snake(this,this.SNAKE_START_X,this.SNAKE_START_Y);
  },

  createApple: function () {
    this.apple = this.game.add.sprite(-100,-100,'apple');
    this.game.physics.enable(this.apple, Phaser.Physics.ARCADE);
  },

  createInput: function () {
    if (this.game.device.desktop) {
      this.cursors = this.game.input.keyboard.createCursorKeys();
      this.rKey = this.game.input.keyboard.addKey(Phaser.Keyboard.R);
      this.mKey = this.game.input.keyboard.addKey(Phaser.Keyboard.M);
      this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.R)
      this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.M)
    }
    else {
      this.swipe = new Swipe(this.game);
      this.swipe.diagonalDisabled = true;
    }
    this.next = new Phaser.Point(0,0);
  },

  createTexts: function () {

    this.instructionsGroup = this.game.add.group();
    this.controlsGroup = this.game.add.group();

    this.createTextGrid();
    this.createInstructions();
    this.createControls();
  },

  createTextGrid: function () {
    this.textGroup = this.game.add.group();
    for (var y = 0; y < this.NUM_ROWS; y++) {
      this.textGrid.push([]);
      for (var x = 0; x < this.NUM_COLS; x++) {
        var char = this.game.add.bitmapText(GRID_SIZE*0.5 + x*GRID_SIZE, y*GRID_SIZE, 'atari','',this.FONT_SIZE,this.textGroup);
        char.anchor.x = 0.5;
        char.tint = 0xffffff;
        char.scale.y = 24/this.FONT_SIZE;
        this.textGrid[y].push(char);
      }
    }
  },

  addTextToGrid(startX,startY,text,group,buttonGroup,callback) {
    var x = startX;
    var y = startY;

    for (var i = 0; i < text.length; i++) {
      x = startX;
      for (var j = 0; j < text[i].length; j++) {
        this.textGrid[y][x].text = text[i].charAt(j);
        if (group) {
          group.add(this.textGrid[y][x]);
        }
        if (buttonGroup) {
          var sprite = buttonGroup.create(x*GRID_SIZE,y*GRID_SIZE,'black');
          sprite.inputEnabled = true;
          sprite.name = text;
          sprite.events.onInputDown.add(callback,this);
        }
        x++;
      }
      y++;
    }
  },

  createInstructions: function () {
    var instructionsY = this.NUM_ROWS - 2;
    var instructionsX = 1;

    if (this.game.device.desktop) {
      this.addTextToGrid(instructionsX,instructionsY,["R=RESTART M=MENU"],this.textGroup);
    }
    else {
      this.addTextToGrid(instructionsX,instructionsY,["RESTART"],this.textGroup,this.instructionsButtonGroup,this.restart);
      this.addTextToGrid(instructionsX+9,instructionsY,["MENU"],this.textGroup,this.instructionsButtonGroup,this.gotoMenu);
    }
  },

  createControls: function () {
    var controlsStrings = [];
    if (this.game.device.desktop) {
      controlsStrings = ["ARROWS","CONTROL","SNAKE"];
    }
    else {
      controlsStrings = ["SWIPES","CONTROL","SNAKE"];
    }

    this.addTextToGrid(this.CONTROLS_X,this.CONTROLS_Y,controlsStrings,this.controlsGroup);
  },

  update: function () {
    if (this.game.device.desktop) {
      this.handleKeyboardInput();
    }
    else {
      this.handleTouchInput();
    }
  },

  setScoreText: function (scoreString) {
    if (scoreString.length < this.MAX_SCORE.toString().length) {
      var spacesToAdd = (this.MAX_SCORE.toString().length - scoreString.length)+1;
      scoreString = Array(spacesToAdd).join(" ") + scoreString;
    }
    this.addTextToGrid(this.scoreX-scoreString.length,this.scoreY,[scoreString]);
  },

  setGameOverText: function (gameOverString,spacing,gameOverPointsString,spacing2,gameOverResultString) {
    this.addTextToGrid(this.GAME_OVER_X,this.GAME_OVER_Y,[gameOverString,spacing,gameOverPointsString,spacing2,gameOverResultString]);
  },

  tick: function () {
    ticker.add(Phaser.Timer.SECOND * this.SNAKE_TICK, this.tick, this);

    this.snake.tick();

    this.checkAppleCollision();
    this.checkBodyCollision();
    this.checkWallCollision();
  },

  addSnakeBits: function () {
    if (this.next.x == 0 && this.next.y == 0) return;

    if (this.snakeBitsToAdd > 0) {
      var bit = this.snakeBodyGroup.create(0,0,'body');
      this.game.physics.enable(bit,Phaser.Physics.ARCADE);
      this.snake.unshift(bit)
      this.snakeBitsToAdd = Math.max(0,this.snakeBitsToAdd-1);
    }
  },

  updateSnakePosition: function () {
    this.snake.move();
    return;


    if (this.next.x == 0 && this.next.y == 0) {
      return;
    }

    this.moveSFX.play();

    // Move every snake bit up by one
    for (var i = 0; i < this.snake.length - 1; i++) {
      this.snake[i].x = this.snake[i+1].x;
      this.snake[i].y = this.snake[i+1].y;
    }

    // Move the snake head
    this.snake.head.x += this.next.x;
    this.snakeHead.y += this.next.y;

    // Wrap
    if (this.snakeHead.x >= this.game.width) {
      this.snakeHead.x = 0;
    }
    else if (this.snakeHead.x < 0) {
      this.snakeHead.x = this.game.width - GRID_SIZE;
    }
    if (this.snakeHead.y >= this.game.height) {
      this.snakeHead.y = 0;
    }
    else if (this.snakeHead.y < 0) {
      this.snakeHead.y = this.game.height - GRID_SIZE;
    }
  },

  checkAppleCollision: function () {
    if (this.snake.head.position.equals(this.apple.position)) {
      this.appleSFX.play();

      this.apple.x = -1000;
      this.apple.y = -1000;
      this.apple.visible = false;
      this.startAppleTimer();
      this.snake.snakeBitsToAdd += this.NEW_BODY_PIECES_PER_APPLE;
      this.addToScore(this.APPLE_SCORE);
    }
  },

  addToScore: function (amount) {
    this.score = Math.min(this.score + amount,this.MAX_SCORE);
    this.setScoreText(this.score.toString());
  },

  repositionApple: function (apple) {
    if (!this.apple) return;
    if (!apple) apple = this.apple;

    apple.visible = true;
    var x = this.getRandomLocationWithin(WALL_LEFT+1,WALL_RIGHT);
    var y = this.getRandomLocationWithin(WALL_TOP+1,WALL_BOTTOM);
    var collisionCount = 0;
    var foundLocation = false;
    while (!foundLocation) {
      if (this.locationHasCollisionWithGroup(x*GRID_SIZE,y*GRID_SIZE,this.snakeBodyGroup)) {
        collisionCount++;
        if (collisionCount > 5) {
          break;
        }
      }
      else {
        foundLocation = true;
        break;
      }
    }
    if (foundLocation) {
      apple.x = x*GRID_SIZE;
      apple.y = y*GRID_SIZE;
      return true;
    }
    else {
      this.appleTimer.add(this.SNAKE_TICK*Phaser.Timer.SECOND,function () {
        this.repositionApple(apple);
      },this);
      this.appleTimer.start();
      return false;
    }
  },

  locationHasCollisionWithGroup: function (x,y,group) {
    var collision = false;
    group.forEach(function (element) {
      if (element.x == x && element.y == y) {
        collision = true;
        return;
      }
    });
    return collision;
  },

  getRandomLocationWithin: function(min,max) {
    return min + (Math.floor(Math.random() * (max-min)));
  },

  checkBodyCollision: function () {
    this.snake.forEach(function (bit) {
      if (this.snake.head.position.equals(bit.position) && bit != this.snake.head) {
        this.snake.die();
        return;
      }
    },this);
  },

  checkWallCollision: function () {
    this.wallGroup.forEach(function (wall) {
      if (this.snake.head.position.equals(wall.position)) {
        this.die();
        return;
      }
    },this);
  },

  gameOver: function () {
    this.setGameOverText("GAME OVER","",this.score+" POINTS","","");
  },

  gotoMenu: function () {
    this.game.state.start('Menu');
  },

  restart: function () {
    this.game.state.start(this.stateName);
  },

  handleKeyboardInput: function () {
    if (this.rKey.isDown) {
      this.restart();
    }
    else if (this.mKey.isDown) {
      this.gotoMenu();
    }

    if (this.dead) return;
    if (!this.inputEnabled) return;

    if (this.controlsGroup.visible && (this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown)) {
      this.hideControls();
      this.startAppleTimer();
    }

    // Check which key is down and set the next direction appropriately
    if (this.cursors.left.isDown) {
      this.snake.moveLeft();
    }
    else if (this.cursors.right.isDown) {
      this.snake.moveRight();
    }
    if (this.cursors.up.isDown) {
      this.snake.moveUp();
    }
    else if (this.cursors.down.isDown) {
      this.snake.moveDown();
    }
  },

  hideControls: function () {
    if (this.snake.next.x == 0 && this.snake.next.y == 0) {
      this.controlsGroup.forEach(function (letter) {
        letter.text = '';
      });
      this.controlsGroup.visible = false;
    }
  },

  startAppleTimer: function () {
    this.appleTimer.add(this.APPLE_DELAY,this.repositionApple,this);
    this.appleTimer.start();
  },


  handleTouchInput: function () {
    if (this.dead) return;
    if (!this.inputEnabled) return;

    var d = this.swipe.check();
    if (!d) return;

    if (this.controlsGroup.visible) {
      this.hideControls();
      this.startAppleTimer();
    }

    switch (d.direction) {
      case this.swipe.DIRECTION_LEFT:
      this.snake.left();
      break;

      case this.swipe.DIRECTION_RIGHT:
      this.snake.right();
      break;

      case this.swipe.DIRECTION_UP:
      this.snake.up();
      break;

      case this.swipe.DIRECTION_DOWN:
      this.snake.down();
      break;
    }
  },
};

function pad(num, size) {
  var s = num+"";
  while (s.length < size) s = "0" + s;
  return s;
}