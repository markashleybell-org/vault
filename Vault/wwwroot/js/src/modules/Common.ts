const rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

export function sum(accumulator: number, value: number): number {
    return accumulator + value;
}

export function trim(str: string): string {
    return str === null ? null : (str + '').replace(rtrim, '');
}

export function truncate(str: string, len: number): string {
    return str.length > len ? str.substring(0, len - 3) + '...' : str;
}

export function range(from: number, to: number): number[] {
    return Array(to).fill(0).map((_, i) => from + i);
}

export function rateLimit(func: (...args: any[]) => void, wait?: number) {
    let timeout: any;
    return function (...args: any[]) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
