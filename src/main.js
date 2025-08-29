import Phaser from 'phaser';
import MainScene from './MainScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  pixelArt: true,
  scene: [MainScene]
};

new Phaser.Game(config);
