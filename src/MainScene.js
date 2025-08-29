import Phaser from 'phaser';

const Materials = {
  EMPTY: 0,
  SAND: 1,
  WATER: 2,
  LAVA: 3
};

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('main');

    this.cellSize = 4;
    this.gridWidth = 200;
    this.gridHeight = 150;
  }

  preload() {}

  create() {
    this.grid = Array.from({ length: this.gridHeight }, () => Array(this.gridWidth).fill(Materials.EMPTY));
    this.graphics = this.add.graphics();
    this.input.mouse.disableContextMenu();

    this.currentMaterial = Materials.SAND;
    this.pointerDown = false;

    this.input.on('pointerdown', (pointer) => {
      this.pointerDown = true;
      this.handlePointer(pointer);
    });
    this.input.on('pointerup', () => {
      this.pointerDown = false;
    });
    this.input.on('pointermove', (pointer) => {
      if (this.pointerDown) {
        this.handlePointer(pointer);
      }
    });

    this.keys = this.input.keyboard.addKeys({
      sand: 'ONE',
      water: 'TWO',
      lava: 'THREE',
      ball: 'FOUR',
      dynamite: 'FIVE',
      gopher: 'SIX'
    });

    this.physics.world.setBounds(0, 0, this.gridWidth * this.cellSize, this.gridHeight * this.cellSize);
    this.objects = this.add.group();
    this.gophers = this.add.group();
  }

  handlePointer(pointer) {
    const x = Math.floor(pointer.x / this.cellSize);
    const y = Math.floor(pointer.y / this.cellSize);
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;

    switch (this.currentMaterial) {
      case Materials.SAND:
      case Materials.WATER:
      case Materials.LAVA:
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
              this.grid[ny][nx] = this.currentMaterial;
            }
          }
        }
        break;
      case 'BALL': {
        const ball = this.add.circle(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize / 2, 0xffffff);
        this.physics.add.existing(ball);
        this.objects.add(ball);
        break;
      }
      case 'DYNAMITE': {
        const dyn = this.add.rectangle(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize, this.cellSize * 2, 0xff0000);
        this.physics.add.existing(dyn);
        this.objects.add(dyn);
        this.time.delayedCall(2000, () => {
          const gx = Math.floor(dyn.x / this.cellSize);
          const gy = Math.floor(dyn.y / this.cellSize);
          const radius = 6;
          for (let oy = -radius; oy <= radius; oy++) {
            for (let ox = -radius; ox <= radius; ox++) {
              const dx = gx + ox;
              const dy2 = gy + oy;
              if (dx >= 0 && dx < this.gridWidth && dy2 >= 0 && dy2 < this.gridHeight) {
                this.grid[dy2][dx] = Materials.EMPTY;
              }
            }
          }
          dyn.destroy();
        });
        break;
      }
      case 'GOPHER': {
        const gopher = this.add.rectangle(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize, this.cellSize * 2, 0x996633);
        this.physics.add.existing(gopher);
        gopher.body.setVelocityY(40);
        this.gophers.add(gopher);
        break;
      }
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.sand)) this.currentMaterial = Materials.SAND;
    if (Phaser.Input.Keyboard.JustDown(this.keys.water)) this.currentMaterial = Materials.WATER;
    if (Phaser.Input.Keyboard.JustDown(this.keys.lava)) this.currentMaterial = Materials.LAVA;
    if (Phaser.Input.Keyboard.JustDown(this.keys.ball)) this.currentMaterial = 'BALL';
    if (Phaser.Input.Keyboard.JustDown(this.keys.dynamite)) this.currentMaterial = 'DYNAMITE';
    if (Phaser.Input.Keyboard.JustDown(this.keys.gopher)) this.currentMaterial = 'GOPHER';

    for (let y = this.gridHeight - 2; y >= 0; y--) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        if (cell === Materials.SAND) {
          if (this.grid[y + 1][x] === Materials.EMPTY) {
            this.grid[y + 1][x] = cell;
            this.grid[y][x] = Materials.EMPTY;
          } else {
            const dir = Math.random() < 0.5 ? -1 : 1;
            if (this.grid[y + 1][x + dir] === Materials.EMPTY) {
              this.grid[y + 1][x + dir] = cell;
              this.grid[y][x] = Materials.EMPTY;
            }
          }
        } else if (cell === Materials.WATER || cell === Materials.LAVA) {
          if (this.grid[y + 1][x] === Materials.EMPTY) {
            this.grid[y + 1][x] = cell;
            this.grid[y][x] = Materials.EMPTY;
          } else {
            const dir = Math.random() < 0.5 ? -1 : 1;
            if (this.grid[y][x + dir] === Materials.EMPTY) {
              this.grid[y][x + dir] = cell;
              this.grid[y][x] = Materials.EMPTY;
            }
          }
        }
      }
    }

    this.graphics.clear();
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        if (cell !== Materials.EMPTY) {
          let color = 0xffffff;
          if (cell === Materials.SAND) color = 0xc2b280;
          if (cell === Materials.WATER) color = 0x3399ff;
          if (cell === Materials.LAVA) color = 0xff4500;
          this.graphics.fillStyle(color, 1);
          this.graphics.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }

    this.gophers.children.each((gopher) => {
      const gx = Math.floor(gopher.x / this.cellSize);
      const gy = Math.floor((gopher.y + gopher.height / 2) / this.cellSize);
      for (let dy = 0; dy < 2; dy++) {
        const ny = gy + dy;
        if (ny >= 0 && ny < this.gridHeight && gx >= 0 && gx < this.gridWidth) {
          this.grid[ny][gx] = Materials.EMPTY;
        }
      }
      if (gopher.y > this.gridHeight * this.cellSize) {
        gopher.destroy();
      }
    });
  }
}
