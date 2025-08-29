class SandboxScene extends Phaser.Scene {
  constructor() {
    super('sandbox');
    this.blocks = [];
    this.currentTool = 'block';
  }

  preload() {
    // create a simple circle texture for particles
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('particle', 16, 16);
    g.destroy();
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // ground
    this.matter.add.rectangle(w / 2, h - 25, w, 50, { isStatic: true, friction: 1 });

    // input tool selection
    const keys = this.input.keyboard.addKeys('ONE,TWO,THREE');
    keys.ONE.on('down', () => (this.currentTool = 'block'));
    keys.TWO.on('down', () => (this.currentTool = 'smallBomb'));
    keys.THREE.on('down', () => (this.currentTool = 'bigBomb'));

    this.input.on('pointerdown', (pointer) => {
      switch (this.currentTool) {
        case 'block':
          this.placeBlock(pointer.worldX, pointer.worldY);
          break;
        case 'smallBomb':
          this.placeBomb(pointer.worldX, pointer.worldY, 80, 1);
          break;
        case 'bigBomb':
          this.placeBomb(pointer.worldX, pointer.worldY, 160, 2);
          break;
      }
    });

    this.add.text(10, 10, '1: Block  2: Small Bomb  3: Large Bomb', { font: '16px monospace', fill: '#fff' });
  }

  placeBlock(x, y) {
    const size = 40;
    const rect = this.add.rectangle(x, y, size, size, 0x7f7fff);
    this.matter.add.gameObject(rect);
    rect.setFriction(0.9);
    rect.setBounce(0.1);
    rect.health = 100;
    this.blocks.push(rect);
  }

  placeBomb(x, y, radius, power) {
    const bomb = this.add.circle(x, y, radius / 4, 0xffaa00);
    this.matter.add.gameObject(bomb, { isStatic: true });
    bomb.explosionRadius = radius;
    bomb.power = power;
    this.time.delayedCall(1500, () => this.explodeBomb(bomb));
  }

  explodeBomb(bomb) {
    // particle explosion
    const particles = this.add.particles('particle');
    const emitter = particles.createEmitter({
      x: bomb.x,
      y: bomb.y,
      speed: { min: -300, max: 300 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      tint: [0xffee88, 0xff8800, 0xff0000],
      lifespan: 600,
      quantity: 60
    });
    emitter.explode(120, bomb.x, bomb.y);
    this.time.delayedCall(600, () => particles.destroy());

    // damage nearby blocks
    this.blocks = this.blocks.filter((block) => {
      const dx = block.x - bomb.x;
      const dy = block.y - bomb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= bomb.explosionRadius) {
        const force = (1 - dist / bomb.explosionRadius) * bomb.power;
        const ang = Math.atan2(dy, dx);
        const vx = Math.cos(ang) * force * 10;
        const vy = Math.sin(ang) * force * 10;
        block.setVelocity(block.body.velocity.x + vx, block.body.velocity.y + vy);
        block.health -= force * 60;
        if (block.health <= 0) {
          block.destroy();
          return false;
        }
      }
      return true;
    });

    bomb.destroy();
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#101014',
  physics: {
    default: 'matter',
    matter: { gravity: { y: 1 } }
  },
  scene: SandboxScene
};

new Phaser.Game(config);
