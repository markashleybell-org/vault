import { rateLimit, trim, truncate } from '../modules/Common';

describe('Common', () => {

    test('trim', () => {
        expect(trim(null)).toBe(null);
        expect(trim('ABC   ')).toBe('ABC');
        expect(trim('    ABC')).toBe('ABC');
        expect(trim('    ABC   ')).toBe('ABC');
    });

    test('rateLimit', () => {
        jest.useFakeTimers();

        const action = jest.fn();

        const doThing = rateLimit(action, 100);

        doThing();
        doThing(); // This should cancel the previous call

        jest.advanceTimersByTime(100); // Now that 100ms has passed, action() should be called

        doThing();
        doThing();
        doThing(); // Again, both previous calls will have been cancelled

        jest.advanceTimersByTime(100); // Now that another 100ms has passed, action() should be called again

        expect(action).toHaveBeenCalledTimes(2);
    });

    test('truncate', () => {
        const testString = 'This Is A Test';
        expect(truncate(testString, 10)).toBe('This Is...');
        expect(truncate(testString, 20)).toBe('This Is A Test');
    });

});
