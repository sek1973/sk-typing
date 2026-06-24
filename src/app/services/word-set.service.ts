import { Injectable } from '@angular/core';

const TOP_200_ENGLISH = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
    'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
    'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
    'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
    'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
    'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
    'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
    'any', 'these', 'give', 'day', 'most', 'us', 'great', 'between', 'need',
    'large', 'often', 'hand', 'high', 'place', 'hold', 'turn', 'were',
    'did', 'number', 'sound', 'water', 'side', 'been', 'call', 'who',
    'oil', 'find', 'long', 'down', 'set', 'put', 'end', 'does', 'another',
    'well', 'large', 'must', 'big', 'even', 'such', 'because', 'turn',
    'here', 'why', 'ask', 'went', 'men', 'read', 'need', 'land', 'different',
    'home', 'move', 'try', 'kind', 'hand', 'picture', 'again', 'change',
    'off', 'play', 'spell', 'air', 'away', 'animal', 'house', 'point',
    'page', 'letter', 'mother', 'answer', 'found', 'study', 'still',
    'learn', 'plant', 'cover', 'food', 'sun', 'four', 'between', 'state',
    'keep', 'eye', 'never', 'last', 'let', 'thought', 'city', 'tree',
    'cross', 'farm', 'hard', 'start', 'might', 'story', 'saw', 'far',
    'draw', 'left', 'late', 'run', 'while', 'press', 'close', 'night',
    'real', 'life', 'few', 'open', 'seem', 'together', 'next', 'white',
    'children', 'begin', 'got', 'walk', 'example', 'ease', 'paper',
    'group', 'always', 'music', 'those', 'both', 'mark', 'often', 'letter',
];

export interface WordSet {
    id: string;
    label: string;
    words: string[];
}

@Injectable({ providedIn: 'root' })
export class WordSetService {
    readonly builtInSets: WordSet[] = [
        { id: 'english-200', label: 'English — Top 200', words: TOP_200_ENGLISH },
    ];

    shuffle(words: string[], count: number): string[] {
        const pool = [...words];
        const result: string[] = [];
        while (result.length < count) {
            if (pool.length === 0) {
                pool.push(...words);
            }
            const idx = Math.floor(Math.random() * pool.length);
            result.push(pool.splice(idx, 1)[0]);
        }
        return result;
    }

    parseTextFile(text: string, count = 200): string[] {
        const tokens = text
            .replace(/\r?\n/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 0);

        if (tokens.length === 0) return [];

        const result: string[] = [];
        let pos = 0;
        while (result.length < count) {
            result.push(tokens[pos % tokens.length]);
            pos++;
        }
        return result;
    }
}
