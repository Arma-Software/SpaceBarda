/*
Copyright (C) 2021  torn.space (https://torn.space)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const MONGO_CONNECTION_STR = Config.getValue(`mongo_connection_string`, `mongodb://127.0.0.1:27017/torn`);
let PLAYER_DATABASE = null;
let TURRET_DATABASE = null;
const MongoClient = require(`mongodb`).MongoClient;
const Mongo = new MongoClient(MONGO_CONNECTION_STR, { useUnifiedTopology: true });
const Base = require(`./universe/base.js`);

// TODO: Implement failover in the event we lose connection
// to MongoDB
global.connectToDB = function () {
    if (PLAYER_DATABASE != null) {
        console.log(`[DB] Already connected to MongoDB database...`);
        return;
    }

    console.log(`[DB] Connecting to MongoDB instance @ ${MONGO_CONNECTION_STR}`);

    Mongo.connect((err, client) => {
        if (err) {
            console.log(`[DB] Connection failed! (ERROR: ${err})`);
            return;
        }

        const db = client.db(`torn`);
        PLAYER_DATABASE = db.collection(`players`);
        TURRET_DATABASE = db.collection(`turrets`);

        loadTurretData();
        console.log(`[DB] Connection successful!`);
        setTimeout(saveTurrets, 1000);
    });
};

global.handlePlayerDeath = async function (player, elo) {
    if (player.guest) return;

    const record = await PLAYER_DATABASE.findOne({ _id: player.name });

    if (record == null) return;

    // Certain variables should NOT be reverted
    const persist = [`lastLogin`, `planetsClaimed`, `lives`, `experience`, `rank`];
    for (const key in record) {
        if (key in persist) continue;

        player[key] = record[key];
    }

    player.experience *= 1 - playerKillExpFraction;
    player.money *= 1 - playerKillMoneyFraction;
    player.elo = elo;
};

global.loadPlayerData = async function (player) {
    const record = await PLAYER_DATABASE.findOne({ _id: player.name });

    for (const key in record) {
        if (key === `password` || key === `email`) continue; // don't load passwords into memory
        player[key] = record[key];
    }

    if (player.sx >= mapSz || player.sy >= mapSz || bases[player.sy][player.sx] === 0 || bases[player.sy][player.sx].color != player.color) {
        player.sx = baseMap[player.color][0];
        player.sy = baseMap[player.color][1];
    }

    if (!(player.guild in guildPlayers)) player.guild = ``; // This accounts for players with old/undefined guilds

    player.permissionLevels = [0];
    if (player.tag === `O`) player.permissionLevels.push(30);
    if (player.tag === `A`) player.permissionLevels.push(20);
    if (player.tag === `M`) player.permissionLevels.push(10);
    if (player.tag === `B`) player.permissionLevels.push(7);
    if (player.tag === `V`) player.permissionLevels.push(5);
    if (player.tag === `Y`) player.permissionLevels.push(3);

    return player;
};

global.saveTurret = function (turret) {
    const record = {
        id: turret.id,
        kills: turret.kills,
        experience: turret.experience,
        money: turret.money,
        color: turret.color,
        owner: turret.owner,
        x: turret.x,
        y: turret.y,
        sx: turret.sx,
        sy: turret.sy,
        baseType: turret.baseType,
        name: turret.name
    };
    TURRET_DATABASE.replaceOne({ _id: turret.id }, record, { upsert: true });
};

global.deleteTurret = function (turret) {
    TURRET_DATABASE.deleteOne({ _id: turret.id });
};

global.loadTurretData = async function () {
    console.log(`\nLoading Turrets...`);
    const items = await TURRET_DATABASE.find();
    if (items.sx >= mapSz || items.sy >= mapSz) {
        return;
    }

    items.forEach((i) => {
        const b = new Base(0, 0, 0, 0, 0, 0, 0);
        for (const x in i) {
            b[x] = i[x];
        }
        bases[b.sy][b.sx] = b;
        console.log(`Turret (${b.sy},${b.sx}) loaded!`);
    });
};

global.savePlayerEmail = function (player, email) {
    PLAYER_DATABASE.updateOne({ _id: player.name }, { $set: { email: email } }, { upsert: true });
};
global.savePlayerData = function (player) {
    const record = {
        color: player.color,
        elo: player.elo,
        ship: player.ship,
        weapons: player.weapons,
        tag: player.tag,
        trail: player.trail,
        money: player.money,
        kills: player.kills,
        planetsClaimed: player.planetsClaimed,
        iron: player.iron,
        silver: player.silver,
        platinum: player.platinum,
        copper: player.copper,
        aluminium: player.aluminium,
        experience: player.experience,
        rank: player.rank,
        thrust2: player.thrust2,
        radar2: player.radar2,
        agility2: player.agility2,
        capacity2: player.capacity2,
        maxHealth2: player.maxHealth2,
        energy2: player.energy2,
        killAchievements: player.killAchievements,
        baseKills: player.baseKills,
        oresMined: player.oresMined,
        moneyAchievements: player.moneyAchievements,
        questsDone: player.questsDone,
        driftTimer: player.driftTimer,
        driftAchievements: player.driftAchievements,
        cornersTouched: player.cornersTouched,
        lastLogin: player.lastLogin,
        randomAchievements: player.randomAchievements,
        lives: player.lives,
        guild: player.guild,
        sx: player.sx,
        sy: player.sy
    };
    PLAYER_DATABASE.updateOne({ _id: player.name }, { $set: record }, { upsert: true });
};
