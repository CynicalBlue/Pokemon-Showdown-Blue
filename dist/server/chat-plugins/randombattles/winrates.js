"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var winrates_exports = {};
__export(winrates_exports, {
  commands: () => commands,
  handlers: () => handlers,
  pages: () => pages,
  saveStats: () => saveStats,
  stats: () => stats
});
module.exports = __toCommonJS(winrates_exports);
var import_lib = require("../../../lib");
const STATS_PATH = "logs/randbats/{{MONTH}}-winrates.json";
const stats = getDefaultStats();
try {
  const path = STATS_PATH.replace("{{MONTH}}", getMonth());
  if (!(0, import_lib.FS)("logs/randbats/").existsSync()) {
    (0, import_lib.FS)("logs/randbats/").mkdirSync();
  }
  const savedStats = JSON.parse((0, import_lib.FS)(path).readSync());
  stats.elo = savedStats.elo;
  stats.month = savedStats.month;
  for (const k in stats.formats) {
    stats.formats[k] = savedStats.formats[k] || stats.formats[k];
  }
} catch {
}
function getDefaultStats() {
  return {
    elo: 1500,
    month: getMonth(),
    formats: {
      // all of these requested by rands staff. they don't anticipate it being changed much
      // so i'm not spending the time to add commands to toggle this
      gen9randombattle: { mons: {} },
      gen7randombattle: { mons: {} },
      gen6randombattle: { mons: {} },
      gen5randombattle: { mons: {} },
      gen4randombattle: { mons: {} },
      gen3randombattle: { mons: {} },
      gen1randombattle: { mons: {} }
    }
  };
}
function saveStats(month = getMonth()) {
  const curStats = { ...stats };
  (0, import_lib.FS)(STATS_PATH.replace("{{MONTH}}", month)).writeUpdate(() => JSON.stringify(curStats));
}
function getMonth() {
  return Chat.toTimestamp(new Date()).split(" ")[0].slice(0, -3);
}
function getSpeciesName(set, format) {
  const species = set.species;
  const item = Dex.items.get(set.item);
  const moves = set.moves;
  const megaRayquazaPossible = ["gen6", "gen7"].includes(format.mod) && !format.ruleset.includes("Mega Rayquaza Clause");
  if (species.startsWith("Pikachu-")) {
    return "Pikachu";
  } else if (species.startsWith("Unown-")) {
    return "Unown";
  } else if (species === "Gastrodon-East") {
    return "Gastrodon";
  } else if (species === "Magearna-Original") {
    return "Magearna";
  } else if (species === "Genesect-Douse") {
    return "Genesect";
  } else if (species === "Dudunsparce-Three-Segment") {
    return "Dudunsparce";
  } else if (species === "Maushold-Four") {
    return "Maushold";
  } else if (species === "Squawkabilly-Blue") {
    return "Squawkabilly";
  } else if (species === "Squawkabilly-White") {
    return "Squawkabilly-Yellow";
  } else if (species.startsWith("Basculin-")) {
    return "Basculin";
  } else if (species.startsWith("Sawsbuck-")) {
    return "Sawsbuck";
  } else if (species.startsWith("Vivillon-")) {
    return "Vivillon";
  } else if (species.startsWith("Florges-")) {
    return "Florges";
  } else if (species.startsWith("Furfrou-")) {
    return "Furfrou";
  } else if (species.startsWith("Minior-")) {
    return "Minior";
  } else if (species.startsWith("Toxtricity-")) {
    return "Toxtricity";
  } else if (species.startsWith("Tatsugiri-")) {
    return "Tatsugiri";
  } else if (species === "Zacian" && item.name === "Rusted Sword") {
    return "Zacian-Crowned";
  } else if (species === "Zamazenta" && item.name === "Rusted Shield") {
    return "Zamazenta-Crowned";
  } else if (species === "Kyogre" && item.name === "Blue Orb") {
    return "Kyogre-Primal";
  } else if (species === "Groudon" && item.name === "Red Orb") {
    return "Groudon-Primal";
  } else if (item.megaStone) {
    return item.megaStone;
  } else if (species === "Rayquaza" && moves.includes("Dragon Ascent") && megaRayquazaPossible) {
    return "Rayquaza-Mega";
  } else {
    return species;
  }
}
function checkRollover() {
  if (stats.month !== getMonth()) {
    saveStats(stats.month);
    Object.assign(stats, getDefaultStats());
    saveStats();
  }
}
const getZScore = (data) => 2 * Math.sqrt(data.timesGenerated) * (data.numWins / data.timesGenerated - 0.5);
const handlers = {
  onBattleEnd(battle, winner, players) {
    void collectStats(battle, winner, players);
  }
};
async function collectStats(battle, winner, players) {
  const formatData = stats.formats[battle.format];
  let eloFloor = stats.elo;
  const format = Dex.formats.get(battle.format);
  if (format.mod !== `gen${Dex.gen}`) {
    eloFloor = 1300;
  }
  if (!formatData || battle.rated < eloFloor)
    return;
  checkRollover();
  for (const p of players) {
    const team = await battle.getTeam(p);
    if (!team)
      return;
    const mons = team.map((f) => getSpeciesName(f, format));
    for (const mon of mons) {
      if (!formatData.mons[mon])
        formatData.mons[mon] = { timesGenerated: 0, numWins: 0 };
      formatData.mons[mon].timesGenerated++;
      if (toID(winner) === toID(p)) {
        formatData.mons[mon].numWins++;
      }
    }
  }
  saveStats();
}
const commands = {
  rwr: "randswinrates",
  randswinrates(target, room, user) {
    return this.parse(`/j view-winrates-${toID(target) || `gen${Dex.gen}randombattle`}`);
  },
  randswinrateshelp: [
    "/randswinrates OR /rwr [format] - Get a list of the win rates for all Pokemon in the given Random Battles format."
  ],
  async removewinrates(target, room, user) {
    this.checkCan("rangeban");
    if (!/^[0-9]{4}-[0-9]{2}$/.test(target) || target === getMonth()) {
      return this.errorReply(`Invalid month: ${target}`);
    }
    const path = STATS_PATH.replace("{{MON}}", target);
    if (!await (0, import_lib.FS)(path).exists()) {
      return this.errorReply(`No stats for the month ${target}.`);
    }
    await (0, import_lib.FS)(path).unlinkIfExists();
    this.globalModlog("REMOVEWINRATES", null, target);
    this.privateGlobalModAction(`${user.name} removed Random Battle winrates for the month of ${target}`);
  }
};
const pages = {
  async winrates(query, user) {
    if (!user.named)
      return Rooms.RETRY_AFTER_LOGIN;
    query = query.join("-").split("--");
    const format = toID(query.shift());
    if (!format)
      return this.errorReply(`Specify a format to view winrates for.`);
    if (!stats.formats[format]) {
      return this.errorReply(`That format does not have winrates tracked.`);
    }
    checkRollover();
    const sorter = toID(query.shift() || "zscore");
    if (!["zscore", "raw"].includes(sorter)) {
      return this.errorReply(`Invalid sorting method. Must be either 'zscore' or 'raw'.`);
    }
    const month = query.shift() || getMonth();
    if (!/^[0-9]{4}-[0-9]{2}$/.test(month)) {
      return this.errorReply(`Invalid month: ${month}`);
    }
    const isOldMonth = month !== getMonth();
    if (isOldMonth && !await (0, import_lib.FS)(STATS_PATH.replace("{{MONTH}}", month)).exists()) {
      return this.errorReply(`There are no winrates for that month.`);
    }
    const formatTitle = Dex.formats.get(format).name;
    let buf = `<div class="pad"><h2>Winrates for ${formatTitle} (${month})</h2>`;
    const prevMonth = new Date(new Date(`${month}-15`).getTime() - 30 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 7);
    let hasButton = false;
    if (await (0, import_lib.FS)(STATS_PATH.replace("{{MONTH}}", prevMonth)).exists()) {
      buf += `<a class="button" href="/view-winrates-${format}--${sorter}--${prevMonth}">Previous month</a>`;
      hasButton = true;
    }
    const nextMonth = new Date(new Date(`${month}-15`).getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 7);
    if (await (0, import_lib.FS)(STATS_PATH.replace("{{MONTH}}", nextMonth)).exists()) {
      if (hasButton)
        buf += ` | `;
      buf += `<a class="button" href="/view-winrates-${format}--${sorter}--${nextMonth}">Next month</a>`;
      hasButton = true;
    }
    buf += hasButton ? ` | ` : "";
    const otherSort = sorter === "zscore" ? "Raw" : "Z-Score";
    buf += `<a class="button" target="replace" href="/view-winrates-${format}--${toID(otherSort)}--${month}">`;
    buf += `Sort by ${otherSort} descending</a>`;
    buf += `<hr />`;
    const statData = month === stats.month ? stats : JSON.parse(await (0, import_lib.FS)(STATS_PATH.replace("{{MONTH}}", month)).read());
    const formatData = statData.formats[format];
    if (!formatData) {
      buf += `<div class="message-error">No stats for that format found on that month.</div>`;
      return buf;
    }
    this.title = `[Winrates] [${format}] ${month}`;
    let sortFn;
    if (sorter === "zscore") {
      sortFn = ([_, data]) => [-getZScore(data), -data.timesGenerated];
    } else {
      sortFn = ([_, data]) => [
        -(data.numWins / data.timesGenerated),
        -data.numWins,
        -data.timesGenerated
      ];
    }
    const mons = import_lib.Utils.sortBy(Object.entries(formatData.mons), sortFn);
    buf += `<div class="ladder pad"><table><tr><th>Pokemon</th><th>Win %</th><th>Z-Score</th>`;
    buf += `<th>Raw wins</th><th>Times generated</th></tr>`;
    for (const [mon, data] of mons) {
      buf += `<tr><td>${Dex.species.get(mon).name}</td>`;
      const { timesGenerated, numWins } = data;
      buf += `<td>${(numWins / timesGenerated * 100).toFixed(2)}%</td>`;
      buf += `<td>${getZScore(data).toFixed(3)}</td>`;
      buf += `<td>${numWins}</td><td>${timesGenerated}</td>`;
      buf += `</tr>`;
    }
    buf += `</table></div></div>`;
    return buf;
  }
};
//# sourceMappingURL=winrates.js.map
