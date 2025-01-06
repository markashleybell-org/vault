﻿import {
    ICredential,
    ICredentialSearchQuery,
    ICredentialSummary,
    ICredentialValidationError,
    IDictionary,
    ITagIndex,
    PasswordSpecification
} from '../types/all';
import { trim } from './Common';

// A map of the properties which can be searched for using the fieldName:query syntax
// We need this because the search is not case-sensitive, whereas JS properties are!
const queryablePropertyMap: IDictionary<string> = {
    description: 'Description',
    username: 'Username',
    password: 'Password',
    url: 'Url',
    filter: 'FILTER'
};

export function parseSearchQuery(queryText: string) {
    const parsedQuery: ICredentialSearchQuery = {
        property: queryablePropertyMap.description,
        text: null
    };

    const rawQuery = trim(queryText);

    if (!rawQuery || !rawQuery.length) {
        return parsedQuery;
    }

    const processedQuery = rawQuery.toLowerCase();

    if (processedQuery.indexOf(':') === -1) {
        parsedQuery.text = processedQuery;
    } else {
        // Support queries in the form fieldName:query (e.g. username:me@email.com)
        const [property, query] = processedQuery.split(':').map(trim);

        if (property && queryablePropertyMap[property] && query) {
            parsedQuery.property = queryablePropertyMap[property];
            parsedQuery.text = query;
        }
    }

    return parsedQuery;
}

export function searchCredentials(query: ICredentialSearchQuery, tagIndex: ITagIndex, tagIds: string[], isWeakPassword: (password: string) => boolean, list: ICredential[]) {
    const emptyQuery = !query || !query.property || !query.text;

    if (!tagIds.length && emptyQuery) {
        return [];
    }

    let tagged = list;

    if (tagIds.length) {
        const matches = tagIds
            .map(t => tagIndex.index.get(t)).flat()
            .reduce((acc, e) => acc.set(e, (acc.get(e) || 0) + 1), new Map<string, number>());

        tagged = list.filter(c => matches.get(c.CredentialID) == tagIds.length);
    }

    if (emptyQuery) {
        return tagged;
    }

    if (query.property === 'FILTER') {
        switch (query.text) {
            case 'all':
                return tagged;
            case 'weak':
                return tagged.filter(c => c.Password && isWeakPassword(c.Password));
            default:
                return [];
        }
    }

    return tagged.filter(item => item[query.property].toLowerCase().indexOf(query.text) > -1);
}

export function mapToSummary(credential: ICredential, isWeakPassword: (password: string) => boolean) {
    const credentialSummary: ICredentialSummary = {
        credentialid: credential.CredentialID,
        description: credential.Description,
        username: credential.Username,
        password: credential.Password,
        url: credential.Url,
        weak: credential.Password && isWeakPassword(credential.Password)
    };
    return credentialSummary;
}

export function parsePasswordSpecificationString(optionString: string) {
    if (!optionString || optionString.indexOf('|') === -1) {
        return null;
    }

    const optionsArray = optionString.split('|');

    if (optionsArray.length !== 5) {
        return null;
    }

    const [length, lowercase, uppercase, numbers, symbols] = optionsArray;

    const specification = new PasswordSpecification(
        parseInt(length, 10),
        lowercase === '1',
        uppercase === '1',
        numbers === '1',
        symbols === '1'
    );

    return specification;
}

export function getPasswordSpecificationFromPassword(password: string) {
    if (!password || !password.length) {
        return null;
    }

    const specification = new PasswordSpecification(
        password.length,
        /[a-z]+/.test(password),
        /[A-Z]+/.test(password),
        /\d+/.test(password),
        /[^\dA-Z]+/i.test(password)
    );

    return specification;
}

export function sortCredentials(credentials: ICredential[]) {
    return credentials.slice().sort((a: ICredential, b: ICredential) => {
        const desca = a.Description.toUpperCase();
        const descb = b.Description.toUpperCase();
        return desca < descb ? -1 : desca > descb ? 1 : 0;
    });
}
