var canvas = document.getElementById("canvas");

// for simplicity and scalability, we scale the units to 3x2
var canvasWidth = 300;
var canvasHeight = 200;

// want to fit 20 cards across
var cardWidth = canvasWidth/20;
// poker size is 2.5x3.5 inches
var cardHeight = cardWidth*3.5/2.5;
// corner radius is 1/20 the width of the card
var cornerRadius = cardWidth/20;
var fontSize = Math.floor(cardHeight/10);

var spades = "\u2660";
var clubs = "\u2663";
var hearts = "\u2665";
var diamonds = "\u2666";
var suitColor = {};
suitColor[spades] = "#000";
suitColor[clubs] = "#000";
suitColor[hearts] = "#f00";
suitColor[diamonds] = "#f00";
var cards = [];
[spades, clubs, hearts, diamonds].forEach(function(suit, i) {
  cards.push({x:i*cardWidth, y:0, suit: suit});
});

render();
function render() {
  var context = canvas.getContext("2d");
  context.save();

  context.scale(canvas.width/canvasWidth, canvas.height/canvasHeight);
  context.fillStyle = "#050";
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  cards.forEach(function(card) {
    context.fillStyle = "#fff";
    roundedCornerRect(context, card.x, card.y, cardWidth, cardHeight, cornerRadius);

    context.fillStyle = suitColor[card.suit];
    context.font = fontSize + "pt sans-serif";
    context.fillText(card.suit, card.x+cornerRadius, card.y+cornerRadius+fontSize);
  });

  context.restore();
  requestAnimationFrame(render);
}
function roundedCornerRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x      +radius, y);
  context. arcTo(x+width       , y              , x+width       , y       +radius, radius);
  context. arcTo(x+width       , y+height       , x+width-radius, y+height       , radius);
  context. arcTo(x             , y+height       , x             , y+height-radius, radius);
  context. arcTo(x             , y              , x      +radius, y              , radius);
  context.fill();
}

resize();
window.addEventListener("resize", resize);
function resize() {
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
}

