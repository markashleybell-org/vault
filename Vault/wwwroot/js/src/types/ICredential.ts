export interface ICredential {
    CredentialID: string;
    UserID: string;
    Description: string;
    Username?: string;
    Password?: string;
    Url?: string;
    UserDefined1Label?: string;
    UserDefined1?: string;
    UserDefined2Label?: string;
    UserDefined2?: string;
    Notes?: string;
    PwdOptions?: string;
    Tags?: string;
    TagDisplay?: string;
    [propertyName: string]: string;
}
