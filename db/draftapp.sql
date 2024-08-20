CREATE TABLE
    Drafts (
        DraftID SERIAL PRIMARY KEY,
        DraftName VARCHAR(50) NOT NULL,
        DraftCode VARCHAR(6) UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 6),
        DraftDate DATE NOT NULL,
        Duration INT NOT NULL, 
        IsActive BOOLEAN DEFAULT true
    );

CREATE TABLE
    Teams (
        TeamID SERIAL PRIMARY KEY,
        TeamName VARCHAR(50) NOT NULL,
        DraftCode VARCHAR(6)  NOT NULL,
        TeamCode VARCHAR(6) UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 6), 
        CanDraft BOOLEAN DEFAULT false,
        DraftOrder INT NOT NULL, 
        FOREIGN KEY (DraftCode) REFERENCES Drafts (DraftCode) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    Players (
        PlayerID SERIAL PRIMARY KEY,
        PlayerName VARCHAR(50) NOT NULL,
        TeamID INT,
        DraftCode VARCHAR(6)  NOT NULL,
        FOREIGN KEY (TeamID) REFERENCES Teams (TeamID) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (DraftCode) REFERENCES Drafts (DraftCode) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    DraftPicks (
        DraftPickID SERIAL PRIMARY KEY,
        DraftCode VARCHAR(6)  NOT NULL,
        RoundNumber INT,
        PickNumber INT,
        PlayerID INT,
        TeamID INT,
        FOREIGN KEY (DraftCode) REFERENCES Drafts (DraftCode) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (PlayerID) REFERENCES Players (PlayerID) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (TeamID) REFERENCES Teams (TeamID) ON DELETE CASCADE ON UPDATE CASCADE
    );