ALTER TABLE Credentials ADD CONSTRAINT FK_tCredential_tUser FOREIGN KEY (UserID) REFERENCES Users (UserID)
GO

CREATE TABLE Tags (
    TagID NVARCHAR(36) NOT NULL,
    UserID NVARCHAR(36) NOT NULL,
    Label NVARCHAR(64) NOT NULL,
    CONSTRAINT PK_tTag PRIMARY KEY CLUSTERED (
        TagID ASC
    ),
    CONSTRAINT FK_tTag_tUser FOREIGN KEY (UserID) REFERENCES Users (UserID)
)
GO

CREATE TABLE Tags_Credentials (
    TagID NVARCHAR(36) NOT NULL,
    CredentialID NVARCHAR(36) NOT NULL,
    CONSTRAINT PK_tTag_Credential PRIMARY KEY CLUSTERED (
        TagID ASC,
        CredentialID ASC
    ),
    CONSTRAINT FK_tTag_Credential_tTag FOREIGN KEY (TagID) REFERENCES Tags (TagID),
    CONSTRAINT FK_tTag_Credential_tCredential FOREIGN KEY (CredentialID) REFERENCES Credentials (CredentialID)
)
GO
