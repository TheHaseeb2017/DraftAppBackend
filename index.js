const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());
const fs = require("fs");
/*
const options = {
  key: fs.readFileSync('/etc/ssl/certs/server.key'),
  cert: fs.readFileSync('/etc/ssl/certs/server.crt')
};
*/
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      "http://localhost:3001" ||
      "https://main.daw28hi2j0ubv.amplifyapp.com/",
    methods: ["GET", "POST", "PUT"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("connectToDraft", (draftCode) => {
    if (isValidDraftCode(draftCode)) {
      socket.join(draftCode);
      console.log(`User ${socket.id} joined the draft: ${draftCode}`);
    } else {
      console.log("Invalid draft code");
    }

    socket.on("disconnect", () => {
      console.log(`User ${socket.id} disconnected`);
    });
    socket.on("updatePlayers", () => {
      socket.to(draftCode).emit("recUpdatedPlayers");
    });

    socket.on("updateDraftOrder", (updatedTeams) => {
      socket.to(draftCode).emit("recUpdatedDraftOrder", updatedTeams);
    });

    socket.on("updateIndex", (updatedIndex) => {
      socket.to(draftCode).emit("recUpdateIndex", updatedIndex);
    });

    socket.on("updateDraftStatus", (updatedDraftStatus) => {
      socket.to(draftCode).emit("recUpdateDraftStatus", updatedDraftStatus);
    });

    socket.on("updateDraftCom", (updatedStartButton) => {
      socket.to(draftCode).emit("recUpdateDraftCom", updatedStartButton);
    });

    socket.on("autoUpPlayer", () => {
      socket.to(draftCode).emit("recAutoUpPlayer");
    });

    socket.on("autoTimer", (emittedTimeLeft) => {
      socket.to(draftCode).emit("recAutoTimer", emittedTimeLeft);
    });
  });

  // Listen for events from the PlayersComponent
});

const isValidDraftCode = (draftCode) => {
  return true;
};

app.use(cors());

server.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on port 3000");
});

app.use(bodyParser.json());

const password = process.env.DB_PASSWORD || "Eagles17"; // Use the environment variable if set, fallback to a default value

const sequelize = new Sequelize("draft_app_db", "postgres", password, {
  host: "database-1.cv6iagsggit1.us-east-1.rds.amazonaws.com",
  dialect: "postgres",
});

const Draft = sequelize.define(
  "Draft",
  {
    draftid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    draftname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    draftcode: {
      type: DataTypes.STRING(6),
      unique: true,
    },
    draftdate: {
      type: DataTypes.DATE,
      allowNulll: false,
    },
    isactive: {
      type: DataTypes.BOOLEAN,
      defaultValue: "true ",
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "drafts",
    timestamps: false,
  }
);

const Team = sequelize.define(
  "Team",
  {
    teamid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    teamname: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    draftorder: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    draftcode: {
      type: DataTypes.STRING(6),
      allowNull: false,
      unique: true,
      references: {
        model: Draft,
        key: "draftcode",
      },
    },
  },
  {
    tableName: "teams",
    timestamps: false,
  }
);

const Player = sequelize.define(
  "Player",
  {
    playerid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    playername: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teamid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Team,
        key: "teamid",
      },
    },
    draftcode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      references: {
        model: Draft,
        key: "draftcode",
      },
    },
  },
  {
    tableName: "players",
    timestamps: false,
  }
);

// Player model
Player.belongsTo(Team, { foreignKey: "teamid" });

const DraftPick = sequelize.define(
  "DraftPick",
  {
    draftpickid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    draftcode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      references: {
        model: Draft,
        key: "draftcode",
      },
    },
    roundnumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    picknumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    playerid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Player,
        key: "playerid",
      },
    },
    teamid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Team,
        key: "teamid",
      },
    },
  },
  {
    tableName: "draftpicks",
    timestamps: false,
  }
);

DraftPick.belongsTo(Team, { foreignKey: "teamid" });
DraftPick.belongsTo(Player, { foreignKey: "playerid" });

Team.hasMany(Player, { constraints: false, foreignKey: "teamid" });

app.post("/drafts", async (req, res) => {
  try {
    const { draftname, draftdate, isactive, duration } = req.body;

    const newDraft = await Draft.create({
      draftname,
      draftdate,
      isactive,
      duration,
    });

    res.status(201).json(newDraft);
  } catch (error) {
    console.log("Error creating a new draft", error);
    res.status(500).json({ error: "Failed to create Draft" });
  }
});

app.post("/teams", async (req, res) => {
  try {
    const { teamname, draftorder, draftcode } = req.body;
    const newTeam = await Team.create({
      teamname,
      draftorder,
      draftcode,
    });

    res.status(201).json(newTeam);
  } catch (error) {
    console.log("Error create a new team: ", error);
    res.status(500).json({ error: "Failed to create team" });
  }
});

app.post("/play", async (req, res) => {
  try {
    const { playername, teamid, draftcode } = req.body;
    const newPlayer = await Player.create({
      playername,
      teamid,
      draftcode,
    });

    res.status(201).json(newPlayer);
  } catch (error) {
    console.log("Error creating a new player: ", error);
    res.status(500).json({ error: "Failed to create player" });
  }
});

