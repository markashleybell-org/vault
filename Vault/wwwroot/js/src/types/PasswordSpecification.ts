export class PasswordSpecification {
    public readonly length: number;
    public readonly lowercase: boolean;
    public readonly uppercase: boolean;
    public readonly numbers: boolean;
    public readonly symbols: boolean;

    private characterTypes: any = {};

    constructor(length: number,
                lowercase: boolean,
                uppercase: boolean,
                numbers: boolean,
                symbols: boolean) {
        this.length = length;

        this.lowercase = lowercase;
        this.uppercase = uppercase;
        this.numbers = numbers;
        this.symbols = symbols;

        this.characterTypes.lowercase = this.lowercase;
        this.characterTypes.uppercase = this.uppercase;
        this.characterTypes.numbers = this.numbers;
        this.characterTypes.symbols = this.symbols;
    }

    public getCharacterTypes(): string[] {
        const props = ['lowercase', 'uppercase', 'numbers', 'symbols'];
        return props.filter(p => this.characterTypes[p] === true);
    }
}
