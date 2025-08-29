import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
    this.player = null;
    this.cursors = null;
    this.SPEED = 180;
  }

  preload() {
    // Create a tileset texture with floor (index 0) and wall (index 1)
    const canvas = this.textures.createCanvas('tiles', 64, 32);
    const ctx = canvas.getContext();

    // Floor tile: dark gray with grid lines
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(0, 0, 32, 32);
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 31, 31);
    ctx.beginPath();
    ctx.moveTo(0, 16.5); ctx.lineTo(32, 16.5);
    ctx.moveTo(16.5, 0); ctx.lineTo(16.5, 32);
    ctx.stroke();

    // Wall tile: solid gray
    ctx.fillStyle = '#666666';
    ctx.fillRect(32, 0, 32, 32);

    canvas.refresh();
  }

  create() {
    const MAP_W = 80;
    const MAP_H = 80;
    const TILE = 32;

    const map = this.make.tilemap({ width: MAP_W, height: MAP_H, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles');
    const layer = map.createBlankLayer('layer', tileset);

    // Fill floor
    layer.fill(0);

    // Place walls
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1) {
          layer.putTileAt(1, x, y);
        } else if (Math.random() < 0.04) {
          layer.putTileAt(1, x, y);
        }
      }
    }

    layer.setCollision(1);

    const worldWidth = map.widthInPixels;
    const worldHeight = map.heightInPixels;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    const startX = TILE * 2 + TILE / 2;
    const startY = TILE * 2 + TILE / 2;
    const player = this.add.circle(startX, startY, 14, 0x3399ff);
    this.physics.add.existing(player);
    player.body.setCircle(14);
    player.body.setCollideWorldBounds(true);
    this.player = player;

    this.physics.add.collider(player, layer);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    this.add
      .text(12, 12, 'Arrow keys to move', { font: '16px Arial', fill: '#ffffff' })
      .setScrollFactor(0);
  }

  update() {
    if (!this.player) return;
    const body = /** @type {Phaser.Physics.Arcade.Body} */ (this.player.body);
    body.setVelocity(0);

    if (this.cursors.left.isDown) {
      body.setVelocityX(-this.SPEED);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(this.SPEED);
    }

    if (this.cursors.up.isDown) {
      body.setVelocityY(-this.SPEED);
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(this.SPEED);
    }

    body.velocity.normalize().scale(this.SPEED);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 480,
  height: 320,
  backgroundColor: '#242424',
  physics: { default: 'arcade' },
  scene: MainScene
});