app.post("/draftpicks", async (req, res) => {
  try {
    const { draftcode, roundnumber, picknumber, playerid, teamid } = req.body;

    const newDraftPick = await DraftPick.create({
      draftcode,
      roundnumber,
      playerid,
      picknumber,
      teamid,
    });

    res.status(201).json(newDraftPick);
  } catch (error) {
    console.log("Error creating a new draft pick", error);

    res.status(500).json({ error: "Failed to create new draft pick" });
  }
});

app.put("/player/addteam/:playerid", async (req, res) => {
  const { playerid } = req.params;
  const { teamid } = req.body;

  try {
    const player = await Player.findOne({ where: { playerid: playerid } });

    player.teamid = teamid;
    await player.save();
    res.json(player);
  } catch (error) {
    console.error("Error updating player's team: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/draftsetting/update/:draftcode", async (req, res) => {
  const { draftcode } = req.params;
  const { draftname, draftdate, duration, isactive } = req.body;

  try {
    const draft = await Draft.findOne({ where: { draftcode: draftcode } });

    draft.draftname = draftname;
    draft.draftdate = draftdate;
    draft.duration = duration;
    draft.isactive = isactive;
    await draft.save();
    res.json(draft);
  } catch (error) {
    console.error("Error updating draft's setting: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/player/notdrafted/:draftcode", async (req, res) => {
  const { draftcode } = req.params;

  try {
    const player = await Player.findAll({
      where: {
        teamid: null,
        draftcode: draftcode,
      },
    });

    res.json(player);
  } catch (error) {
    console.error("Error fetching palyers by draft code: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/teams/indraft/:draftcode", async (req, res) => {
  const { draftcode } = req.params;

  try {
    const team = await Team.findAll({
      where: {
        draftcode: draftcode,
      },
    });

    res.json(team);
  } catch (error) {
    console.error("Error fetching teams by draft code: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/teams/draftorder/:draftcode", async (req, res) => {
  const { draftcode } = req.params;

  try {
    const teams = await Team.findAll({
      where: {
        draftcode: draftcode,
      },
      order: [["draftorder", "ASC"]],
    });

    res.json(teams);
  } catch (error) {
    console.error("Error fetching draftorder by draft code: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/player/indraft/drafted/:draftcode", async (req, res) => {
  const { draftcode } = req.params;

  try {
    const player = await Player.findAll({
      where: {
        draftcode: draftcode,
        teamid: {
          [Sequelize.Op.not]: null,
        },
      },
    });

    res.json(player);
  } catch (error) {
    console.error("Error fetching drafted by draft code: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/player/indraft/:draftcode", async (req, res) => {
  const { draftcode } = req.params;

  try {
    const player = await Player.findAll({
      where: {
        draftcode: draftcode,
      },
    });

    res.json(player);
  } catch (error) {
    console.error("Error fetching players by draft code: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/drafts/validate/:draftcode", async (req, res) => {
  const { draftcode } = req.params;

  try {
    const draft = await Draft.findAll({
      where: {
        draftcode: draftcode,
      },
    });

    res.json(draft);
  } catch (error) {
    console.error("Error fetching by draft code: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/drafts/playerandteam/:draftcode", async (req, res) => {
  const { draftcode } = req.params;

  try {
    const draft = await Team.findAll({
      attributes: ["teamid", "teamname"],
      where: { draftcode: draftcode },
      include: [
        {
          model: Player,
          attributes: ["playerid", "playername", "teamid"],
          where: { draftcode: draftcode },
          required: false,
        },
      ],
    });

    res.json(draft);
  } catch (error) {
    console.error("Error fetching draft by draft code: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/drafts/playerwithteam/:draftcode", async (req, res) => {
  const { draftcode } = req.params;

  try {
    const draft = await Player.findAll({
      attributes: ["playerid", "playername", "teamid"],
      where: { draftcode: draftcode },
      include: [
        {
          model: Team,
          attributes: ["teamid", "teamname"],
        },
      ],
    });

    res.json(draft);
  } catch (error) {
    console.error("Error fetching draft by draft code: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/drafts/draftpicks/:draftcode", async (req, res) => {
  const { draftcode } = req.params;

  try {
    const draftPicks = await DraftPick.findAll({
      attributes: ["draftpickid", "roundnumber", "picknumber"],
      where: { draftcode: draftcode },
      include: [
        {
          model: Player,
          attributes: ["playername"],
        },
        {
          model: Team,
          attributes: ["teamname"],
        },
      ],
      order: [["picknumber", "ASC"]], // This line orders the results by roundnumber in ascending order
    });

    res.json(draftPicks);
  } catch (error) {
    console.error("Error fetching draft picks by draft code: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/delete-players", async (req, res) => {
  const { playerids } = req.body;

  try {
    const players = await Player.findAll({
      where: {
        playerid: playerids,
      },
    });

    if (players.length !== playerids.length) {
      return res
        .status(404)
        .json({ error: "One or more players not found " + playerids });
    }

    await Player.destroy({
      where: {
        playerid: playerids,
      },
    });
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting players:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
