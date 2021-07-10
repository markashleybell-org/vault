import { range, sum } from '../modules/all';
import { ICredential, IDictionary, PasswordSpecification } from '../types/all';

const passwordCharacters: IDictionary<string> = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!#$%&\'()*+,-./:;=?@[\]^_`{|}~'
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Score below which password is deemed weak
export const weakPasswordScoreThreshold = 40;

// Minimum recommended password length
export const weakPasswordLengthThreshold = 8;

// Modified from: https://stackoverflow.com/a/11268104/43140
export function getPasswordScore(password: string) {
    let score = 0;

    if (!password) {
        return score;
    }

    const letters: any = {};

    // Add a point for every character (until it's been repeated 5 times)
    for (const char of password) {
        letters[char] = (letters[char] || 0) + 1;
        score += 5.0 / letters[char];
    }

    const variations: IDictionary<boolean> = {
        digits: /\d/.test(password),
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        nonWords: /\W/.test(password),
    };

    // Add points for character type variation
    const variationCount = Object.keys(variations)
        .map((k: string): number => variations[k] ? 1 : 0)
        .reduce(sum);

    score += (variationCount - 1) * 10;

    const lengthCheck = weakPasswordLengthThreshold * 2;

    // If the password is less than N chars long, subtract
    // points for each character below the threshold
    score -= lengthCheck - (password.length / lengthCheck);

    return Math.floor(score);
}

export function hex(buffer: ArrayBuffer) {
    return Array.from(new Uint8Array(buffer)).map(b => ('0' + b.toString(16)).slice(-2)).join('');
}

export function plain(buffer: ArrayBuffer) {
    return decoder.decode(buffer);
}

export async function hash(s: string) {
    return await crypto.subtle.digest('SHA-256', encoder.encode(s));
}

function getRandomCharacterFactory(characters: string) {
    return (_: number) => {
        const r = Math.floor(Math.random() * characters.length);
        return r < characters.length ? characters.substring(r, r + 1) : '';
    };
}

export function generatePassword(specification: PasswordSpecification) {
    if (specification.length === 0) {
        return null;
    }

    const charTypes = specification.getCharacterTypes();

    if (!charTypes.length) {
        return null;
    }

    const validCharacters = charTypes.map(t => passwordCharacters[t]).join('');

    const randomCharacter = getRandomCharacterFactory(validCharacters);

    const positions = range(0, specification.length);

    return positions.map(randomCharacter).join('');
}

export async function generateMasterKey(password: string) {
    const inner = await hash(password);
    return await hash(password + plain(inner));
}

export async function decryptCredential(credential: ICredential, masterKey: ArrayBuffer, excludes: string[]) {
    return forPropertiesOf(credential, async val => await aesGcmDecrypt(val, masterKey), excludes);
}

export async function decryptCredentials(credentials: ICredential[], masterKey: ArrayBuffer, excludes: string[]) {
    return await Promise.all(credentials.map(async item => await decryptCredential(item, masterKey, excludes)));
}

export async function encryptCredential(credential: ICredential, masterKey: ArrayBuffer, excludes: string[]) {
    return forPropertiesOf(credential, async val => await aesGcmEncrypt(val, masterKey), excludes);
}

export async function encryptCredentials(credentials: ICredential[], masterKey: ArrayBuffer, excludes: string[]) {
    return await Promise.all(credentials.map(async item => await encryptCredential(item, masterKey, excludes)));
}

export function isWeakPassword(password: string) {
    return getPasswordScore(password) <= weakPasswordScoreThreshold;
}

async function forPropertiesOf(credential: ICredential, action: (val: string) => Promise<string>, excludes: string[]) {
    const encrypted: any = {};

    const properties = Object.keys(credential);

    const isExcluded = (k: string) => excludes.indexOf(k) !== -1;
    const isNotExcluded = (k: string) => !isExcluded(k);

    // Map the excluded properties directly
    properties.filter(isExcluded).forEach(k => encrypted[k] = credential[k]);

    const encryptedMappings = properties.filter(isNotExcluded)
        .map(async k => { encrypted[k] = await action(credential[k]); });

    await Promise.all(encryptedMappings);

    return (encrypted as ICredential);
}

// The following functions were adapted from:
// https://gist.github.com/chrisveness/43bcda93af9f646d083fad678071b90a

async function aesGcmEncrypt(plaintext: string, passwordHash: ArrayBuffer) {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const algorithm: AesGcmParams = {
        name: 'AES-GCM',
        iv: iv
    };

    const key = await crypto.subtle.importKey('raw', passwordHash, algorithm.name, false, ['encrypt']);

    const buffer = await crypto.subtle.encrypt(algorithm, key, encoder.encode(plaintext));

    const cipherText = Array.from(new Uint8Array(buffer))
        .map(byte => String.fromCharCode(byte))
        .join('');

    const ivHex = Array.from(iv)
        .map(b => ('00' + b.toString(16)).slice(-2))
        .join('');

    return ivHex + btoa(cipherText);
}

async function aesGcmDecrypt(cipherTextBase64: string, passwordHash: ArrayBuffer) {
    const iv = cipherTextBase64.slice(0, 24)
        .match(/.{2}/g)
        .map(byte => parseInt(byte, 16));

    const algorithm: AesGcmParams = {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
    };

    const key = await crypto.subtle.importKey('raw', passwordHash, algorithm.name, false, ['decrypt']);

    const cipherText = atob(cipherTextBase64.slice(24))
        .match(/[\s\S]/g)
        .map(ch => ch.charCodeAt(0));

    const buffer = await crypto.subtle.decrypt(algorithm, key, new Uint8Array(cipherText));

    return decoder.decode(buffer);
}
