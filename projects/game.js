(function() {
  "use strict";
  const alpha = Math.random() / 3;
  const bot_aggro_chance = {
    "start": {
      'J': alpha,
      'Q': 0,
      'K': 3*alpha,
    },
    "bet": {
      'J': 0,
      'Q': 1/3,
      'K': 1,
    },
    "check": {
      'J': 1/3,
      'Q': 0,
      'K': 1,
    },
    "check-bet": {
      'J': 0,
      'Q': 1/3 + alpha,
      'K': 1,
    },
  };
  const transitions = {
    "end": {
      "deal": "start",
    },
    "start": {
      "check": "check",
      "bet": "bet",
    },
    "bet": {
      "fold": "end",
      "call": "end",
    },
    "check": {
      "check": "end",
      "bet": "check-bet",
    },
    "check-bet": {
      "fold": "end",
      "call": "end",
    },
  };
  const cards = [null, null];
  const scores = [0, 0];
  const p2idx = {
    "player": 0,
    "bot": 1,
  };
  var games = 0;
  var pot = 0;
  var state = "end";

  function pick_random_card() {
    return ['J','Q','K'][Math.floor(Math.random() * 3)];
  }
  function update_card(player, visible) {
    var content = "?";
    if (visible) {
      content = cards[p2idx[player]];
    }
    var elem = document.getElementById("card-" + player);
    elem.textContent = content;
    elem.classList.remove("winner");
    elem.classList.remove("loser");
    elem.classList.remove("draw");
  }
  function mark_winner(player) {
    document.getElementById("card-" + player).classList.add("winner");
  }
  function mark_loser(player) {
    document.getElementById("card-" + player).classList.add("loser");
  }
  function mark_draw() {
    document.getElementById("card-player").classList.add("draw");
    document.getElementById("card-bot").classList.add("draw");
  }
  function update_button(button, hidden) {
    document.getElementById("button-" + button).hidden = hidden;
  }
  function update_scores() {
    document.getElementById("score").textContent = "Score: " + scores[0];
    document.getElementById("pot").textContent = "Pot: " + pot;
    document.getElementById("games").textContent = "Games: " + games;
  }
  function clear_log() {
    document.getElementById("log").innerHTML = "";
  }
  function append_log(text) {
    document.getElementById("log").innerHTML += text + "<br>";
  }
  function player_act(action) {
    step_sm(action, 0);
    if (state != "end") {
      bot_act();
    }
  }
  var deal = (function () {
    var starting_player = 0;
    return function () {
      step_sm("deal", starting_player);
      if (starting_player) {
        bot_act();
      }
      starting_player = 1 - starting_player;
    };
  })();
  function bot_act() {
    const aggro = (Math.random() < bot_aggro_chance[state][cards[1]]) | 0;
    var action;
    switch (state) {
      case "start":
      case "check":
        action = ["check", "bet"][aggro];
        step_sm(action, 1);
        break;
      case "bet":
      case "check-bet":
        action = ["fold", "call"][aggro];
        step_sm(action, 1);
        break;
      default:
        break;
    }
  }
  function step_sm(action, pidx) {
    const oidx = 1 - pidx; //index of the other player
    const p2log = ["You ","Bot "];
    const s2log = ["","s",];

    switch (action) {
      case "deal":
        cards[0] = pick_random_card();
        cards[1] = pick_random_card();
        scores[0] -= 1;
        scores[1] -= 1;
        pot = 2;
        break;
      case "check":
        break;
      case "bet":
        scores[pidx] -= 1;
        pot += 1;
        break;
      case "fold":
        break;
      case "call":
        scores[pidx] -= 1;
        pot += 1;
        break;
      default:
        console.error("Unknown action: " + action);
        break;
    }

    state = transitions[state][action];

    switch (state) {
      case "start":
        clear_log();
        update_card("player", true);
        update_card("bot", false);
        update_button("deal", true);
        update_button("check", false);
        update_button("bet", false);
        update_button("fold", true);
        update_button("call", true);
        update_scores();
        append_log(p2log[pidx] + "post" + s2log[pidx] + " ante: 1");
        append_log(p2log[oidx] + "post" + s2log[oidx] + " ante: 1");
        break;
      case "bet":
        update_button("check", true);
        update_button("bet", true);
        update_button("fold", false);
        update_button("call", false);
        update_scores();
        append_log(p2log[pidx] + action + s2log[pidx]);
        break;
      case "check":
        update_button("check", false);
        update_button("bet", false);
        update_button("fold", true);
        update_button("call", true);
        update_scores();
        append_log(p2log[pidx] + action + s2log[pidx]);
        break;
      case "check-bet":
        update_button("check", true);
        update_button("bet", true);
        update_button("fold", false);
        update_button("call", false);
        update_scores();
        append_log(p2log[pidx] + action + s2log[pidx]);
        break;
      case "end":
        update_card("bot", true);
        append_log(p2log[pidx] + action + s2log[pidx]);
        var result = "";
        if (action == "fold") {
          result = ["loss", "win"][pidx];
          update_card("bot", false);
        } else if (cards[0] == cards[1]) {
          result = "draw";
        } else if (cards[0] == 'K' || cards[1] == 'J') {
          result = "win";
        } else if (cards[0] == 'J' || cards[1] == 'K') {
          result = "loss";
        }
        switch (result) {
          case "draw":
            scores[0] += pot / 2;
            scores[1] += pot / 2;
            append_log("Draw!");
            mark_draw();
            break;
          case "win":
            scores[0] += pot;
            append_log("You win!");
            mark_winner("player");
            mark_loser("bot");
            break;
          case "loss":
            scores[1] += pot;
            append_log("You lose!");
            mark_winner("bot");
            mark_loser("player");
            break;
          default:
            console.error("Unknown result");
            break;
        }
        pot = 0;
        games += 1;
        update_button("deal", false);
        update_button("check", true);
        update_button("bet", true);
        update_button("fold", true);
        update_button("call", true);
        update_scores();
        break;
      default:
        console.error("Unknown state: " + state);
        break;
    }
  }

  window.onload = function() {
    document.getElementById("button-check").addEventListener("click", function(){player_act("check");});
    document.getElementById("button-fold").addEventListener("click", function(){player_act("fold");});
    document.getElementById("button-bet").addEventListener("click", function(){player_act("bet");});
    document.getElementById("button-call").addEventListener("click", function(){player_act("call");});
    document.getElementById("button-deal").addEventListener("click", deal);
  };
})();
