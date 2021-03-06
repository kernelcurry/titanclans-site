// function: Load member data
function load_members() {
  return ajax('https://titanclans.com/js/members.json', 'GET')
    .then(function(result) {
      return JSON.parse(result);
    });
}

// function: Load kill data
function load_kills() {
  return ajax('https://titanclans.com/js/kills.json', 'GET')
    .then(function(result) {
      return JSON.parse(result);
    });
}

// function: Load kill data
function load_gifts() {
  return ajax('https://titanclans.com/js/gifts.json', 'GET')
    .then(function(result) {
      return JSON.parse(result);
    });
}

function init() {
  Promise.all([
      load_members(),
      load_kills(),
      load_gifts()
    ])
    .then(data => {
      const members = data[0];
      const kills = data[1];
      const gifts = data[2];
      calculate_rankings(members, kills, gifts);
    })
    .catch(err => {
      console.log(err);
      $("div.tap-titans table.rankings").replaceWith("<h2>ERROR LOADING MEMBER INFORMATION</h2>");
      $("div.tap-titans table.rankings").replaceWith("<h2>ERROR LOADING KILL INFORMATION</h2>");
    });
}

function addRow(rank, username, dkp) {
  $("div.tap-titans table.rankings tr:last").after("<tr><td class=\"rank\">" + rank + "</td><td class=\"username\">" + username + "</td><td class=\"dkp\">" + dkp.toFixed(4) + "</td></tr>");
}

function calculate_rankings(members, kills, gifts) {

  members.forEach(function(member, m_index) {
    members[m_index].dkp = 0;
    console.log("ranking: " + member.username);

    kills.forEach(function(kill, k_index) {
      // check to see if we should count this kill for this member
      var join_date = Date.parse(member.joined);
      var kill_date = Date.parse(kill.date);
      if (join_date > kill_date) {
        return;
      }

      var score = 0;

      kill.damage.forEach(function(damage, d_index) {
        var username_regex = new RegExp(member.username, 'i')
        if (damage.username.match(username_regex)) {
          var now = new Date();
          var day_diff = Math.round((now - kill_date) / (1000 * 60 * 60 * 24));


          var rolling_avg_day = 15;
          if (day_diff > rolling_avg_day) {
            score = 0.1;
            return;
          }

          score = damage.value / 10000 * (1 - (day_diff / (rolling_avg_day + 1)));
        }
      });

      if (score === 0) {
        score = -10;
      }

      member.dkp = member.dkp + score;
    });

    // add gift bonus + 50 using rolling average
    gifts.forEach(function(gift, g_index) {
      var username_regex = new RegExp(member.username, 'i')
      if (gift.username.match(username_regex)) {
        var now = new Date();
        var gift_date = Date.parse(gift.date);
        var day_diff = Math.round((now - gift_date) / (1000 * 60 * 60 * 24));
        var gift_score = 500 / (day_diff + 1);

        console.log("Gift: +" + gift_score);
        member.dkp = member.dkp + gift_score;
      }
    });

    member.dkp = parseFloat(member.dkp.toFixed(4))

    console.log(member.username + " : " + member.dkp);
  });

  console.log('Results');

  // sort members by dkp
  members.sort(function(a, b) {
    return b.dkp - a.dkp;
  });

  // add members to table
  members.forEach(function(member, m_index) {
    console.log(member.username + " : " + member.dkp);
    addRow(m_index + 1, member.username, member.dkp);
  });
}

function ajax(url, method, data) {
  return new Promise(function(resolve, reject) {
    var request = new XMLHttpRequest();
    request.responseType = 'text';
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          resolve(request.responseText);
        } else {
          reject(Error(request.statusText));
        }
      }
    };
    request.onerror = function() {
      reject(Error("Network Error"));
    };
    request.open(method, url, true);
    request.send(data);
  });
}

jQuery(document).ready(function($) {
  init();
});