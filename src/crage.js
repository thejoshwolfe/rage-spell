
module.exports.Game = Game;
function Game(getActionsFunc) {
  this.cards = [];
  this.locations = [];
  this.players = [];
  this.getActions = getActionsFunc;
}
Game.prototype.newPlayer = function(profile) {
  var player = new Player(this, profile);
  this.players.push(player);
  return player;
};
Game.prototype.newLocation = function(options) {
  var location = new Location(this, options);
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

module.exports.Location = Location;
function Location(game, options) {
  this.game = game;
  this.visibility = options.visibility;
  this.layout = options.layout;
  if (this.layout != null && this.layout.z == null) this.layout.z = this.game.locations.length;
}
Location.prototype.getCards = function() {
  var self = this;
  return self.game.cards.filter(function(card) {
    return card.location.group === self;
  });
};
Location.prototype.sort = function(compare) {
  var cards = this.getCards();
  cards.sort(compare);
  cards.forEach(function(card, index) {
    card.location.index = index;
  });
};
Location.prototype.shuffle = function() {
  this.getCards().forEach(function(card) {
    card.location.index = Math.random();
  });
};
Location.prototype.append = function(card) {
  card.location = {group: this, index: this.getCards().length};
};
Location.prototype.getCardsInOrder = function() {
  var cards = this.getCards();
  cards.sort(function(a, b) {
    return operatorCompare(a.location.index, b.location.index);
  });
  return cards;
};

module.exports.Action = Action;
function Action(game, player, data, func) {
  this.game = game;
  this.player = player;
  this.data = data;
  this.func = func;
}

// boring utility function
module.exports.operatorCompare = operatorCompare;
function operatorCompare(a, b) {
  return a<b ? -1 : a>b ? 1 : 0;
}

