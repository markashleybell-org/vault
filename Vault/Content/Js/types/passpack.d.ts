interface PasspackCharMatrix {
    lcase: number[];
    ucase: number[];
    nums: number[];
    symb: number[];
    space: number[];
}

interface PasspackUtils {
    getBits(passphrase: string): number;
    charMatrix: PasspackCharMatrix;
    passGenerator(chars: any, n: number): string;
    simplePassGenerator(n: number): string;
    genRandomKey(x: number, salt: string): string;
    getArrayFromHexString(hexstr: string, n: number): number[];
    hashx(str: string, nohex?: boolean, full?: boolean): string;
    getStringFromHex(str: string, n: number): string;
}

interface Passpack {
    decode(algorithm: string, enctext: string, key: string, pars?: any): string;
    encode(algorithm: string, plaintext: string, key: string, pars?: any): string;
    utils: PasspackUtils;
}

declare var Passpack: Passpack;