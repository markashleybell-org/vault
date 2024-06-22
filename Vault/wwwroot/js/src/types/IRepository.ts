import { ICredential, ILoginResult, ITagIndex } from './all';

export interface IRepository {
    login(hashedUsername: string, hashedPassword: string): Promise<ILoginResult>;

    loadTagIndex(): Promise<ITagIndex>;

    loadCredential(credentialId: string): Promise<ICredential>;
    loadCredentialSummaryList(): Promise<ICredential[]>;
    loadCredentials(): Promise<ICredential[]>;

    createCredential(credential: ICredential): Promise<ICredential>;
    updateCredential(credential: ICredential): Promise<ICredential>;
    updatePassword(newPassword: string): Promise<void>;
    import(credentials: ICredential[]): Promise<void>;

    deleteCredential(credentialId: string): Promise<void>;
}
