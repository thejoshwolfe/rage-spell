// TODO: care about this file
var crage = require("./crage");

var decks = [
  {
    name: "Elves",
    cards: [
      { type: "Minion",
        profile: {
          name: "Elven Enchantress",
          power: [5],
        },
      },
      { type: "Minion",
        count: 2,
        profile: {
          name: "Elvish Bladesmith",
          power: [4],
        },
      },
      { type: "Minion",
        count: 3,
        profile: {
          name: "Elven Archer",
          power: [3, 4],
        },
      },
      { type: "Minion",
        count: 4,
        profile: {
          name: "Treehugger",
          power: [2, 3],
        },
      },
    ],
  },
];

var profiles = [
  {
    "name": "Asdf",
    "factions": [decks[0]],
  },
];

var game = new crage.Game();

// create players
profiles.forEach(function(profile) {
  var player = game.newPlayer(profile);
  extendPlayer(player);
});

// create cards
game.players.forEach(function(player) {
  player.profile.factions.forEach(function(deck) {
    deck.cards.forEach(function(card_template) {
      var count = card_template.count;
      if (count == null) count = 1;
      for (var i = 0; i < count; i++) {
        var card = game.newCard(card_template.profile, player.deck);
        card.owner = player;
        extendCard(card);
      }
    });
  });
  player.deck.shuffle();
});

// ready to start the game
game.players.forEach(function(player) {
  player.draw(5);
});

function extendPlayer(self) {
  self.getName = function() { return this.profile.name; };
  self.deck = self.game.newLocation();
  self.hand = self.game.newLocation();
  self.discardPile = self.game.newLocation();
  self.draw = function(count) {
    if (count == null) count = 1;
    for (var i = 0; i < count; i++) {
      var card = self.deck.getTopCard();
      card.location = self.hand;
    }
  };
}
function extendCard(self) {
  self.getName = function() { return self.profile.name; };
}
