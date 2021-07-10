import {
    decryptCredential,
    decryptCredentials,
    encryptCredential,
    encryptCredentials,
    generateMasterKey,
    hash,
    hex
} from '../modules/all';
import { ICredential, ILoginResult, IRepository, ISecurityKeyDetails } from '../types/all';

export type XHRSuccessCallback = (data: any, status?: string, request?: JQueryXHR) => void;
export type XHRErrorCallback = (request: JQueryXHR, status: string, error: string) => void;

export class Repository implements IRepository {
    private readonly encryptionExcludes = ['CredentialID', 'UserID'];

    private userID: string;
    private password: string;
    private masterKey: ArrayBuffer;
    private cache: ICredential[];
    private securityKey: ISecurityKeyDetails;
    private securityKeyParameter: any;

    constructor(securityKey: ISecurityKeyDetails) {
        this.userID = null;
        this.password = null;
        this.masterKey = null;
        this.cache = [];

        this.securityKey = securityKey;
        this.securityKeyParameter = {};

        if (securityKey) {
            this.securityKeyParameter[securityKey.parameterName] = securityKey.key;
        }
    }

    public async login(username: string, password: string) {
        const usernameHash = await hash(username);
        const passwordHash = await hash(password);

        const data = {
            UN1209: hex(usernameHash),
            PW9804: hex(passwordHash)
        };

        const loginResult = await this.post<ILoginResult>('Home/Login', data);

        if (loginResult.Success) {
            this.userID = loginResult.UserID;
            this.password = password;
            this.masterKey = await generateMasterKey(this.password);
        }

        return loginResult;
    }

    public async loadCredential(credentialId: string) {
        const encryptedCredential = await this.get<ICredential>('Credentials/Read', { id: credentialId });
        return await decryptCredential(encryptedCredential, this.masterKey, this.encryptionExcludes);
    }

    public async loadCredentialSummaryList() {
        if (!this.cache.length) {
            const encryptedCredentials = await this.get<ICredential[]>('Credentials/ReadSummaries', { userId: this.userID });
            this.cache = await decryptCredentials(encryptedCredentials, this.masterKey, this.encryptionExcludes);
        }
        return this.cache;
    }

    public async loadCredentials() {
        const encryptedCredentials = await this.get<ICredential[]>('Credentials/ReadAll', { userId: this.userID });
        return await decryptCredentials(encryptedCredentials, this.masterKey, this.encryptionExcludes);
    }

    public async createCredential(credential: ICredential) {
        this.cache.length = 0;
        credential.UserID = this.userID;
        const encryptedCredential = await encryptCredential(credential, this.masterKey, this.encryptionExcludes);
        return this.post<ICredential>('Credentials/Create', encryptedCredential);
    }

    public async updateCredential(credential: ICredential) {
        this.cache.length = 0;
        credential.UserID = this.userID;
        const encryptedCredential = await encryptCredential(credential, this.masterKey, this.encryptionExcludes);
        return this.post<ICredential>('Credentials/Update', encryptedCredential);
    }

    public async updatePassword(newPassword: string) {
        this.cache.length = 0;

        const credentials = await this.loadCredentials();

        const oldPasswordHash = await hash(this.password);
        const newPasswordHash = await hash(newPassword);

        this.password = newPassword;
        this.masterKey = await generateMasterKey(newPassword);

        const reEncryptedCredentials = await encryptCredentials(credentials, this.masterKey, this.encryptionExcludes);

        const model = {
            UpdatedCredentials: reEncryptedCredentials,
            UserID: this.userID,
            OldPasswordHash: hex(oldPasswordHash),
            NewPasswordHash: hex(newPasswordHash)
        };

        await this.post<void>('Home/UpdatePassword', model);
    }

    public async import(credentials: ICredential[]) {
        credentials.forEach(c => c.UserID = this.userID);

        this.cache.length = 0;
        const encryptedCredentials = await encryptCredentials(credentials, this.masterKey, this.encryptionExcludes);

        const model = {
            Credentials: encryptedCredentials
        };

        return this.post<void>('Credentials/Import', model);
    }

    public async deleteCredential(credentialId: string) {
        this.cache.length = 0;
        const data = {
            userId: this.userID,
            credentialId: credentialId
        };
        return this.post<void>('Credentials/Delete', data);
    }

    private async get<T>(url: string, data: any) {
        const dataWithSecurityKey = Object.assign({}, data, this.securityKeyParameter);

        const queryString = Object.keys(dataWithSecurityKey)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(dataWithSecurityKey[k]))
            .join('&');

        const urlAndQueryString = data
            ? `${url}?${queryString}`
            : url;

        const response = await fetch(urlAndQueryString);
        const json = await response.json() as T;

        return response.ok ? json : Promise.reject(json);
    }

    private async post<T>(url: string, data: any) {
        const urlWithSecurityKey = this.securityKey
            ? `${url}?${this.securityKey.parameterName}=${this.securityKey.key}`
            : url;

        const options: any = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(urlWithSecurityKey, options);
        const json = await response.json() as T;

        return response.ok ? json : Promise.reject(json);
    }
}
