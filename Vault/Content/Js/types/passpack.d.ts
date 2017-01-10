interface PasspackCharMatrix {
    lcase: Array<number>;
    ucase: Array<number>;
    nums: Array<number>;
    symb: Array<number>;
    space: Array<number>;
}

interface PasspackUtils {
    getBits(passphrase: string): number;
    charMatrix: PasspackCharMatrix;
    passGenerator(chars: {}, n: number): string;
    simplePassGenerator(n: number): string;
    genRandomKey(x: number, salt: string): string;
    getArrayFromHexString(hexstr: string, n: number): Array<number>;
    hashx(str: string, nohex?: boolean, full?: boolean): string;
    getStringFromHex(str: string, n: number): string;
}

interface Passpack {
    decode(algorithm: string, enctext: string, key: string, pars?: any): string;
    encode(algorithm: string, plaintext: string, key: string, pars?: any): string;
    utils: PasspackUtils;
}

declare var Passpack: Passpack;