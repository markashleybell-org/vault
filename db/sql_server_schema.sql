IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Users') AND type in (N'U'))
BEGIN
    CREATE TABLE Users (
        UserID NVARCHAR(36) NOT NULL,
        Username NVARCHAR(max) NOT NULL,
        Password NVARCHAR(max) NOT NULL,
        CONSTRAINT PK_tUser PRIMARY KEY CLUSTERED (
            UserID ASC
        )
    )
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Credentials') AND type in (N'U'))
BEGIN
    CREATE TABLE Credentials (
        CredentialID NVARCHAR(36) NOT NULL,
        UserID NVARCHAR(36) NOT NULL,
        Description NVARCHAR(max) NULL,
        Url NVARCHAR(max) NULL,
        Username NVARCHAR(max) NULL,
        Password NVARCHAR(max) NULL,
        Notes NVARCHAR(max) NULL,
        UserDefined1 NVARCHAR(max) NULL,
        UserDefined1Label NVARCHAR(max) NULL,
        UserDefined2 NVARCHAR(max) NULL,
        UserDefined2Label NVARCHAR(max) NULL,
        PwdOptions NVARCHAR(max) NULL,
        CONSTRAINT PK_tCredential PRIMARY KEY CLUSTERED (
            CredentialID ASC
        ),
        CONSTRAINT FK_tCredential_tUser FOREIGN KEY (UserID) REFERENCES Users (UserID)
    )
END
GO


IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Tags') AND type in (N'U'))
BEGIN
    CREATE TABLE Tags (
        TagID NVARCHAR(36) NOT NULL,
        UserID NVARCHAR(36) NOT NULL,
        Label NVARCHAR(64) NOT NULL,
        CONSTRAINT PK_tTag PRIMARY KEY CLUSTERED (
            TagID ASC
        ),
        CONSTRAINT FK_tTag_tUser FOREIGN KEY (UserID) REFERENCES Users (UserID)
    )
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Tags_Credentials') AND type in (N'U'))
BEGIN
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
END
GO
