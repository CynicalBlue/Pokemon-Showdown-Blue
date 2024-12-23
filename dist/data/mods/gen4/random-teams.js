"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var random_teams_exports = {};
__export(random_teams_exports, {
  RandomGen4Teams: () => RandomGen4Teams,
  default: () => random_teams_default
});
module.exports = __toCommonJS(random_teams_exports);
var import_random_teams = __toESM(require("../gen5/random-teams"));
var import_lib = require("../../../lib");
var import_dex = require("../../../sim/dex");
const SetupException = ["dracometeor", "overheat"];
const recoveryMoves = [
  "healorder",
  "milkdrink",
  "moonlight",
  "morningsun",
  "painsplit",
  "recover",
  "rest",
  "roost",
  "slackoff",
  "softboiled",
  "synthesis",
  "wish"
];
const defensiveStatusMoves = ["aromatherapy", "haze", "healbell", "roar", "whirlwind", "willowisp", "yawn"];
class RandomGen4Teams extends import_random_teams.default {
  constructor(format, prng) {
    super(format, prng);
    this.randomData = require("./random-data.json");
    this.moveEnforcementCheckers = {
      Bug: (movePool, moves, abilities, types, counter) => movePool.includes("bugbuzz") || movePool.includes("megahorn"),
      Dark: (movePool, moves, abilities, types, counter) => !counter.get("damage") && (!counter.get("Dark") || counter.get("Dark") < 2 && moves.has("pursuit") && movePool.includes("suckerpunch")),
      Dragon: (movePool, moves, abilities, types, counter) => !counter.get("Dragon"),
      Electric: (movePool, moves, abilities, types, counter) => !counter.get("Electric"),
      Fighting: (movePool, moves, abilities, types, counter) => !counter.get("Fighting") && (!!counter.setupType || !counter.get("Status") || movePool.includes("closecombat") || movePool.includes("highjumpkick")),
      Fire: (movePool, moves, abilities, types, counter) => !counter.get("Fire"),
      Flying: (movePool, moves, abilities, types, counter) => !counter.get("Flying") && (counter.setupType !== "Special" && movePool.includes("bravebird") || abilities.has("Serene Grace") && movePool.includes("airslash")),
      Grass: (movePool, moves, abilities, types, counter) => !counter.get("Grass") && ["leafblade", "leafstorm", "seedflare", "woodhammer"].some((m) => movePool.includes(m)),
      Ground: (movePool, moves, abilities, types, counter) => !counter.get("Ground"),
      Ice: (movePool, moves, abilities, types, counter) => !counter.get("Ice") && (!types.has("Water") || !counter.get("Water")),
      Rock: (movePool, moves, abilities, types, counter) => !counter.get("Rock") && (movePool.includes("headsmash") || movePool.includes("stoneedge")),
      Steel: (movePool, moves, abilities, types, counter) => !counter.get("Steel") && movePool.includes("meteormash"),
      Water: (movePool, moves, abilities, types, counter) => !counter.get("Water") && (moves.has("raindance") || !types.has("Ice") || !counter.get("Ice")),
      Adaptability: (movePool, moves, abilities, types, counter, species) => !counter.setupType && species.types.length > 1 && (!counter.get(species.types[0]) || !counter.get(species.types[1])),
      Guts: (movePool, moves, abilities, types) => types.has("Normal") && movePool.includes("facade"),
      "Slow Start": (movePool) => movePool.includes("substitute"),
      protect: (movePool) => movePool.includes("wish"),
      wish: (movePool) => movePool.includes("protect")
    };
  }
  shouldCullMove(move, types, moves, abilities, counter, movePool, teamDetails, species, isLead) {
    const restTalk = moves.has("rest") && moves.has("sleeptalk");
    switch (move.id) {
      case "batonpass":
        return { cull: !counter.setupType && !counter.get("speedsetup") && !moves.has("substitute") };
      case "eruption":
      case "waterspout":
        return { cull: counter.get("Physical") + counter.get("Special") < 4 };
      case "focuspunch":
        return { cull: !moves.has("substitute") || counter.damagingMoves.size < 2 || moves.has("hammerarm") };
      case "lightscreen":
        if (movePool.length > 1) {
          const screen = movePool.indexOf("reflect");
          if (screen >= 0) {
            this.fastPop(movePool, screen);
            return { cull: true };
          }
        }
        return { cull: false };
      case "raindance":
        return { cull: abilities.has("Hydration") ? !moves.has("rest") : counter.get("Physical") + counter.get("Special") < 2 };
      case "reflect":
        if (movePool.length > 1) {
          const screen = movePool.indexOf("lightscreen");
          if (screen >= 0) {
            this.fastPop(movePool, screen);
            return { cull: true };
          }
        }
        return { cull: false };
      case "refresh":
        return { cull: !(moves.has("calmmind") && (moves.has("recover") || moves.has("roost"))) };
      case "rest":
        return { cull: movePool.includes("sleeptalk") || abilities.has("Hydration") && !moves.has("raindance") || moves.has("reflect") && moves.has("lightscreen") };
      case "sleeptalk":
        if (movePool.length > 1) {
          const rest = movePool.indexOf("rest");
          if (rest >= 0)
            this.fastPop(movePool, rest);
        }
        return { cull: !moves.has("rest") };
      case "sunnyday":
        return { cull: !moves.has("solarbeam") };
      case "weatherball":
        return { cull: !moves.has("raindance") && !moves.has("sunnyday") };
      case "bellydrum":
      case "bulkup":
      case "curse":
      case "dragondance":
      case "swordsdance":
        const notEnoughPhysicalMoves = counter.get("Physical") + counter.get("physicalpool") < 2 && !moves.has("batonpass") && (!moves.has("rest") || !moves.has("sleeptalk"));
        const badPhysicalMoveset = counter.setupType !== "Physical" || counter.get("physicalsetup") > 1;
        return { cull: moves.has("sunnyday") || notEnoughPhysicalMoves || badPhysicalMoveset, isSetup: true };
      case "calmmind":
      case "nastyplot":
      case "tailglow":
        const notEnoughSpecialMoves = counter.get("Special") + counter.get("specialpool") < 2 && !moves.has("batonpass") && (!moves.has("rest") || !moves.has("sleeptalk"));
        const badSpecialMoveset = counter.setupType !== "Special" || counter.get("specialsetup") > 1;
        return { cull: notEnoughSpecialMoves || badSpecialMoveset, isSetup: true };
      case "agility":
      case "rockpolish":
        return { cull: restTalk || counter.damagingMoves.size < 2 && !moves.has("batonpass"), isSetup: !counter.setupType };
      case "destinybond":
        return { cull: !!counter.setupType || moves.has("explosion") };
      case "explosion":
      case "selfdestruct":
        return { cull: counter.setupType === "Special" || Array.from(moves).some((id) => recoveryMoves.includes(id) || defensiveStatusMoves.includes(id)) || ["batonpass", "protect", "substitute"].some((m) => moves.has(m)) };
      case "foresight":
      case "roar":
      case "whirlwind":
        return { cull: !!counter.setupType && !abilities.has("Speed Boost") };
      case "healingwish":
      case "lunardance":
        return { cull: !!counter.setupType || moves.has("rest") || moves.has("substitute") };
      case "protect":
        return { cull: ["rest", "softboiled"].some((m) => moves.has(m)) || !["Guts", "Quick Feet", "Speed Boost"].some((abil) => abilities.has(abil)) && !["toxic", "wish"].some((m) => moves.has(m)) };
      case "wish":
        return { cull: !["batonpass", "ironhead", "moonlight", "protect", "softboiled", "uturn"].some((m) => moves.has(m)) && !movePool.includes("protect") };
      case "moonlight":
        return { cull: moves.has("wish") && (moves.has("protect") || movePool.includes("protect")) };
      case "rapidspin":
        return { cull: !!teamDetails.rapidSpin || !!counter.setupType && counter.get("Physical") + counter.get("Special") < 2 };
      case "fakeout":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("substitute") };
      case "spikes":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("substitute") };
      case "stealthrock":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("rest") || moves.has("substitute") || !!teamDetails.stealthRock };
      case "switcheroo":
      case "trick":
        return { cull: counter.get("Physical") + counter.get("Special") < 3 || !!counter.setupType || ["fakeout", "lightscreen", "reflect", "suckerpunch", "trickroom"].some((m) => moves.has(m)) };
      case "toxic":
      case "toxicspikes":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || !!teamDetails.toxicSpikes || moves.has("willowisp") };
      case "trickroom":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || counter.damagingMoves.size < 2 || moves.has("lightscreen") || moves.has("reflect") || restTalk };
      case "uturn":
        return { cull: abilities.has("Speed Boost") && moves.has("protect") || !!counter.setupType || !!counter.get("speedsetup") || moves.has("batonpass") || moves.has("substitute") };
      case "bodyslam":
      case "slash":
        return { cull: moves.has("facade") || moves.has("return") };
      case "bugbite":
        return { cull: moves.has("uturn") };
      case "doubleedge":
        return { cull: ["bodyslam", "facade", "return"].some((m) => moves.has(m)) };
      case "endeavor":
        return { cull: !isLead };
      case "facade":
        return { cull: moves.has("substitute") };
      case "headbutt":
        return { cull: !moves.has("bodyslam") && !moves.has("thunderwave") };
      case "swift":
        return { cull: counter.setupType !== "Special" };
      case "quickattack":
        return { cull: moves.has("thunderwave") };
      case "firepunch":
      case "flamethrower":
        return { cull: moves.has("fireblast") || moves.has("overheat") && !counter.setupType };
      case "flareblitz":
        return { cull: moves.has("superpower") && !!counter.get("speedsetup") };
      case "lavaplume":
      case "fireblast":
        if (move.id === "fireblast" && moves.has("lavaplume") && !counter.get("speedsetup"))
          return { cull: true };
        if (move.id === "lavaplume" && moves.has("fireblast") && counter.get("speedsetup"))
          return { cull: true };
        if (moves.has("flareblitz") && counter.setupType !== "Special" && (!moves.has("superpower") || !counter.get("speedsetup")))
          return { cull: true };
        break;
      case "overheat":
        return { cull: counter.setupType === "Special" || ["batonpass", "fireblast", "flareblitz"].some((m) => moves.has(m)) };
      case "aquajet":
        return { cull: moves.has("dragondance") || moves.has("waterfall") && counter.get("Physical") < 3 };
      case "hydropump":
        return { cull: moves.has("surf") };
      case "waterfall":
        return { cull: moves.has("aquatail") || counter.setupType !== "Physical" && (moves.has("hydropump") || moves.has("surf")) };
      case "chargebeam":
        return { cull: moves.has("thunderbolt") && counter.get("Special") < 3 };
      case "discharge":
        return { cull: moves.has("thunderbolt") };
      case "energyball":
        return { cull: moves.has("woodhammer") || moves.has("sunnyday") && moves.has("solarbeam") || moves.has("leafstorm") && counter.get("Physical") + counter.get("Special") < 4 };
      case "grassknot":
      case "leafblade":
      case "seedbomb":
        return { cull: moves.has("woodhammer") || moves.has("sunnyday") && moves.has("solarbeam") };
      case "leafstorm":
        return { cull: !!counter.setupType || moves.has("batonpass") || moves.has("powerwhip") || moves.has("leafblade") || moves.has("sunnyday") && moves.has("solarbeam") };
      case "solarbeam":
        return { cull: counter.setupType === "Physical" || !moves.has("sunnyday") };
      case "icepunch":
        return { cull: !counter.setupType && moves.has("icebeam") };
      case "aurasphere":
      case "drainpunch":
      case "focusblast":
        return { cull: moves.has("closecombat") && counter.setupType !== "Special" };
      case "brickbreak":
      case "closecombat":
      case "crosschop":
      case "lowkick":
        return { cull: moves.has("substitute") && moves.has("focuspunch") };
      case "machpunch":
        return { cull: counter.damagingMoves.size <= counter.get("Fighting") };
      case "seismictoss":
        return { cull: moves.has("nightshade") || counter.get("Physical") + counter.get("Special") >= 1 };
      case "superpower":
        return { cull: moves.has("dragondance") || !!counter.get("speedsetup") && !types.has("Fighting") };
      case "gunkshot":
        return { cull: moves.has("poisonjab") };
      case "earthpower":
        return { cull: moves.has("earthquake") };
      case "airslash":
        return { cull: !counter.setupType && moves.has("bravebird") };
      case "zenheadbutt":
        return { cull: moves.has("psychocut") };
      case "rockblast":
      case "rockslide":
        return { cull: moves.has("stoneedge") };
      case "shadowclaw":
      case "shadowsneak":
        return { cull: moves.has("suckerpunch") && !types.has("Ghost") };
      case "dracometeor":
        return { cull: moves.has("calmmind") || restTalk || !!counter.setupType && counter.get("stab") < 2 };
      case "dragonclaw":
        return { cull: moves.has("outrage") };
      case "dragonpulse":
        return { cull: moves.has("dracometeor") || moves.has("outrage") };
      case "crunch":
      case "nightslash":
        return { cull: moves.has("suckerpunch") && !types.has("Dark") };
      case "pursuit":
        return { cull: !!counter.setupType || moves.has("payback") };
      case "flashcannon":
        return { cull: (moves.has("ironhead") || movePool.includes("ironhead")) && counter.setupType !== "Special" };
      case "encore":
        return { cull: ["roar", "taunt", "whirlwind"].some((m) => moves.has(m)) || restTalk };
      case "haze":
      case "taunt":
        return { cull: restTalk };
      case "healbell":
        return { cull: moves.has("reflect") && moves.has("lightscreen") };
      case "leechseed":
      case "painsplit":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("rest") };
      case "recover":
      case "slackoff":
        return { cull: restTalk };
      case "stunspore":
        return { cull: !!counter.setupType || moves.has("toxic") || movePool.includes("sleeppowder") || movePool.includes("spore") };
      case "substitute":
        return { cull: ["lightscreen", "pursuit", "rapidspin", "reflect", "rest", "taunt"].some((m) => moves.has(m)) };
      case "thunderwave":
        return { cull: !!counter.setupType || moves.has("toxic") || moves.has("trickroom") || moves.has("bodyslam") && abilities.has("Serene Grace") };
      case "yawn":
        return { cull: moves.has("thunderwave") || moves.has("toxic") };
    }
    return { cull: false };
  }
  shouldCullAbility(ability, types, moves, abilities, counter, movePool, teamDetails, species) {
    switch (ability) {
      case "Anger Point":
      case "Ice Body":
      case "Steadfast":
      case "Unaware":
        return true;
      case "Blaze":
        return !counter.get("Fire");
      case "Chlorophyll":
        return !moves.has("sunnyday") && !teamDetails.sun;
      case "Compound Eyes":
      case "No Guard":
        return !counter.get("inaccurate");
      case "Early Bird":
        return !moves.has("rest");
      case "Gluttony":
        return !moves.has("bellydrum");
      case "Hustle":
        return counter.get("Physical") < 2;
      case "Mold Breaker":
        return !moves.has("earthquake");
      case "Overgrow":
        return !counter.get("Grass");
      case "Reckless":
      case "Rock Head":
        return !counter.get("recoil");
      case "Sand Veil":
        return !teamDetails.sand;
      case "Serene Grace":
        return !counter.get("serenegrace") || species.id === "blissey";
      case "Simple":
        return !counter.setupType && !moves.has("cosmicpower");
      case "Skill Link":
        return !counter.get("skilllink");
      case "Snow Cloak":
        return !teamDetails.hail;
      case "Solar Power":
        return !counter.get("Special") || !moves.has("sunnyday") && !teamDetails.sun;
      case "Speed Boost":
        return moves.has("uturn");
      case "Swift Swim":
        return !moves.has("raindance") && !teamDetails.rain;
      case "Swarm":
        return !counter.get("Bug");
      case "Synchronize":
        return counter.get("Status") < 2;
      case "Technician":
        return !counter.get("technician") || moves.has("toxic");
      case "Thick Fat":
        return (moves.has("facade") || moves.has("fakeout")) && abilities.has("Guts");
      case "Tinted Lens":
        return moves.has("protect");
      case "Torrent":
        return !counter.get("Water");
    }
    return false;
  }
  getHighPriorityItem(ability, types, moves, counter, teamDetails, species, isLead) {
    if (species.requiredItem)
      return species.requiredItem;
    if (species.requiredItems)
      return this.sample(species.requiredItems);
    if (species.name === "Ditto")
      return this.sample(["Salac Berry", "Sitrus Berry"]);
    if (species.name === "Farfetch\u2019d" && counter.get("Physical") < 4)
      return "Stick";
    if (species.name === "Latias" || species.name === "Latios")
      return "Soul Dew";
    if (species.name === "Marowak")
      return "Thick Club";
    if (species.name === "Pikachu")
      return "Light Ball";
    if (species.name === "Shedinja" || species.name === "Smeargle")
      return "Focus Sash";
    if (species.name === "Unown")
      return "Choice Specs";
    if (species.name === "Wobbuffet") {
      return moves.has("destinybond") ? "Custap Berry" : this.sample(["Leftovers", "Sitrus Berry"]);
    }
    if (moves.has("switcheroo") || moves.has("trick")) {
      if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter.get("priority") && this.randomChance(2, 3)) {
        return "Choice Scarf";
      } else {
        return counter.get("Physical") > counter.get("Special") ? "Choice Band" : "Choice Specs";
      }
    }
    if (moves.has("bellydrum"))
      return "Sitrus Berry";
    if (ability === "Magic Guard" || ability === "Speed Boost" && counter.get("Status") < 2)
      return "Life Orb";
    if (ability === "Poison Heal" || ability === "Toxic Boost")
      return "Toxic Orb";
    if (moves.has("rest") && !moves.has("sleeptalk") && ability !== "Natural Cure" && ability !== "Shed Skin") {
      return moves.has("raindance") && ability === "Hydration" ? "Damp Rock" : "Chesto Berry";
    }
    if (moves.has("raindance") && ability === "Swift Swim" && counter.get("Status") < 2)
      return "Life Orb";
    if (moves.has("sunnyday"))
      return ability === "Chlorophyll" && counter.get("Status") < 2 ? "Life Orb" : "Heat Rock";
    if (moves.has("lightscreen") && moves.has("reflect"))
      return "Light Clay";
    if ((ability === "Guts" || ability === "Quick Feet") && moves.has("facade"))
      return "Toxic Orb";
    if (ability === "Unburden")
      return "Sitrus Berry";
    if (species.baseStats.hp + species.baseStats.def + species.baseStats.spd <= 150) {
      return isLead ? "Focus Sash" : "Life Orb";
    }
    if (moves.has("endeavor"))
      return "Focus Sash";
  }
  getMediumPriorityItem(ability, moves, counter, species, isDoubles, isLead) {
    if (ability === "Slow Start" || ["curse", "leechseed", "protect", "roar", "sleeptalk", "whirlwind"].some((m) => moves.has(m)) || ability === "Serene Grace" && ["bodyslam", "headbutt", "ironhead"].some((m) => moves.has(m))) {
      return "Leftovers";
    }
    if (counter.get("Physical") >= 4 && !moves.has("fakeout") && !moves.has("rapidspin") && !moves.has("suckerpunch")) {
      return species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter.get("priority") && !moves.has("bodyslam") && this.randomChance(2, 3) ? "Choice Scarf" : "Choice Band";
    }
    if ((counter.get("Special") >= 4 || counter.get("Special") >= 3 && ["batonpass", "uturn", "waterspout", "selfdestruct"].some((m) => moves.has(m))) && !moves.has("chargebeam")) {
      return species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && ability !== "Speed Boost" && !counter.get("priority") && this.randomChance(2, 3) ? "Choice Scarf" : "Choice Specs";
    }
    if (moves.has("outrage") && counter.setupType)
      return "Lum Berry";
    if (moves.has("substitute")) {
      return counter.damagingMoves.size < 2 || !counter.get("drain") && (counter.damagingMoves.size < 3 || species.baseStats.hp >= 60 || species.baseStats.def + species.baseStats.spd >= 180) ? "Leftovers" : "Life Orb";
    }
    if (ability === "Guts")
      return "Toxic Orb";
    if (isLead && !counter.get("recoil") && !Array.from(moves).some((id) => !!recoveryMoves.includes(id)) && species.baseStats.hp + species.baseStats.def + species.baseStats.spd < 225) {
      return "Focus Sash";
    }
    if (counter.get("Dark") >= 3)
      return "Black Glasses";
    if (counter.damagingMoves.size >= 4) {
      return counter.get("Normal") || counter.get("Dragon") > 1 || moves.has("chargebeam") || moves.has("suckerpunch") ? "Life Orb" : "Expert Belt";
    }
    if (counter.damagingMoves.size >= 3 && !moves.has("superfang") && !moves.has("metalburst")) {
      const totalBulk = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;
      return counter.get("speedsetup") || counter.get("priority") || moves.has("dragondance") || moves.has("trickroom") || totalBulk < 235 || species.baseStats.spe >= 70 && (totalBulk < 260 || !!counter.get("recovery") && totalBulk < 285) ? "Life Orb" : "Leftovers";
    }
  }
  getLowPriorityItem(ability, types, moves, abilities, counter, teamDetails, species) {
    if (types.has("Poison"))
      return "Black Sludge";
    if (this.dex.getEffectiveness("Rock", species) >= 1 || moves.has("roar"))
      return "Leftovers";
    if (counter.get("Status") <= 1 && ["metalburst", "rapidspin", "superfang"].every((m) => !moves.has(m)))
      return "Life Orb";
    return "Leftovers";
  }
  randomSet(species, teamDetails = {}, isLead = false) {
    species = this.dex.species.get(species);
    let forme = species.name;
    if (typeof species.battleOnly === "string")
      forme = species.battleOnly;
    if (species.cosmeticFormes) {
      forme = this.sample([species.name].concat(species.cosmeticFormes));
    }
    const data = this.randomData[species.id];
    const movePool = (data.moves || Object.keys(this.dex.species.getLearnset(species.id))).slice();
    const rejectedPool = [];
    const moves = /* @__PURE__ */ new Set();
    let ability = "";
    let item;
    const evs = { hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85 };
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    const types = new Set(species.types);
    const abilities = new Set(Object.values(species.abilities));
    let availableHP = 0;
    for (const setMoveid of movePool) {
      if (setMoveid.startsWith("hiddenpower"))
        availableHP++;
    }
    let counter;
    let hasHiddenPower = false;
    do {
      while (moves.size < this.maxMoveCount && movePool.length) {
        const moveid = this.sampleNoReplace(movePool);
        if (moveid.startsWith("hiddenpower")) {
          availableHP--;
          if (hasHiddenPower)
            continue;
          hasHiddenPower = true;
        }
        moves.add(moveid);
      }
      while (moves.size < this.maxMoveCount && rejectedPool.length) {
        const moveid = this.sampleNoReplace(rejectedPool);
        if (moveid.startsWith("hiddenpower")) {
          if (hasHiddenPower)
            continue;
          hasHiddenPower = true;
        }
        moves.add(moveid);
      }
      counter = this.queryMoves(moves, species.types, abilities, movePool);
      if (types.has("Dark") && moves.has("suckerpunch") && species.types.length === 1) {
        counter.add("stab");
      }
      for (const moveid of moves) {
        const move = this.dex.moves.get(moveid);
        let { cull, isSetup } = this.shouldCullMove(
          move,
          types,
          moves,
          abilities,
          counter,
          movePool,
          teamDetails,
          species,
          isLead
        );
        if (move.priority !== 0 && !!counter.get("speedsetup"))
          cull = true;
        if (move.category === "Physical" && counter.setupType === "Special" || move.category === "Special" && counter.setupType === "Physical") {
          if (!SetupException.includes(moveid) && (!types.has(move.type) || counter.get("stab") > 1 || counter.get(move.category) < 2)) {
            cull = true;
          }
        }
        if (counter.setupType && !isSetup && move.category !== counter.setupType && counter.get(counter.setupType) < 2 && !moves.has("batonpass")) {
          if (moveid !== "rest" && moveid !== "sleeptalk" && !(recoveryMoves.includes(moveid) && (moves.has("healbell") || moves.has("refresh"))) && !((moveid === "healbell" || moveid === "refresh") && Array.from(moves).some((id) => recoveryMoves.includes(id))) && // Reject Status moves only if there is nothing else to reject
          (move.category !== "Status" || counter.get(counter.setupType) + counter.get("Status") > 3 && counter.get("physicalsetup") + counter.get("specialsetup") < 2)) {
            cull = true;
          }
        }
        if (moveid === "hiddenpower" && counter.setupType === "Special" && species.types.length > 1 && counter.get("Special") <= 2 && !types.has(move.type) && !counter.get("Physical") && counter.get("specialpool") && !(types.has("Ghost") && move.type === "Fighting" || types.has("Electric") && move.type === "Ice")) {
          cull = true;
        }
        if (!Array.from(moves).some((id) => recoveryMoves.includes(id)) && movePool.some((id) => recoveryMoves.includes(id)) && (defensiveStatusMoves.includes(moveid) || moveid === "toxic" && (counter.get("Status") > 1 && !moves.has("protect") || counter.get("Status") > 2))) {
          cull = true;
        }
        const runEnforcementChecker = (checkerName) => {
          if (!this.moveEnforcementCheckers[checkerName])
            return false;
          return this.moveEnforcementCheckers[checkerName](
            movePool,
            moves,
            abilities,
            types,
            counter,
            species,
            teamDetails
          );
        };
        const moveIsRejectable = !move.weather && !move.damage && (move.category !== "Status" || !move.flags.heal) && (move.category === "Status" || !types.has(move.type) || move.basePower && move.basePower < 40 && !move.multihit) && // These moves cannot be rejected in favor of a forced move
        !["judgment", "lightscreen", "reflect", "sleeptalk"].includes(moveid) && (counter.get("physicalsetup") + counter.get("specialsetup") < 2 && (!counter.setupType || counter.setupType === "Mixed" || move.category !== counter.setupType && move.category !== "Status" || counter.get(counter.setupType) + counter.get("Status") > 3));
        if (!cull && !isSetup && moveIsRejectable) {
          const canRollForcedMoves = (
            // These moves should always be rolled
            movePool.includes("spore") || !Array.from(moves).some((id) => recoveryMoves.includes(id)) && (movePool.includes("softboiled") && !moves.has("explosion") || species.baseSpecies === "Arceus" && movePool.includes("recover"))
          );
          const requiresStab = !counter.get("stab") && !counter.get("damage") && (species.types.length > 1 || species.types[0] !== "Normal" && species.types[0] !== "Psychic" || !moves.has("icebeam") || species.baseStats.spa >= species.baseStats.spd);
          if (canRollForcedMoves || requiresStab || species.requiredMove && movePool.includes((0, import_dex.toID)(species.requiredMove)) || counter.get("defensesetup") && !counter.get("recovery") && !moves.has("rest")) {
            cull = true;
          } else {
            for (const type of types) {
              if (runEnforcementChecker(type))
                cull = true;
            }
            for (const abil of abilities) {
              if (runEnforcementChecker(abil))
                cull = true;
            }
            for (const m of moves) {
              if (runEnforcementChecker(m))
                cull = true;
            }
          }
        }
        if (moveid === "rest" && cull) {
          const sleeptalk = movePool.indexOf("sleeptalk");
          if (sleeptalk >= 0) {
            if (movePool.length < 2) {
              cull = false;
            } else {
              this.fastPop(movePool, sleeptalk);
            }
          }
        }
        if (cull && (movePool.length - availableHP || availableHP && (moveid.startsWith("hiddenpower") || !hasHiddenPower))) {
          if (move.category !== "Status" && (!moveid.startsWith("hiddenpower") || !availableHP))
            rejectedPool.push(moveid);
          moves.delete(moveid);
          if (moveid.startsWith("hiddenpower"))
            hasHiddenPower = false;
          break;
        }
        if (cull && rejectedPool.length) {
          moves.delete(moveid);
          if (moveid.startsWith("hiddenpower"))
            hasHiddenPower = false;
          break;
        }
      }
    } while (moves.size < this.maxMoveCount && (movePool.length || rejectedPool.length));
    if (hasHiddenPower) {
      let hpType;
      for (const move of moves) {
        if (move.startsWith("hiddenpower")) {
          hpType = move.substr(11);
          break;
        }
      }
      if (!hpType)
        throw new Error(`hasHiddenPower is true, but no Hidden Power move was found.`);
      const HPivs = this.dex.types.get(hpType).HPivs;
      let iv;
      for (iv in HPivs) {
        ivs[iv] = HPivs[iv];
      }
    }
    const abilityData = Array.from(abilities).map((a) => this.dex.abilities.get(a));
    import_lib.Utils.sortBy(abilityData, (abil) => -abil.rating);
    let ability0 = abilityData[0];
    let ability1 = abilityData[1];
    if (abilityData[1]) {
      if (ability0.rating <= ability1.rating && this.randomChance(1, 2)) {
        [ability0, ability1] = [ability1, ability0];
      } else if (ability0.rating - 0.6 <= ability1.rating && this.randomChance(2, 3)) {
        [ability0, ability1] = [ability1, ability0];
      }
      ability = ability0.name;
      while (this.shouldCullAbility(ability, types, moves, abilities, counter, movePool, teamDetails, species)) {
        if (ability === ability0.name && ability1.rating >= 1) {
          ability = ability1.name;
        } else {
          ability = abilityData[0].name;
          break;
        }
      }
      if (abilities.has("Hydration") && moves.has("raindance") && moves.has("rest")) {
        ability = "Hydration";
      } else if (abilities.has("Swift Swim") && moves.has("raindance")) {
        ability = "Swift Swim";
      } else if (abilities.has("Technician") && moves.has("machpunch") && types.has("Fighting") && counter.get("stab") < 2) {
        ability = "Technician";
      }
    } else {
      ability = ability0.name;
    }
    item = this.getHighPriorityItem(ability, types, moves, counter, teamDetails, species, isLead);
    if (item === void 0)
      item = this.getMediumPriorityItem(ability, moves, counter, species, false, isLead);
    if (item === void 0) {
      item = this.getLowPriorityItem(ability, types, moves, abilities, counter, teamDetails, species);
    }
    if (item === "Leftovers" && types.has("Poison")) {
      item = "Black Sludge";
    }
    const level = this.adjustLevel || data.level || (species.nfe ? 90 : 80);
    let hp = Math.floor(
      Math.floor(
        2 * species.baseStats.hp + (ivs.hp || 31) + Math.floor(evs.hp / 4) + 100
      ) * level / 100 + 10
    );
    if (moves.has("substitute") && item === "Sitrus Berry") {
      while (hp % 4 > 0) {
        evs.hp -= 4;
        hp = Math.floor(
          Math.floor(
            2 * species.baseStats.hp + (ivs.hp || 31) + Math.floor(evs.hp / 4) + 100
          ) * level / 100 + 10
        );
      }
    } else if (moves.has("bellydrum") && item === "Sitrus Berry") {
      if (hp % 2 > 0)
        evs.hp -= 4;
    } else {
      const srWeakness = this.dex.getEffectiveness("Rock", species);
      if (srWeakness > 0 && hp % (4 / srWeakness) === 0)
        evs.hp -= 4;
    }
    if (!counter.get("Physical") && !moves.has("transform")) {
      evs.atk = 0;
      ivs.atk = hasHiddenPower ? (ivs.atk || 31) - 28 : 0;
    }
    if (["gyroball", "metalburst", "trickroom"].some((m) => moves.has(m))) {
      evs.spe = 0;
      ivs.spe = hasHiddenPower ? (ivs.spe || 31) - 28 : 0;
    }
    return {
      name: species.baseSpecies,
      species: forme,
      gender: species.gender,
      shiny: this.randomChance(1, 1024),
      moves: Array.from(moves),
      ability,
      evs,
      ivs,
      item,
      level
    };
  }
}
var random_teams_default = RandomGen4Teams;
//# sourceMappingURL=random-teams.js.map