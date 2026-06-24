import { Injectable, signal, computed } from '@angular/core';

export type TestStatus = 'idle' | 'running' | 'finished';
export type TestMode = 'words' | 'timed';

export interface CharState {
    char: string;
    status: 'pending' | 'correct' | 'incorrect' | 'extra';
}

export interface WordState {
    chars: CharState[];
    originalLength: number;
    status: 'pending' | 'active' | 'correct' | 'incorrect';
    lineBreakBefore?: boolean;
    typedInput?: string;
}

export interface TestResult {
    wpm: number;
    rawWpm: number;
    cpm: number;
    rawCpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
    elapsedSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class TypingService {
    readonly words = signal<WordState[]>([]);
    readonly currentWordIndex = signal(0);
    readonly currentInput = signal('');
    readonly status = signal<TestStatus>('idle');
    readonly mode = signal<TestMode>('words');
    readonly timeLimit = signal(60); // seconds
    readonly elapsedTime = signal(0);
    readonly result = signal<TestResult | null>(null);
    readonly customWordPool = signal<string[]>([]);
    readonly totalErrors = signal(0);

    private startTimestamp: number | null = null;
    private timerInterval: ReturnType<typeof setInterval> | null = null;

    setCustomWordPool(words: string[]): void {
        this.customWordPool.set(words);
    }

    readonly timeLeft = computed(() => Math.max(0, Math.ceil(this.timeLimit() - this.elapsedTime())));

    readonly liveWpm = computed(() => {
        if (this.status() !== 'running') return 0;
        const elapsed = this.elapsedTime();
        if (elapsed === 0) return 0;
        let correctChars = 0;
        for (const word of this.words()) {
            for (const c of word.chars) {
                if (c.status === 'correct') correctChars++;
            }
        }
        const minutes = elapsed / 60;
        return Math.round(correctChars / 5 / minutes);
    });

    readonly liveAccuracy = computed(() => {
        if (this.status() !== 'running') return 100;
        let correctChars = 0;
        for (const word of this.words()) {
            for (const c of word.chars) {
                if (c.status === 'correct') correctChars++;
            }
        }
        const total = correctChars + this.totalErrors();
        return total > 0 ? Math.round((correctChars / total) * 100) : 100;
    });

    readonly progress = computed(() => {
        if (this.mode() === 'words') {
            const total = this.words().length;
            return total > 0 ? (this.currentWordIndex() / total) * 100 : 0;
        }
        const total = this.timeLimit();
        return total > 0 ? (this.elapsedTime() / total) * 100 : 0;
    });

    loadWords(wordList: string[]): void {
        this.reset();
        let nextLineBreak = false;
        const wordStates: WordState[] = [];
        for (const w of wordList) {
            if (w === '\n') {
                nextLineBreak = true;
                continue;
            }
            wordStates.push({
                chars: w.split('').map(c => ({ char: c, status: 'pending' as const })),
                originalLength: w.length,
                status: wordStates.length === 0 ? 'active' : 'pending',
                lineBreakBefore: nextLineBreak || undefined,
            });
            nextLineBreak = false;
        }
        this.words.set(wordStates);
    }

    startOrType(input: string): void {
        if (this.status() === 'finished') return;

        if (this.status() === 'idle') {
            this.start();
        }

        const words = [...this.words()];
        const idx = this.currentWordIndex();
        const currentWord = words[idx];
        if (!currentWord) return;

        // Detect space — advance to next word
        if (input.endsWith(' ')) {
            this.commitWord(input.trimEnd());
            return;
        }

        // Count errors for newly typed characters (not backspace/corrections)
        const prevInput = this.currentInput();
        if (input.length > prevInput.length) {
            const newCharIndex = input.length - 1;
            const newChar = input[newCharIndex];
            if (newCharIndex >= currentWord.originalLength) {
                // Extra character beyond word length → always an error
                this.totalErrors.update(e => e + 1);
            } else {
                const expectedChar = currentWord.chars[newCharIndex].char;
                if (newChar !== expectedChar) {
                    this.totalErrors.update(e => e + 1);
                }
            }
        }

        // Update char states for the current word
        const typedChars = input.split('');
        const originalLength = currentWord.originalLength;
        const updatedChars: CharState[] = currentWord.chars.slice(0, originalLength).map((c, i) => {
            if (i < typedChars.length) {
                return { char: c.char, status: typedChars[i] === c.char ? 'correct' : 'incorrect' };
            }
            return { char: c.char, status: 'pending' };
        });

        // Extra characters typed beyond the word length
        const extraChars: CharState[] = typedChars
            .slice(originalLength)
            .map(c => ({ char: c, status: 'extra' as const }));

        words[idx] = { ...currentWord, chars: [...updatedChars, ...extraChars] };
        this.words.set(words);
        this.currentInput.set(input);
    }

    private commitWord(typed: string): void {
        const words = [...this.words()];
        const idx = this.currentWordIndex();
        const currentWord = words[idx];
        if (!currentWord) return;

        // Mark word as correct/incorrect
        const originalLength = currentWord.originalLength;
        const expectedWord = currentWord.chars
            .slice(0, originalLength)
            .map(c => c.char)
            .join('');

        const finalChars: CharState[] = currentWord.chars.slice(0, originalLength).map((c, i) => {
            const typedChar = typed[i];
            if (!typedChar) return { char: c.char, status: 'incorrect' };
            return { char: c.char, status: typedChar === c.char ? 'correct' : 'incorrect' };
        });

        // Extra chars from typed input
        const extraChars: CharState[] = typed
            .slice(expectedWord.length)
            .split('')
            .map(c => ({ char: c, status: 'extra' as const }));

        const wordCorrect = typed === expectedWord;
        words[idx] = {
            ...currentWord,
            chars: [...finalChars, ...extraChars],
            status: wordCorrect ? 'correct' : 'incorrect',
            typedInput: typed,
        };

        const nextIdx = idx + 1;
        if (nextIdx < words.length) {
            words[nextIdx] = { ...words[nextIdx], status: 'active' };
            this.currentWordIndex.set(nextIdx);
            this.currentInput.set('');
        } else {
            // All words typed — finish early
            this.words.set(words);
            this.finish();
            return;
        }

        this.words.set(words);
    }

    handleBackspace(input: string): void {
        if (this.status() === 'finished') return;
        const words = [...this.words()];
        const idx = this.currentWordIndex();
        const currentWord = words[idx];
        if (!currentWord) return;

        // Go back to previous word on same line when backspacing on empty input
        if (input === '' && idx > 0 && !currentWord.lineBreakBefore) {
            const prevWord = words[idx - 1];
            const restoredInput = prevWord.typedInput ?? '';

            // Reset current word to pending
            words[idx] = {
                ...currentWord,
                status: 'pending',
                chars: currentWord.chars.slice(0, currentWord.originalLength).map(c => ({
                    char: c.char,
                    status: 'pending' as const,
                })),
                typedInput: undefined,
            };

            // Restore previous word to active
            words[idx - 1] = { ...prevWord, status: 'active' };

            this.currentWordIndex.set(idx - 1);
            this.currentInput.set(restoredInput);
            this.words.set(words);
            return;
        }

        const typedChars = input.split('');
        const originalLength = currentWord.originalLength;
        const updatedChars: CharState[] = currentWord.chars.slice(0, originalLength).map((c, i) => {
            if (i < typedChars.length) {
                return { char: c.char, status: typedChars[i] === c.char ? 'correct' : 'incorrect' };
            }
            return { char: c.char, status: 'pending' };
        });

        const extraChars: CharState[] = typedChars
            .slice(originalLength)
            .map(c => ({ char: c, status: 'extra' as const }));

        words[idx] = { ...currentWord, chars: [...updatedChars, ...extraChars] };
        this.words.set(words);
        this.currentInput.set(input);
    }

    private start(): void {
        this.status.set('running');
        this.startTimestamp = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.startTimestamp!) / 1000;
            this.elapsedTime.set(elapsed);
            if (this.mode() === 'timed' && elapsed >= this.timeLimit()) {
                this.finish();
            }
        }, 250);
    }

    finish(): void {
        if (this.status() === 'finished') return;
        this.clearTimer();
        this.status.set('finished');

        const elapsed = this.startTimestamp
            ? (Date.now() - this.startTimestamp) / 1000
            : this.timeLimit();

        let correctChars = 0;

        for (const word of this.words()) {
            for (const c of word.chars) {
                if (c.status === 'correct') correctChars++;
            }
        }

        const incorrectChars = this.totalErrors();
        const totalTypedChars = correctChars + incorrectChars;
        const minutes = elapsed / 60;
        const wpm = Math.round(correctChars / 5 / minutes);
        const rawWpm = Math.round(totalTypedChars / 5 / minutes);
        const cpm = Math.round(correctChars / minutes);
        const rawCpm = Math.round(totalTypedChars / minutes);
        const accuracy = totalTypedChars > 0
            ? Math.round((correctChars / totalTypedChars) * 100)
            : 100;

        this.result.set({ wpm, rawWpm, cpm, rawCpm, accuracy, correctChars, incorrectChars, elapsedSeconds: Math.round(elapsed) });
    }

    reset(): void {
        this.clearTimer();
        this.status.set('idle');
        this.currentWordIndex.set(0);
        this.currentInput.set('');
        this.elapsedTime.set(0);
        this.result.set(null);
        this.startTimestamp = null;
        this.words.set([]);
        this.totalErrors.set(0);
    }

    setTimeLimit(seconds: number): void {
        if (this.status() === 'idle') {
            this.timeLimit.set(seconds);
        }
    }

    setMode(mode: TestMode): void {
        if (this.status() === 'running') return;
        this.mode.set(mode);
    }

    private clearTimer(): void {
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}
