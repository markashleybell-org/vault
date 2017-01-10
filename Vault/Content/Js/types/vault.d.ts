// Workaround declarations for deprecated functions 
// until I have time to investigate side effects of removal
declare function escape(s: string): string;
declare function unescape(s: string): string;

interface AjaxSuccessCallback {
    (data: any, status?: string, request?: JQueryXHR): void;
}

interface AjaxErrorCallback {
    (request: JQueryXHR, textStatus: string, errorThrown: string): void;
}

interface Credential {
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