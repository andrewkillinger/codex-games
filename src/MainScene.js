import Phaser from 'phaser';

const Materials = {
  EMPTY: 0,
  SAND: 1,
  WATER: 2,
  LAVA: 3,
  SOIL: 4,
  LEAF: 5,
};

const Objects = {
  BALL: 'BALL',
  DYNAMITE: 'DYNAMITE',
  SEED: 'SEED',
  STONE: 'STONE',
  ICE: 'ICE',
  FIRE: 'FIRE',
  GAS: 'GAS',
  METAL: 'METAL',
  OIL: 'OIL',
  MAGNET: 'MAGNET',
};

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('main');

    this.cellSize = 4;
    this.mode = 'INTERACT';
    this.currentSelection = { kind: 'material', value: Materials.SAND };
  }

  preload() {}

  create() {
    this.gridWidth = Math.floor(this.scale.width / this.cellSize);
    this.gridHeight = Math.floor(this.scale.height / this.cellSize);
    this.grid = Array.from({ length: this.gridHeight }, () =>
      Array(this.gridWidth).fill(Materials.EMPTY)
    );
    this.graphics = this.add.graphics();
    this.input.mouse.disableContextMenu();

    this.pointerDown = false;

    this.input.on('pointerdown', (pointer) => {
      if (this.mode === 'PLACE') {
        this.pointerDown = true;
        this.handlePlace(pointer);
      }
    });
    this.input.on('pointerup', () => {
      this.pointerDown = false;
    });
    this.input.on('pointermove', (pointer) => {
      if (this.mode === 'PLACE' && this.pointerDown) {
        this.handlePlace(pointer);
      }
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (this.mode === 'INTERACT') {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    });

    this.physics.world.setBounds(
      0,
      0,
      this.gridWidth * this.cellSize,
      this.gridHeight * this.cellSize
    );
    this.objects = this.add.group();

    const modeBtn = document.getElementById('modeBtn');
    const palette = document.getElementById('palette');

    modeBtn.addEventListener('click', () => {
      this.mode = this.mode === 'INTERACT' ? 'PLACE' : 'INTERACT';
      modeBtn.textContent = this.mode === 'INTERACT' ? 'Interact' : 'Place';
      palette.classList.toggle('active', this.mode === 'PLACE');
    });

    const options = [
      { kind: 'material', value: Materials.SAND, label: 'Sand' },
      { kind: 'material', value: Materials.WATER, label: 'Water' },
      { kind: 'material', value: Materials.LAVA, label: 'Lava' },
      { kind: 'material', value: Materials.SOIL, label: 'Soil' },
      { kind: 'object', value: Objects.BALL, label: 'Ball' },
      { kind: 'object', value: Objects.DYNAMITE, label: 'Dynamite' },
      { kind: 'object', value: Objects.SEED, label: 'Seed' },
      { kind: 'object', value: Objects.STONE, label: 'Stone' },
      { kind: 'object', value: Objects.ICE, label: 'Ice' },
      { kind: 'object', value: Objects.FIRE, label: 'Fire' },
      { kind: 'object', value: Objects.GAS, label: 'Gas' },
      { kind: 'object', value: Objects.METAL, label: 'Metal' },
      { kind: 'object', value: Objects.OIL, label: 'Oil' },
      { kind: 'object', value: Objects.MAGNET, label: 'Magnet' },
    ];

    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        this.currentSelection = { kind: opt.kind, value: opt.value };
      });
      palette.appendChild(btn);
    });
  }

  handlePlace(pointer) {
    const x = Math.floor(pointer.x / this.cellSize);
    const y = Math.floor(pointer.y / this.cellSize);
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;

    if (this.currentSelection.kind === 'material') {
      const mat = this.currentSelection.value;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
            this.grid[ny][nx] = mat;
          }
        }
      }
    } else {
      const objType = this.currentSelection.value;
      const px = x * this.cellSize + this.cellSize / 2;
      const py = y * this.cellSize + this.cellSize / 2;
      switch (objType) {
        case Objects.BALL: {
          const ball = this.add.circle(px, py, this.cellSize / 2, 0xffffff);
          this.physics.add.existing(ball);
          ball.customType = Objects.BALL;
          ball.setInteractive();
          this.input.setDraggable(ball);
          this.objects.add(ball);
          break;
        }
        case Objects.DYNAMITE: {
          const dyn = this.add.rectangle(
            px,
            py,
            this.cellSize,
            this.cellSize * 2,
            0xff0000
          );
          this.physics.add.existing(dyn);
          dyn.customType = Objects.DYNAMITE;
          dyn.setInteractive();
          this.input.setDraggable(dyn);
          this.objects.add(dyn);
          this.time.delayedCall(2000, () => {
            const gx = Math.floor(dyn.x / this.cellSize);
            const gy = Math.floor(dyn.y / this.cellSize);
            const radius = 6;
            for (let oy = -radius; oy <= radius; oy++) {
              for (let ox = -radius; ox <= radius; ox++) {
                const dx = gx + ox;
                const dy2 = gy + oy;
                if (
                  dx >= 0 &&
                  dx < this.gridWidth &&
                  dy2 >= 0 &&
                  dy2 < this.gridHeight
                ) {
                  this.grid[dy2][dx] = Materials.EMPTY;
                }
              }
            }
            dyn.destroy();
          });
          break;
        }
        case Objects.SEED: {
          const seed = this.add.circle(px, py, this.cellSize / 2, 0x00ff00);
          this.physics.add.existing(seed);
          seed.customType = Objects.SEED;
          seed.setInteractive();
          this.input.setDraggable(seed);
          this.objects.add(seed);
          this.time.delayedCall(3000, () => {
            const gx = Math.floor(seed.x / this.cellSize);
            const gy = Math.floor(seed.y / this.cellSize);
            for (let i = 0; i < 5; i++) {
              const ny = gy - i;
              if (ny >= 0) this.grid[ny][gx] = Materials.SOIL;
            }
            for (let oy = -2; oy <= 2; oy++) {
              for (let ox = -2; ox <= 2; ox++) {
                const nx = gx + ox;
                const ny = gy - 5 + oy;
                if (
                  nx >= 0 &&
                  nx < this.gridWidth &&
                  ny >= 0 &&
                  ny < this.gridHeight &&
                  Math.abs(ox) + Math.abs(oy) < 3
                ) {
                  this.grid[ny][nx] = Materials.LEAF;
                }
              }
            }
            seed.destroy();
          });
          break;
        }
        case Objects.STONE: {
          const stone = this.add.rectangle(px, py, this.cellSize, this.cellSize, 0x888888);
          this.physics.add.existing(stone);
          stone.body.setImmovable(true);
          stone.customType = Objects.STONE;
          stone.setInteractive();
          this.input.setDraggable(stone);
          this.objects.add(stone);
          break;
        }
        case Objects.ICE: {
          const ice = this.add.rectangle(px, py, this.cellSize, this.cellSize, 0x99ddee);
          this.physics.add.existing(ice);
          ice.customType = Objects.ICE;
          ice.setInteractive();
          this.input.setDraggable(ice);
          this.objects.add(ice);
          this.time.delayedCall(5000, () => {
            const gx = Math.floor(ice.x / this.cellSize);
            const gy = Math.floor(ice.y / this.cellSize);
            ice.destroy();
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = gx + dx;
                const ny = gy + dy;
                if (
                  nx >= 0 &&
                  nx < this.gridWidth &&
                  ny >= 0 &&
                  ny < this.gridHeight
                ) {
                  this.grid[ny][nx] = Materials.WATER;
                }
              }
            }
          });
          break;
        }
        case Objects.FIRE: {
          const fire = this.add.rectangle(px, py, this.cellSize, this.cellSize, 0xffdd00);
          this.physics.add.existing(fire);
          fire.customType = Objects.FIRE;
          fire.setInteractive();
          this.input.setDraggable(fire);
          this.objects.add(fire);
          break;
        }
        case Objects.GAS: {
          const gas = this.add.circle(px, py, this.cellSize / 2, 0xcccccc);
          this.physics.add.existing(gas);
          gas.body.setVelocityY(-50);
          gas.body.setAllowGravity(false);
          gas.customType = Objects.GAS;
          gas.setInteractive();
          this.input.setDraggable(gas);
          this.objects.add(gas);
          break;
        }
        case Objects.METAL: {
          const metal = this.add.rectangle(px, py, this.cellSize, this.cellSize, 0xaaaaaa);
          this.physics.add.existing(metal);
          metal.body.setGravityY(600);
          metal.customType = Objects.METAL;
          metal.setInteractive();
          this.input.setDraggable(metal);
          this.objects.add(metal);
          break;
        }
        case Objects.OIL: {
          const oil = this.add.circle(px, py, this.cellSize / 2, 0x222222);
          this.physics.add.existing(oil);
          oil.body.setBounce(0.8);
          oil.customType = Objects.OIL;
          oil.setInteractive();
          this.input.setDraggable(oil);
          this.objects.add(oil);
          break;
        }
        case Objects.MAGNET: {
          const magnet = this.add.rectangle(px, py, this.cellSize, this.cellSize, 0xffff00);
          this.physics.add.existing(magnet);
          magnet.body.setImmovable(true);
          magnet.customType = Objects.MAGNET;
          magnet.setInteractive();
          this.input.setDraggable(magnet);
          this.objects.add(magnet);
          break;
        }
      }
    }
  }

  update() {
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

    this.objects.getChildren().forEach((obj) => {
      if (obj.customType === Objects.FIRE) {
        const gx = Math.floor(obj.x / this.cellSize);
        const gy = Math.floor(obj.y / this.cellSize);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = gx + dx;
            const ny = gy + dy;
            if (
              nx >= 0 &&
              nx < this.gridWidth &&
              ny >= 0 &&
              ny < this.gridHeight
            ) {
              this.grid[ny][nx] = Materials.LAVA;
            }
          }
        }
      } else if (obj.customType === Objects.MAGNET) {
        this.objects.getChildren().forEach((other) => {
          if (other.customType === Objects.METAL) {
            const dx = obj.x - other.x;
            const dy = obj.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5 && dist < 100) {
              other.body.velocity.x += (dx / dist);
              other.body.velocity.y += (dy / dist);
            }
          }
        });
      }
    });

    this.graphics.clear();
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        if (cell !== Materials.EMPTY) {
          let color = 0xffffff;
          if (cell === Materials.SAND) color = 0xc2b280;
          if (cell === Materials.WATER) color = 0x3399ff;
          if (cell === Materials.LAVA) color = 0xff4500;
          if (cell === Materials.SOIL) color = 0x654321;
          if (cell === Materials.LEAF) color = 0x00ff00;
          this.graphics.fillStyle(color, 1);
          this.graphics.fillRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }
  }
}
