import Phaser from 'phaser';

class DemoScene extends Phaser.Scene {
  constructor() { 
    super('demo'); 
    this.player = null;
    this.cursors = null;
    this.SPEED = 200; // px/sec
  }

  create() {
    // Make a big world so the camera has room to move
    const WORLD_W = 2000, WORLD_H = 2000;
    this.cameras.main.setBackgroundColor('#242424');

    // Simple backdrop grid so you can see motion
    const g = this.add.graphics();
    g.lineStyle(1, 0x3a3a3a, 1);
    for (let x = 0; x <= WORLD_W; x += 64) g.lineBetween(x, 0, x, WORLD_H);
    for (let y = 0; y <= WORLD_H; y += 64) g.lineBetween(0, y, WORLD_W, y);

    // Player: a blue circle with Arcade physics
    const circle = this.add.circle(160, 120, 18, 0x3399ff);
    this.physics.add.existing(circle);
    this.player = circle;
    this.player.body.setCircle(18).setCollideWorldBounds(true);

    // Physics/world bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.player.body.setBoundsRectangle(new Phaser.Geom.Rectangle(0, 0, WORLD_W, WORLD_H));

    // Camera follow
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12); // lerped follow

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();

    // HUD
    this.add.text(14, 14, 'Arrow keys to move', { font: '16px Arial', fill: '#ffffff' })
      .setScrollFactor(0); // stick to camera
  }

  update(time, delta) {
    if (!this.player) return;
    const body = /** @type {Phaser.Physics.Arcade.Body} */ (this.player.body);
    body.setVelocity(0);

    if (this.cursors.left.isDown)  body.setVelocityX(-this.SPEED);
    if (this.cursors.right.isDown) body.setVelocityX(this.SPEED);
    if (this.cursors.up.isDown)    body.setVelocityY(-this.SPEED);
    if (this.cursors.down.isDown)  body.setVelocityY(this.SPEED);

    // Normalize diagonal speed
    body.velocity.normalize().scale(this.SPEED);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 320,
  height: 240,
  backgroundColor: '#242424',
  scene: [DemoScene],
  physics: { default: 'arcade' }
});
