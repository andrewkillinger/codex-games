class SandboxScene extends Phaser.Scene {
  constructor() {
    super('sandbox');
    this.blocks = [];
    this.currentTool = 'block';
    this.currentMaterial = 'stone';
  }

  preload() {
    // create a simple circle texture for particles
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('particle', 16, 16);
    g.clear();

    // generate simple textures for sun and moon
    g.fillStyle(0xffdd55, 1);
    g.fillCircle(32, 32, 32);
    g.generateTexture('sun', 64, 64);
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(28, 28, 28);
    g.generateTexture('moon', 56, 56);
    g.destroy();
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // ground
    this.matter.add.rectangle(w / 2, h - 25, w, 50, { isStatic: true, friction: 1 });

    // sky elements
    this.sun = this.add.image(0, 0, 'sun').setDepth(-1);
    this.moon = this.add.image(0, 0, 'moon').setDepth(-1);
    this.cameras.main.setBackgroundColor('#87ceeb');

    // menu buttons
    const toolbar = document.getElementById('toolbar');
    toolbar.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currentTool = btn.dataset.tool;
        toolbar
          .querySelectorAll('button')
          .forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // material selection
    document
      .getElementById('materialSelect')
      .addEventListener('change', (e) => {
        this.currentMaterial = e.target.value;
      });

    // keyboard input fallback
    const keys = this.input.keyboard.addKeys('ONE,TWO,THREE');
    keys.ONE.on('down', () => toolbar.querySelector('button[data-tool="block"]').click());
    keys.TWO.on('down', () => toolbar.querySelector('button[data-tool="smallBomb"]').click());
    keys.THREE.on('down', () => toolbar.querySelector('button[data-tool="bigBomb"]').click());

    // placing objects (ignore UI clicks)
    this.input.on('pointerdown', (pointer) => {
      if (pointer.event.target.tagName !== 'CANVAS') {
        return;
      }
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
  }

  placeBlock(x, y) {
    const size = 40;
    let color = 0x7f7fff;
    if (this.currentMaterial === 'wood') {
      color = 0xdeb887;
    }
    const rect = this.add.rectangle(x, y, size, size, color);
    const opts = this.currentMaterial === 'wood' ? { density: 0.0005 } : { density: 0.001 };
    this.matter.add.gameObject(rect, opts);
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

  update(time) {
    const cycle = 300000; // 5 minutes for full day-night cycle
    const t = (time % cycle) / cycle; // 0..1
    const w = this.scale.width;
    const h = this.scale.height;

    // positions for sun and moon
    const angle = t * 2 * Math.PI;
    const radiusY = h * 0.4;
    const centerY = h * 0.6;

    const sunX = w * t;
    const sunY = centerY - Math.sin(angle) * radiusY;
    this.sun.setPosition(sunX, sunY).setAlpha(t < 0.5 ? 1 : 0);

    const moonT = (t + 0.5) % 1;
    const moonAngle = moonT * 2 * Math.PI;
    const moonX = w * moonT;
    const moonY = centerY - Math.sin(moonAngle) * radiusY;
    this.moon.setPosition(moonX, moonY).setAlpha(t < 0.5 ? 0 : 1);

    // sky color transitions
    const dayColor = Phaser.Display.Color.HexStringToColor('#87ceeb');
    const nightColor = Phaser.Display.Color.HexStringToColor('#001028');
    const colorInterp = (1 - Math.cos(angle)) / 2;
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(dayColor, nightColor, 1, colorInterp);
    this.cameras.main.setBackgroundColor(
      Phaser.Display.Color.GetColor(c.r, c.g, c.b)
    );
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
