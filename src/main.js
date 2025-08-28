import MainScene from './MainScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2d2d2d',
  scene: [MainScene]
};

new Phaser.Game(config);
