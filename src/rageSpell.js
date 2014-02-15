var crage = require("./crage");
var Vector = require("./vector");

module.exports.newGame = newGame;
function newGame(metrics) {
  var game = new crage.Game(getActions);
  var z = 0;
  var canvasCenter = {x: metrics.canvasWidth/2, y: metrics.canvasHeight/2};
  [{}, {}].forEach(function(profile, playerIndex) {
    var player = game.newPlayer(profile);
    var playerTheta = Math.PI*playerIndex;
    player.hand = game.newLocation({
      visibility: player,
      layout: rotateLayout({
        center: {x: metrics.canvasWidth/2, y: metrics.canvasHeight*(1/2 + 5/16)},
        spacing: {x: metrics.cardWidth, y: 0},
        cardRotation: playerTheta,
        z: z++,
      }),
    });
    var deckSpacing = metrics.cardWidth/20;
    player.deck = game.newLocation({
      visibility: false,
      layout: rotateLayout({
        center: {x: metrics.canvasWidth/4, y: metrics.canvasHeight*(1/2 + 5/16)},
        spacing: {x: deckSpacing, y: deckSpacing},
        cardRotation: playerTheta,
        z: z++,
      }),
    });
    player.discardPile = game.newLocation({
      visibility: true,
      layout: rotateLayout({
        center: {x: metrics.canvasWidth/2, y: metrics.canvasHeight*(1/2 + 7/16)},
        spacing: {x: metrics.cardWidth/5, y: 0},
        cardRotation: playerTheta,
        z: z++,
      }),
    });
    function rotateLayout(layout) {
      // rotate the center of all this player's locations around on the table.
      layout.center = Vector.rotate(layout.center, canvasCenter, playerTheta);
      layout.spacing = Vector.rotate(layout.spacing, {x:0, y:0}, playerTheta);
      return layout;
    }
  });

  function getActions() {
    return [];
  }

  game.renderBackground = function(context) {
    context.fillStyle = "#050";
    context.fillRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);
  };
  game.renderCardFace = function(context) {
  };
  return game;
}
