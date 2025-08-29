import Phaser from 'phaser';

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 2000;
const DEFAULT_G = 0.001;
const STORAGE_KEY = 'sandbox_save';
const Matter = Phaser.Physics.Matter.Matter;

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
    this.pointers = new Map();
    this.dragBody = null;
    this.dragPointerId = null;
    this.dragData = null;
    this.camData = null;
    this.hud = null;
    this.paused = false;
  }

  preload() {}

  create() {
    const size = 64;
    const canvas = this.textures.createCanvas('grid', size, size);
    const ctx = canvas.getContext();
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    canvas.refresh();
    this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'grid').setOrigin(0);

    this.matter.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.matter.world.engine.world.gravity.y = DEFAULT_G;
    this.matter.world.sleeping = true;

    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    cam.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointerupoutside', this.handlePointerUp, this);
    this.input.on('wheel', (pointer, _go, dx, dy) => {
      const world = cam.getWorldPoint(pointer.x, pointer.y);
      const zoom = dy > 0 ? 0.9 : 1.1;
      cam.zoom = Phaser.Math.Clamp(cam.zoom * zoom, 0.5, 2.5);
      const world2 = cam.getWorldPoint(pointer.x, pointer.y);
      cam.scrollX += world.x - world2.x;
      cam.scrollY += world.y - world2.y;
    });

    const ui = document.getElementById('ui');
    const hudY = ui.offsetHeight + 8;
    this.hud = this.add
      .text(8, hudY, '', { font: '16px sans-serif', fill: '#ffffff' })
      .setScrollFactor(0);
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const bodies = this.matter.world.localWorld.bodies.filter(
          (b) => !b.isStatic && b.gameObject
        );
        const g = this.matter.world.engine.world.gravity.y / DEFAULT_G;
        this.hud.setText(`Bodies: ${bodies.length}  g:${g.toFixed(2)}`);
      }
    });

    const center = () => cam.getWorldPoint(cam.width / 2, cam.height / 2);
    document.getElementById('add-ball').addEventListener('click', () => {
      const p = center();
      this.spawnBall(p.x, p.y, 24);
    });
    document.getElementById('add-box').addEventListener('click', () => {
      const p = center();
      this.spawnBox(p.x, p.y, 48, 32);
    });
    document.getElementById('add-triangle').addEventListener('click', () => {
      const p = center();
      this.spawnTriangle(p.x, p.y, 48);
    });
    document.getElementById('add-bomb').addEventListener('click', () => {
      const p = center();
      this.spawnBomb(p.x, p.y, 24);
    });
    const pauseBtn = document.getElementById('pause');
    pauseBtn.addEventListener('click', () => {
      this.paused = !this.paused;
      this.matter.world.enabled = !this.paused;
      pauseBtn.textContent = this.paused ? 'Resume' : 'Pause';
    });
    document.getElementById('clear').addEventListener('click', () => this.clearBodies());
    document.getElementById('save').addEventListener('click', () => this.saveWorld());
    document.getElementById('load').addEventListener('click', () => this.loadWorld());

    const slider = document.getElementById('gravity');
    const gLabel = document.getElementById('gval');
    const updateG = () => {
      const g = parseFloat(slider.value);
      this.matter.world.engine.world.gravity.y = g * DEFAULT_G;
      gLabel.textContent = g.toFixed(2);
    };
    slider.addEventListener('input', updateG);
    updateG();
  }

  setupBody(body) {
    body.frictionAir = 0.01;
    body.restitution = 0.2;
  }

  spawnBall(x, y, r) {
    const ball = this.add.circle(x, y, r, 0x3399ff).setStrokeStyle(2, 0xffffff, 0.2);
    this.matter.add.gameObject(ball, { shape: { type: 'circle', radius: r } });
    ball.setData('type', 'ball');
    ball.setData('save', { type: 'ball', r });
    this.setupBody(ball.body);
    return ball;
  }

  spawnBox(x, y, w, h) {
    const box = this.add.rectangle(x, y, w, h, 0x33aa33).setStrokeStyle(2, 0xffffff, 0.2);
    this.matter.add.gameObject(box);
    box.setData('type', 'box');
    box.setData('save', { type: 'box', w, h });
    this.setupBody(box.body);
    return box;
  }

  spawnTriangle(x, y, side) {
    const h = side * Math.sqrt(3) / 2;
    const points = [0, -h / 2, side / 2, h / 2, -side / 2, h / 2];
    const tri = this.add
      .polygon(x, y, points, 0xffdd00)
      .setStrokeStyle(2, 0xffffff, 0.2);
    this.matter.add.gameObject(tri, {
      shape: { type: 'fromVerts', verts: points, flagInternal: true }
    });
    tri.setData('type', 'triangle');
    tri.setData('save', { type: 'triangle', side });
    this.setupBody(tri.body);
    return tri;
  }

  spawnBomb(x, y, r) {
    const bomb = this.add.circle(x, y, r, 0xff3333).setStrokeStyle(2, 0xffffff, 0.2);
    this.matter.add.gameObject(bomb, { shape: { type: 'circle', radius: r } });
    bomb.setData('type', 'bomb');
    bomb.setData('save', { type: 'bomb', r });
    this.setupBody(bomb.body);
    bomb.setInteractive();
    bomb.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      this.explodeBomb(bomb);
    });
    return bomb;
  }

  explodeBomb(bomb) {
    const body = bomb.body;
    const pos = body.position;
    const bodies = this.matter.world.localWorld.bodies;
    const radius = 200;
    for (const b of bodies) {
      if (b === body || b.isStatic || !b.gameObject) continue;
      const dx = b.position.x - pos.x;
      const dy = b.position.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius && dist > 0) {
        const force = (1 - dist / radius) * 0.05;
        Matter.Body.applyForce(b, b.position, {
          x: (dx / dist) * force,
          y: (dy / dist) * force
        });
      }
    }
    const flash = this.add
      .circle(pos.x, pos.y, 10, 0xff0000, 0.5)
      .setStrokeStyle(2, 0xff0000);
    this.tweens.add({
      targets: flash,
      radius: radius,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
    bomb.destroy();
  }

  clearBodies() {
    const bodies = this.matter.world.localWorld.bodies.slice();
    for (const b of bodies) {
      if (b.isStatic || !b.gameObject) continue;
      b.gameObject.destroy();
    }
  }

  saveWorld() {
    const data = [];
    for (const b of this.matter.world.localWorld.bodies) {
      if (b.isStatic || !b.gameObject) continue;
      const go = b.gameObject;
      const save = go.getData('save');
      data.push({
        ...save,
        x: b.position.x,
        y: b.position.y,
        angle: b.angle,
        vx: b.velocity.x,
        vy: b.velocity.y
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  loadWorld() {
    const txt = localStorage.getItem(STORAGE_KEY);
    if (!txt) return;
    this.clearBodies();
    const data = JSON.parse(txt);
    for (const entry of data) {
      let go = null;
      switch (entry.type) {
        case 'ball':
          go = this.spawnBall(entry.x, entry.y, entry.r);
          break;
        case 'box':
          go = this.spawnBox(entry.x, entry.y, entry.w, entry.h);
          break;
        case 'triangle':
          go = this.spawnTriangle(entry.x, entry.y, entry.side);
          break;
        case 'bomb':
          go = this.spawnBomb(entry.x, entry.y, entry.r);
          break;
      }
      if (go) {
        Matter.Body.setAngle(go.body, entry.angle);
        Matter.Body.setVelocity(go.body, { x: entry.vx, y: entry.vy });
      }
    }
  }

  handlePointerDown(pointer) {
    if (pointer.event && pointer.event.button && pointer.event.button !== 0) {
      return;
    }
    this.pointers.set(pointer.id, pointer);
    if (this.pointers.size === 1) {
      this.tryStartDrag(pointer);
    } else if (this.pointers.size === 2) {
      this.stopDrag();
      const arr = Array.from(this.pointers.values());
      const dist = Phaser.Math.Distance.Between(
        arr[0].x,
        arr[0].y,
        arr[1].x,
        arr[1].y
      );
      const mid = new Phaser.Math.Vector2(
        (arr[0].x + arr[1].x) / 2,
        (arr[0].y + arr[1].y) / 2
      );
      this.camData = { dist, mid };
    }
  }

  handlePointerMove(pointer) {
    this.pointers.set(pointer.id, pointer);
    const cam = this.cameras.main;
    if (pointer.isDown && (pointer.rightButtonDown() || pointer.middleButtonDown())) {
      cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom;
      cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom;
      return;
    }
    if (this.pointers.size === 1 && this.dragBody && pointer.id === this.dragPointerId) {
      const p = cam.getWorldPoint(pointer.x, pointer.y);
      Matter.Body.setPosition(this.dragBody, p);
      Matter.Body.setVelocity(this.dragBody, { x: 0, y: 0 });
    } else if (this.pointers.size === 2) {
      const arr = Array.from(this.pointers.values());
      const dist = Phaser.Math.Distance.Between(
        arr[0].x,
        arr[0].y,
        arr[1].x,
        arr[1].y
      );
      const mid = new Phaser.Math.Vector2(
        (arr[0].x + arr[1].x) / 2,
        (arr[0].y + arr[1].y) / 2
      );
      const prevWorld = cam.getWorldPoint(this.camData.mid.x, this.camData.mid.y);
      const scale = dist / this.camData.dist;
      cam.zoom = Phaser.Math.Clamp(cam.zoom * scale, 0.5, 2.5);
      const newWorld = cam.getWorldPoint(mid.x, mid.y);
      cam.scrollX += prevWorld.x - newWorld.x;
      cam.scrollY += prevWorld.y - newWorld.y;
      this.camData = { dist, mid };
    }
  }

  handlePointerUp(pointer) {
    this.pointers.delete(pointer.id);
    if (this.dragPointerId === pointer.id) {
      this.stopDrag();
    }
    if (this.pointers.size === 1) {
      const remaining = Array.from(this.pointers.values())[0];
      this.tryStartDrag(remaining);
    }
  }

  tryStartDrag(pointer) {
    const cam = this.cameras.main;
    const p = cam.getWorldPoint(pointer.x, pointer.y);
    const bodies = Matter.Query.point(this.matter.world.localWorld.bodies, p);
    let picked = null;
    let min = Infinity;
    for (const b of bodies) {
      if (b.isStatic || !b.gameObject) continue;
      if (b.gameObject.getData('type') === 'bomb') continue;
      const dx = b.position.x - p.x;
      const dy = b.position.y - p.y;
      const d = dx * dx + dy * dy;
      if (d < 80 * 80 && d < min) {
        min = d;
        picked = b;
      }
    }
    if (picked) {
      this.dragBody = picked;
      this.dragPointerId = pointer.id;
      this.dragData = { frictionAir: picked.frictionAir };
      picked.frictionAir = 0.2;
      Matter.Body.setAngularVelocity(picked, 0);
    }
  }

  stopDrag() {
    if (this.dragBody) {
      this.dragBody.frictionAir = this.dragData.frictionAir;
      this.dragBody = null;
      this.dragPointerId = null;
      this.dragData = null;
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 480,
  height: 320,
  backgroundColor: '#141414',
  physics: { default: 'matter', matter: { gravity: { y: DEFAULT_G } } },
  scene: MainScene
});
