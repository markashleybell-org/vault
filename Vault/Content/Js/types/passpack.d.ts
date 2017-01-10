interface PasspackUtils {
    getBits(passphrase: string);
    charMatrix;
    passGenerator(chars: {}, n: number);
    simplePassGenerator(n: number);
    genRandomKey(x: number, salt: string);
    getArrayFromHexString(hexstr: string, n: number);
    hashx(str: string, nohex?: boolean, full?: boolean);
    getStringFromHex(str: string, n: number);
}

interface Passpack {
    decode(algorithm: string, enctext: string, key: string, pars?: any);
    encode(algorithm: string, plaintext: string, key: string, pars?: any);
    utils: PasspackUtils;
}

declare var Passpack: Passpack;