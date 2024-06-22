CREATE TABLE IF NOT EXISTS Users (
    "UserID" NVARCHAR(36) PRIMARY KEY NOT NULL,
    "Username" NVARCHAR NOT NULL,
    "Password" NVARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS Credentials (
    "CredentialID" NVARCHAR(36) PRIMARY KEY NOT NULL,
    "UserID" NVARCHAR(36) NOT NULL,
    "Description" NVARCHAR NULL,
    "Url" NVARCHAR NULL,
    "Username" NVARCHAR NULL,
    "Password" NVARCHAR NULL,
    "Notes" NVARCHAR NULL,
    "UserDefined1" NVARCHAR NULL,
    "UserDefined1Label" NVARCHAR NULL,
    "UserDefined2" NVARCHAR NULL,
    "UserDefined2Label" NVARCHAR NULL,
    "PwdOptions" NVARCHAR NULL,
    FOREIGN KEY ("UserID") REFERENCES Users ("UserID")
);

CREATE TABLE IF NOT EXISTS Tags (
    "TagID" NVARCHAR(36) PRIMARY KEY NOT NULL,
    "UserID" NVARCHAR(36) NOT NULL,
    "Label" NVARCHAR(64) NOT NULL,
    FOREIGN KEY ("UserID") REFERENCES Users ("UserID")
);

CREATE TABLE IF NOT EXISTS Tags_Credentials (
    "TagID" NVARCHAR(36) NOT NULL,
    "CredentialID" NVARCHAR(36) NOT NULL,
    PRIMARY KEY ("TagID", "CredentialID"),
    FOREIGN KEY ("TagID") REFERENCES Tags ("TagID"),
    FOREIGN KEY ("CredentialID") REFERENCES Credentials ("CredentialID")
);
