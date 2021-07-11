import 'fast-text-encoding';
import {
    getPasswordSpecificationFromPassword,
    mapToSummary,
    parsePasswordSpecificationString,
    parseSearchQuery,
    searchCredentials,
    sortCredentials
} from '../modules/all';
import { ICredential, PasswordSpecification } from '../types/all';
import { FakeRepository } from '../types/FakeRepository';

const testCredentialPlainText: ICredential = {
    CredentialID: '361fe91a-3dca-4871-b69e-c41c31507c8c',
    UserID: 'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
    Description: 'Test Credential',
    Username: '_testuser123',
    Password: '8{s?(\'7.171h)3H',
    Url: 'http://www.test.com?id=23&param=TEST+VALUE',
    UserDefined1Label: 'Custom 1',
    UserDefined1: 'CUSTOM1',
    UserDefined2Label: 'Custom 2',
    UserDefined2: 'CUSTOM2',
    Notes: 'Test Notes:\n\nThese are test notes.',
    PwdOptions: '16|1|1|1|1'
};

function getTestCredentials(): ICredential[] {
    return new FakeRepository().credentials;
}

const nw = (password: string) => false;

describe('Vault', () => {

    test('parseSearchQuery', () => {
        const parsed = parseSearchQuery(' EmAil ');

        expect(parsed.property).toBe('Description');
        expect(parsed.text).toBe('email');
    });

    test('parseSearchQuery bad queries', () => {
        expect(parseSearchQuery(null).text).toBe(null);
        expect(parseSearchQuery('').text).toBe(null);
        expect(parseSearchQuery('INVALID:description').text).toBe(null);
    });

    test('parseSearchQuery specific field', () => {
        const parsed = parseSearchQuery(' useRName : BoB ');

        expect(parsed.property).toBe('Username');
        expect(parsed.text).toBe('bob');
    });

    test('parseSearchQuery show weak', () => {
        const parsed = parseSearchQuery(' filtER : WeAk ');

        expect(parsed.property).toBe('FILTER');
        expect(parsed.text).toBe('weak');
    });

    test('parseSearchQuery show all', () => {
        const parsed = parseSearchQuery(' Filter: aLl ');

        expect(parsed.property).toBe('FILTER');
        expect(parsed.text).toBe('all');
    });

    test('searchCredentials bad queries', () => {
        const testCredentials = getTestCredentials();

        const noresults1 = searchCredentials(null, nw, testCredentials);
        const noresults2 = searchCredentials({ property: null, text: 'ABC' }, nw, testCredentials);
        const noresults3 = searchCredentials({ property: 'Description', text: null }, nw, testCredentials);
        const noresults4 = searchCredentials({ property: 'Description', text: 'Z' }, nw, testCredentials);
        const noresults5 = searchCredentials({ property: 'FILTER', text: 'ABC' }, nw, testCredentials);

        expect(noresults1.length).toBe(0);
        expect(noresults2.length).toBe(0);
        expect(noresults3.length).toBe(0);
        expect(noresults4.length).toBe(0);
        expect(noresults5.length).toBe(0);
    });

    test('searchCredentials standard query', () => {
        const testCredentials = getTestCredentials();
        const results = searchCredentials({ property: 'Description', text: 'do' }, nw, testCredentials);
        expect(results.length).toBe(2);
        expect(results[0].Description).toBe('Dog');
        expect(results[1].Description).toBe('Dogfish');
    });

    test('searchCredentials username query', () => {
        const testCredentials = getTestCredentials();
        const results = searchCredentials({ property: 'Username', text: 'dog' }, nw, testCredentials);
        expect(results.length).toBe(2);
        expect(results[0].Description).toBe('Dog');
        expect(results[1].Description).toBe('Dogfish');
    });

    test('searchCredentials password query', () => {
        const testCredentials = getTestCredentials();
        const results = searchCredentials({ property: 'Password', text: 'cat' }, nw, testCredentials);
        expect(results.length).toBe(2);
        expect(results[0].Description).toBe('Cat');
        expect(results[1].Description).toBe('Catfish');
    });

    test('searchCredentials all query', () => {
        const testCredentials = getTestCredentials();
        const results = searchCredentials({ property: 'FILTER', text: 'all' }, nw, testCredentials);
        expect(results.length).toBe(6);
        expect(results[0].Description).toBe('Cat');
        expect(results[5].Description).toBe('Owl');
    });

    test('searchCredentials weak password query', () => {
        const testCredentials = getTestCredentials();
        testCredentials.push({
            CredentialID: 'TEST',
            UserID: 'user1',
            Description: 'NOPASSWORD',
            Password: null
        });
        const isWeakPwd = (password: string) => !password || password.length < 7;
        const results = searchCredentials({ property: 'FILTER', text: 'weak' }, isWeakPwd, testCredentials);
        expect(results.length).toBe(2);
        expect(results[0].Description).toBe('Cat');
        expect(results[1].Description).toBe('Dog');
    });

    test('mapToSummary', () => {
        const summary = mapToSummary(testCredentialPlainText, c => true);
        expect(summary.credentialid).toBe('361fe91a-3dca-4871-b69e-c41c31507c8c');
        expect(summary.description).toBe('Test Credential');
        expect(summary.password).toBe('8{s?(\'7.171h)3H');
        expect(summary.url).toBe('http://www.test.com?id=23&param=TEST+VALUE');
        expect(summary.username).toBe('_testuser123');
        expect(summary.weak).toBe(true);
    });

    test('parsePasswordSpecificationString bad inputs', () => {
        expect(parsePasswordSpecificationString(null)).toBeNull();
        expect(parsePasswordSpecificationString('')).toBeNull();
        expect(parsePasswordSpecificationString('1|2|3')).toBeNull();
    });

    test('parsePasswordSpecificationString valid inputs', () => {
        const spec1 = new PasswordSpecification(16, true, true, true, true);
        const spec2 = new PasswordSpecification(32, false, true, false, true);
        const spec3 = new PasswordSpecification(64, true, false, true, false);

        expect(parsePasswordSpecificationString('16|1|1|1|1')).toEqual(spec1);
        expect(parsePasswordSpecificationString('32|0|1|0|1')).toEqual(spec2);
        expect(parsePasswordSpecificationString('64|1|0|1|0')).toEqual(spec3);
    });

    test('getPasswordSpecificationFromPassword bad inputs', () => {
        expect(getPasswordSpecificationFromPassword(null)).toBeNull();
        expect(getPasswordSpecificationFromPassword('')).toBeNull();
    });

    test('getPasswordSpecificationFromPassword valid inputs', () => {
        const spec1 = new PasswordSpecification(8, true, false, true, false);
        const spec2 = new PasswordSpecification(10, true, true, true, true);
        const spec3 = new PasswordSpecification(12, false, false, true, false);
        const spec4 = new PasswordSpecification(14, false, true, false, true);

        expect(getPasswordSpecificationFromPassword('abcd1234')).toEqual(spec1);
        expect(getPasswordSpecificationFromPassword('!aBcd1234^')).toEqual(spec2);
        expect(getPasswordSpecificationFromPassword('123456789012')).toEqual(spec3);
        expect(getPasswordSpecificationFromPassword('ABCD*EFG?H&JK-')).toEqual(spec4);
    });

    test('sortCredentials', () => {
        const testCredentials = getTestCredentials();
        testCredentials.push({
            CredentialID: 'TEST',
            UserID: 'user1',
            Description: 'Fish',
            Password: null
        });
        const sortedCredentials = sortCredentials(testCredentials);
        expect(sortedCredentials.length).toBe(7);
        expect(sortedCredentials[0].Description).toBe('Cat');
        expect(sortedCredentials[1].Description).toBe('Catfish');
        expect(sortedCredentials[2].Description).toBe('Dog');
        expect(sortedCredentials[3].Description).toBe('Dogfish');
        expect(sortedCredentials[4].Description).toBe('Fish');
        expect(sortedCredentials[5].Description).toBe('Fish');
        expect(sortedCredentials[6].Description).toBe('Owl');
    });

});
