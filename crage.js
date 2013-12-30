
module.exports.Game = Game;
function Game() {
  this.cards = [];
  this.locations = [];
  this.players = [];
}
Game.prototype.newPlayer = function(profile) {
  var player = new Player(this, profile);
  this.players.push(player);
  return player;
};
Game.prototype.newLocation = function(profile) {
  var location = new Location(this, profile);
  this.locations.push(location);
  return location;
};
Game.prototype.newCard = function(profile, location) {
  var card = new Card(this, profile, location);
  this.cards.push(card);
  return card;
};

module.exports.Player = Player;
function Player(game, profile) {
  this.game = game;
  this.profile = profile;
}

module.exports.Card = Card;
function Card(game, profile, location) {
  this.game = game;
  this.profile = profile;
  this.location = location;
}

// location types
module.exports.Location = Location;
function Location(game, profile) {
  this.game = game;
  this.profile = profile;
}
Location.prototype.getCards = function() {
  var self = this;
  return self.game.cards.filter(function(card) {
    return card.location === self;
  });
};
Location.prototype.sort = function(compare) {
  var cards = this.getCards();
  cards.sort(compare);
  cards.forEach(function(card, index) {
    card.locationIndex = index;
  });
};
Location.prototype.shuffle = function() {
  this.getCards().forEach(function(card) {
    card.locationIndex = Math.random();
  });
};
Location.prototype.getCardsInOrder = function() {
  var cards = this.getCards();
  cards.sort(function(a, b) {
    return operatorCompare(a.locationIndex, b.locationIndex);
  });
  return cards;
};

// boring utility function
module.exports.operatorCompare = operatorCompare;
function operatorCompare(a, b) {
  return a<b ? -1 : a>b ? 1 : 0;
}

