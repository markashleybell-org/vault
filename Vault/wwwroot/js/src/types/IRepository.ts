import { ICredential, ILoginResult } from './all';

export interface IRepository {
    login(hashedUsername: string, hashedPassword: string): Promise<ILoginResult>;

    loadCredential(credentialId: string): Promise<ICredential>;
    loadCredentialSummaryList(): Promise<ICredential[]>;
    loadCredentials(): Promise<ICredential[]>;

    createCredential(credential: ICredential): Promise<ICredential>;
    updateCredential(credential: ICredential): Promise<ICredential>;
    updatePassword(newPassword: string): Promise<void>;
    import(credentials: ICredential[]): Promise<void>;

    deleteCredential(credentialId: string): Promise<void>;
}
