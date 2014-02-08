var crage = require("../crage");
var hearts = require("../hearts");
var canvas = document.getElementById("canvas");

// all coordinates are scaled to these dimensions
var canvasWidth = 300;
var canvasHeight = 200;

// want to fit 20 cards across
var cardWidth = canvasWidth/20;
// poker size is 2.5x3.5 inches
var cardHeight = cardWidth*3.5/2.5;
// corner radius is 1/20 the width of the card
var cornerRadius = cardWidth/20;
var fontSize = Math.floor(cardHeight/4);
function realToFakeX(realX) { return realX / canvas.width * canvasWidth; }
function realToFakeY(realY) { return realY / canvas.height * canvasHeight; }

var game = hearts.newGame();
var actions, actionCards;
refreshActions();
function refreshActions() {
  actions = game.getActions();
  actionCards = actions.map(function(action) { return action.data.card; });
  var z = 0;
  game.players.forEach(function(player, playerIndex) {
    player.hand.getCardsInOrder().forEach(function(card, cardIndex) {
      card.location.x = cardIndex * cardWidth;
      card.location.y = playerIndex * cardHeight;
      card.location.z = z++;
    });
    player.playSlot.getCards().forEach(function(card) {
      card.location.x = 13 * cardWidth;
      card.location.y = playerIndex * cardHeight;
      card.location.z = z++;
    });
    player.keepPile.getCardsInOrder().forEach(function(card, cardIndex) {
      card.location.x = (14 + cardIndex * 6/35) * cardWidth;
      card.location.y = playerIndex * cardHeight;
      card.location.z = z++;
    });
  });
  render();
}

render();
function render() {
  var context = canvas.getContext("2d");
  context.save();

  context.scale(canvas.width/canvasWidth, canvas.height/canvasHeight);
  context.fillStyle = "#050";
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  var cards = game.cards.slice(0);
  cards.sort(function(cardA, cardB) {
    return crage.operatorCompare(cardA.location.z, cardB.location.z);
  });
  cards.forEach(function(card) {
    renderCard(context, card);
  });

  context.restore();
}
function renderCard(context, card) {
  if (card.location.x == null) return;

  context.save();

  context.fillStyle = "#fff";
  roundedCornerRectPath(context, card.location.x, card.location.y, cardWidth, cardHeight, cornerRadius);
  context.clip();
  context.fill();

  context.fillStyle = card.profile.suit.color;
  context.font = fontSize + "pt sans-serif";
  var x = card.location.x+cornerRadius;
  var y = card.location.y+cornerRadius;
  y += fontSize;
  context.fillText(card.profile.rank.name, x, y);
  y += fontSize;
  context.fillText(card.profile.suit.symbol, x, y);

  if (actionCards.indexOf(card) === -1) {
    // can't click this
    context.globalAlpha = 0.3;
    context.fillStyle = "#000";
    context.fill();
  }

  context.restore();
}
function roundedCornerRectPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x      +radius, y);
  context. arcTo(x+width       , y              , x+width       , y       +radius, radius);
  context. arcTo(x+width       , y+height       , x+width-radius, y+height       , radius);
  context. arcTo(x             , y+height       , x             , y+height-radius, radius);
  context. arcTo(x             , y              , x      +radius, y              , radius);
}

resize();
window.addEventListener("resize", resize);
function resize() {
  // keep the canvas the center of attention
  if (window.innerWidth / canvasWidth < window.innerHeight / canvasHeight) {
    canvas.width = window.innerWidth;
    canvas.height = canvasHeight * canvas.width / canvasWidth;
    canvas.style.left = "0px";
    canvas.style.top = ((window.innerHeight - canvas.height) / 2) + "px";
  } else {
    canvas.height = window.innerHeight;
    canvas.width = canvasWidth * canvas.height / canvasHeight;
    canvas.style.left = ((window.innerWidth - canvas.width) / 2) + "px";
    canvas.style.top = "0px";
  }
  render();
}

canvas.addEventListener("mousedown", function(event) {
  var x = realToFakeX(event.layerX);
  var y = realToFakeY(event.layerY);
  var clickedActions = actions.filter(function(action) {
    var card = action.data.card;
    if (card == null) return true;
    if (x < card.location.x) return false;
    if (y < card.location.y) return false;
    if (card.location.x + cardWidth < x) return false;
    if (card.location.y + cardHeight < y) return false;
    return true;
  });
  clickedActions.sort(function(actionA, actionB) {
    return grage.operatorCompare(actionA.data.card.location.z, actionB.data.card.location.z);
  });
  var clickedAction = clickedActions[clickedActions.length - 1];
  if (clickedAction == null) return;
  clickedAction.func();
  refreshActions();
});
