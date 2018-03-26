﻿/// <reference path="../types/passpack.d.ts" />

class CryptoProvider implements ICryptoProvider {

    // Decode Base64 string
    public base64ToUtf8(str: string): string {
        return unescape(decodeURIComponent(atob(str)));
    }

    // Encode string to Base64
    public utf8ToBase64(str: string): string {
        return btoa(encodeURIComponent(escape(str)));
    }

    public getPasswordBits(password: string): number {
        return Passpack.utils.getBits(password);
    }

    public hash(str: string): string {
        return Passpack.utils.hashx(str);
    }

    public generatePassword(specification: IPasswordSpecification): string {
        const options: IPasspackCharOptions = {};

        if (specification.lowerCase) {
            options.lcase = 1;
        }

        if (specification.upperCase) {
            options.ucase = 1;
        }

        if (specification.numbers) {
            options.nums = 1;
        }

        if (specification.symbols) {
            options.symb = 1;
        }

        return Passpack.utils.passGenerator(options, specification.length);
    }

    public generateMasterKey(password: string): string {
        return Passpack.utils.hashx(password + Passpack.utils.hashx(password, true, true), true, true);
    }

    public decryptCredential(credential: Credential, masterKey: string, excludes: string[]): Credential {
        return this.crypt(Passpack.decode, credential, masterKey, excludes);
    }

    public decryptCredentials(credentials: Credential[], masterKey: string, excludes: string[]): Credential[] {
        return credentials.map(item => this.decryptCredential(item, masterKey, excludes));
    }

    public encryptCredential(credential: Credential, masterKey: string, excludes: string[]): Credential {
        return this.crypt(Passpack.encode, credential, masterKey, excludes);
    }

    public encryptCredentials(credentials: Credential[], masterKey: string, excludes: string[]): Credential[] {
        return credentials.map(item => this.encryptCredential(item, masterKey, excludes));
    }

    /**
     * Encrypt/decrypt the properties of an object literal using Passpack.
     * @param {IPasspackCryptoFunction} action - The Passpack function to use for encryption/decryption
     * @param {any} obj - The object literal to be encrypted/decrypted
     * @param {string} masterKey - A Passpack master key
     * @param {string[]} excludes - An array of object property names whose values should not be encrypted
     * @returns {Credential}
     */
    private crypt(action: PasspackCryptoFunction, obj: any, masterKey: string, excludes: string[]): Credential {
        const newCredential: any = {};
        Object.keys(obj).forEach((k: string): void => {
            if (excludes.indexOf(k) === -1) {
                newCredential[k] = action('AES', obj[k], this.base64ToUtf8(masterKey));
            } else {
                newCredential[k] = obj[k];
            }
        });
        return newCredential;
    }
}
