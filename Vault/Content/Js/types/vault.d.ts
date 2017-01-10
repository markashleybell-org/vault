/* tslint:disable:comment-format quotemark */

// Workaround declarations for deprecated functions
// until I have time to investigate side effects of removal
declare function escape(s: string): string;
declare function unescape(s: string): string;

interface IXHRSuccess {
    (data: any, status?: string, request?: JQueryXHR): void;
}

interface IXHRError {
    (request: JQueryXHR, status: string, error: string): void;
}

declare class Credential {
    CredentialID: string;
    UserID: string;
    Description: string;
    Username: string;
    Password: string;
    PasswordConfirmation: string;
    Url: string;
    UserDefined1Label: string;
    UserDefined1: string;
    UserDefined2Label: string;
    UserDefined2: string;
    Notes: string;
    PwdOptions: string;
}

declare class CredentialSummary {
    credentialid: string;
    masterkey: string;
    userid: string;
    description: string;
    username: string;
    password: string;
    url: string;
    weak: boolean;
}