namespace Vault.Support
{
    public static class SqlStatements
    {
        public const string SelectSummary =
            @"SELECT
                  CredentialID,
                  UserID,
                  Description,
                  Username,
                  Password,
                  Url
              FROM
                  Credentials
              WHERE
                  UserID = @UserID";

        public const string Select =
            "SELECT * FROM Credentials WHERE UserID = @UserID";

        public const string SelectSingle =
            "SELECT * FROM Credentials WHERE CredentialID = @CredentialID";

        public const string Insert =
            @"INSERT INTO
                  Credentials (
                      CredentialID,
                      UserID,
                      Description,
                      Username,
                      Password,
                      Url,
                      UserDefined1Label,
                      UserDefined1,
                      UserDefined2Label,
                      UserDefined2,
                      Notes,
                      PwdOptions
                  )
              VALUES (
                  @CredentialID,
                  @UserID,
                  @Description,
                  @Username,
                  @Password,
                  @Url,
                  @UserDefined1Label,
                  @UserDefined1,
                  @UserDefined2Label,
                  @UserDefined2,
                  @Notes,
                  @PwdOptions
              )";

        public const string Update =
            @"UPDATE
                  Credentials
              SET
                  Description = @Description,
                  Username = @Username,
                  Password = @Password,
                  Url = @Url,
                  UserDefined1Label = @UserDefined1Label,
                  UserDefined1 = @UserDefined1,
                  UserDefined2Label = @UserDefined2Label,
                  UserDefined2 = @UserDefined2,
                  Notes = @Notes,
                  PwdOptions = @PwdOptions
              WHERE
                  CredentialID = @CredentialID";

        public const string Delete =
            "DELETE FROM Credentials WHERE UserID = @UserID AND CredentialID = @CredentialID";

        public const string UpdatePassword =
            "UPDATE Users SET Password = @NewPasswordHash WHERE UserID = @UserID AND Password = @OldPasswordHash";

        public const string Login =
            "SELECT UserID FROM Users WHERE Username = @Username AND Password = @Password";
    }
}
