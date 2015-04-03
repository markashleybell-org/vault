USE [master]
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'Vault')
BEGIN
    CREATE DATABASE [Vault]
END
GO

USE [Vault]
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tCredential]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[tCredential] (
	    [CredentialID] [varchar](36) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	    [Description] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	    [Url] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	    [Username] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	    [Password] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	    [Notes] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	    [UserDefined1] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	    [UserDefined1Label] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	    [UserDefined2] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	    [UserDefined2Label] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	    [UserID] [varchar](36) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
        CONSTRAINT [PK_tCredential] PRIMARY KEY CLUSTERED (
	        [CredentialID] ASC
        ) WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF)
    )
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tUser]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[tUser](
	    [UserID] [varchar](36) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	    [UserName] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	    [Password] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
        CONSTRAINT [PK_tUser] PRIMARY KEY CLUSTERED (
	        [UserID] ASC
        ) WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF)
    )
END
GO

