import Phaser from 'phaser';
import MainScene from './MainScene.js';

const config = {
  type: Phaser.AUTO,
  width: 375,
  height: 812,
  backgroundColor: '#000000',
  parent: 'game',
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
