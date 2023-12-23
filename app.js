const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const dbOjectToResponseObject = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayers = `
    SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayers);
  response.send(playersArray.map((player) => dbOjectToResponseObject(player)));
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerById = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};
    `;
  const player = await db.get(getPlayerById);
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  });
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayer = `
  UPDATE player_details
  SET 
  player_name = '${playerName}'
  WHERE player_id = ${playerId};
  `;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchById = `SELECT * FROM match_details
    WHERE match_id = ${matchId}`;
  const matchDetails = await db.get(getMatchById);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});
const dbResponseToObject = (matchDetails) => {
  return {
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  };
};
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const joinTablesQuery = `
    SELECT * FROM match_details
    NATURAL JOIN player_match_score;
    `;
  // WHERE player_id = ${playerId}
  const matchDetailsObj = await db.all(joinTablesQuery);

  response.send(
    matchDetailsObj.map((matchDetails) => dbResponseToObject(matchDetails))
  );
});
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getmatchDetails = `
    SELECT player_id,player_name FROM player_details
    NATURAL JOIN player_match_score
    WHERE match_id = ${matchId}
    GROUP BY player_id;`;
  const getMatch = await db.all(getmatchDetails);
  response.send(getMatch);
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getDetails = `
    SELECT player_id AS playerId,player_name AS playerName,SUM(score) AS totalScore, SUM(fours) AS totalFours ,SUM(sixes) AS totalSixes 
    FROM player_details NATURAL JOIN player_match_score
     WHERE player_id = 1;
    `;
  const playerSummary = await db.get(getDetails);
  response.send(playerSummary);
});

module.exports = app;
