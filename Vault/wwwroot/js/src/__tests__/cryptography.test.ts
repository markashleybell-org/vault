import 'fast-text-encoding';
import { generatePassword, isWeakPassword } from '../modules/all';
import { PasswordSpecification } from '../types/all';

describe('Cryptography', () => {

    test('generatePassword', () => {
        const spec1 = new PasswordSpecification(0, false, false, false, false);
        const spec2 = new PasswordSpecification(32, false, false, false, false);
        const spec3 = new PasswordSpecification(32, true, false, false, false);
        const spec4 = new PasswordSpecification(32, false, true, false, false);
        const spec5 = new PasswordSpecification(32, false, false, true, false);
        const spec6 = new PasswordSpecification(32, false, false, false, true);

        const empty = generatePassword(spec1);

        expect(empty).toBe(null);

        const empty2 = generatePassword(spec2);

        expect(empty2).toBe(null);

        const lc = generatePassword(spec3);

        expect(lc.toLowerCase()).toBe(lc);

        const uc = generatePassword(spec4);

        expect(uc.toUpperCase()).toBe(uc);

        const nums = generatePassword(spec5);

        expect(nums.match(/\d+/gi));

        const sym = generatePassword(spec6);

        expect(sym.match(/[^a-z0-9]+/gi));
    });

    test('isWeakPassword', () => {
        expect(isWeakPassword(null)).toBe(true);
        expect(isWeakPassword('')).toBe(true);
        expect(isWeakPassword('pass123')).toBe(true);
        expect(isWeakPassword('dhk2J*jsjk')).toBe(false);
    });

});
