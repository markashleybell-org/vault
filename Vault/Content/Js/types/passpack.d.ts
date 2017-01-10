declare class PasspackCharMatrix {
    lcase: number[];
    ucase: number[];
    nums: number[];
    symb: number[];
    space: number[];
}

interface IPasspackUtils {
    getBits(passphrase: string): number;
    charMatrix: PasspackCharMatrix;
    passGenerator(chars: any, n: number): string;
    simplePassGenerator(n: number): string;
    genRandomKey(x: number, salt: string): string;
    getArrayFromHexString(hexstr: string, n: number): number[];
    hashx(str: string, nohex?: boolean, full?: boolean): string;
    getStringFromHex(str: string, n: number): string;
}

interface IPasspack {
    decode: IPasspackCryptoFunction;
    encode: IPasspackCryptoFunction;
    utils: IPasspackUtils;
}

interface IPasspackCryptoFunction {
    (algorithm: string, text: string, key: string, pars?: any): string;
}

declare var Passpack: IPasspack;