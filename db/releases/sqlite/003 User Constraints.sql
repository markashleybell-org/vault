BEGIN;

CREATE TABLE IF NOT EXISTS Credentials_FK (
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

INSERT INTO Credentials_FK SELECT * FROM Credentials;

DROP TABLE Credentials;

ALTER TABLE Credentials_FK RENAME TO Credentials;

COMMIT;
