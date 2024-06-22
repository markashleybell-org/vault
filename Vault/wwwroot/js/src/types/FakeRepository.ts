import { ICredential, IRepository, ITag, ITagIndex } from './all';

export class FakeRepository implements IRepository {
    public credentials: ICredential[];

    constructor() {
        this.credentials = [{
            CredentialID: 'cr1',
            UserID: 'user1',
            Description: 'Cat',
            Username: 'cat',
            Password: 'cat123',
            Url: 'http://cat.com',
            UserDefined1Label: 'Cat UD 1',
            UserDefined1: 'catud1',
            UserDefined2Label: 'Cat UD 1',
            UserDefined2: 'catud1',
            Notes: 'Cat notes',
            PwdOptions: '12|1|1|1|1',
            Tags: 'cat'
        }, {
            CredentialID: 'cr2',
            UserID: 'user1',
            Description: 'Dog',
            Username: 'dog',
            Password: 'dog123',
            Url: 'http://dog.com',
            UserDefined1Label: 'Dog UD 1',
            UserDefined1: 'dogud1',
            UserDefined2Label: 'Dog UD 1',
            UserDefined2: 'dogud1',
            Notes: 'Dog notes',
            PwdOptions: '12|1|1|1|1',
            Tags: 'dog'
        }, {
            CredentialID: 'cr3',
            UserID: 'user1',
            Description: 'Fish',
            Username: 'fish',
            Password: 'fish123',
            Url: 'http://fish.com',
            UserDefined1Label: 'Fish UD 1',
            UserDefined1: 'fishud1',
            UserDefined2Label: 'Fish UD 1',
            UserDefined2: 'fishud1',
            Notes: 'Fish notes',
            PwdOptions: '12|1|1|1|1',
            Tags: 'fish'
        }, {
            CredentialID: 'cr4',
            UserID: 'user1',
            Description: 'Catfish',
            Username: 'catfish',
            Password: 'catfish123',
            Url: 'http://catfish.com',
            UserDefined1Label: 'Catfish UD 1',
            UserDefined1: 'catfishud1',
            UserDefined2Label: 'Catfish UD 1',
            UserDefined2: 'catfishud1',
            Notes: 'Catfish notes',
            PwdOptions: '12|1|1|1|1',
            Tags: 'cat|fish'
        }, {
            CredentialID: 'cr5',
            UserID: 'user1',
            Description: 'Dogfish',
            Username: 'dogfish',
            Password: 'dogfish123',
            Url: 'http://dogfish.com',
            UserDefined1Label: 'Dogfish UD 1',
            UserDefined1: 'dogfishud1',
            UserDefined2Label: 'Dogfish UD 1',
            UserDefined2: 'dogfishud1',
            Notes: 'Dogfish notes',
            PwdOptions: '12|1|1|1|1',
            Tags: 'dog|fish'
        }, {
            CredentialID: 'cr6',
            UserID: 'user1',
            Description: 'Owl',
            Username: 'owl',
            Password: '_nT:NP?uovID8,TE',
            Url: 'http://owl.com',
            UserDefined1Label: 'Owl UD 1',
            UserDefined1: 'owlud1',
            UserDefined2Label: 'Owl UD 1',
            UserDefined2: 'owlud1',
            Notes: 'Owl notes',
            PwdOptions: '12|1|1|1|1',
            Tags: ''
        }];
    }

    public async login(hashedUsername: string, hashedPassword: string) {
        return { UserID: 'user1', Success: true };
    }

    public async loadTagIndex() {
        const map = new Map();

        map.set('cat', ['cr1', 'cr4']);
        map.set('dog', ['cr2', 'cr5']);
        map.set('fish', ['cr3', 'cr4', 'cr5']);

        const testTagIndex: ITagIndex = {
            tags: [
                { TagID: 'cat', Label: 'Cat' },
                { TagID: 'dog', Label: 'Dog' },
                { TagID: 'fish', Label: 'Fish' }
            ],
            index: map
        };

        return new Promise<ITagIndex>(resolve => resolve(testTagIndex));
    }

    public async loadCredential(credentialId: string) {
        return this.credentials.filter(c => c.CredentialID === credentialId)[0];
    }

    public async loadCredentialSummaryList() {
        return this.credentials;
    }

    public async loadCredentials() {
        return this.credentials;
    }

    public async createCredential(credential: ICredential) {
        return new Promise<ICredential>(resolve => resolve(credential));
    }

    public async updateCredential(credential: ICredential) {
        return new Promise<ICredential>(resolve => resolve(credential));
    }

    public async updatePassword(newPassword: string) {
        return new Promise<void>(resolve => resolve());
    }

    public async import(credentials: ICredential[]) {
        this.credentials = credentials;
        return new Promise<void>(resolve => resolve());
    }

    public async deleteCredential(credentialId: string) {
        this.credentials = this.credentials.filter(c => c.CredentialID !== credentialId);
        return new Promise<void>(resolve => resolve());
    }
}
