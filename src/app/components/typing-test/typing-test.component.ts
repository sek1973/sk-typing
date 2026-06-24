import {
    Component,
    inject,
    OnDestroy,
    AfterViewInit,
    ViewChild,
    ElementRef,
    effect,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TypingService, TestMode } from '../../services/typing.service';
import { WordSetService } from '../../services/word-set.service';
import { ResultsComponent } from '../results/results.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-typing-test',
    imports: [FormsModule, ResultsComponent, RouterLink],
    templateUrl: './typing-test.component.html',
    styleUrl: './typing-test.component.scss',
})
export class TypingTestComponent implements AfterViewInit, OnDestroy {
    protected readonly typing = inject(TypingService);
    protected readonly wordSets = inject(WordSetService);

    @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;
    @ViewChild('wordsContainer') wordsContainerEl!: ElementRef<HTMLDivElement>;

    protected timeLimits = [30, 60, 90, 120];
    protected inputFocused = signal(false);

    constructor() {
        // Auto-scroll current word into view
        effect(() => {
            const idx = this.typing.currentWordIndex();
            this.scrollCurrentWordIntoView(idx);
        });
    }

    ngAfterViewInit(): void {
        this.initTest();
        this.focusInput();
    }

    ngOnDestroy(): void {
        this.typing.reset();
    }

    initTest(): void {
        const customPool = this.typing.customWordPool();
        if (customPool.length > 0) {
            this.typing.loadWords(customPool);
        } else {
            const set = this.wordSets.builtInSets[0];
            const words = this.wordSets.shuffle(set.words, 200);
            this.typing.loadWords(words);
        }
    }

    restart(): void {
        this.initTest();
        setTimeout(() => this.focusInput());
    }

    onInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        if (value.endsWith(' ')) {
            this.typing.startOrType(value);
            if (this.inputEl) {
                this.inputEl.nativeElement.value = '';
            }
        } else {
            this.typing.startOrType(value);
        }
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Backspace') {
            const value = (event.target as HTMLInputElement).value;
            // Allow natural backspace; reflect updated value after DOM updates
            setTimeout(() => {
                const updated = this.inputEl?.nativeElement.value ?? '';
                this.typing.handleBackspace(updated);
            });
        }
        if (event.key === 'Escape') {
            this.restart();
        }
        if (event.key === 'Tab') {
            event.preventDefault();
            this.restart();
        }
    }

    setTimeLimit(seconds: number): void {
        this.typing.reset();
        this.typing.setTimeLimit(seconds);
        this.initTest();
        setTimeout(() => this.focusInput());
    }

    setMode(mode: TestMode): void {
        this.typing.setMode(mode);
        this.typing.reset();
        this.initTest();
        setTimeout(() => this.focusInput());
    }

    focusInput(): void {
        this.inputEl?.nativeElement.focus();
    }

    onInputFocus(): void {
        this.inputFocused.set(true);
    }

    onInputBlur(): void {
        this.inputFocused.set(false);
    }

    private scrollCurrentWordIntoView(idx: number): void {
        if (!this.wordsContainerEl) return;
        const container = this.wordsContainerEl.nativeElement;
        const wordEls = container.querySelectorAll<HTMLElement>('.word');
        const target = wordEls[idx];
        if (!target) return;

        const containerTop = container.getBoundingClientRect().top;
        const wordTop = target.getBoundingClientRect().top;
        const relativeTop = wordTop - containerTop;

        // If word is below the visible 3rd row, scroll to keep it visible
        if (relativeTop > container.clientHeight * 0.55) {
            container.scrollTop += relativeTop - container.clientHeight * 0.2;
        }
        // If word is above view (shouldn't happen, but handle gracefully)
        if (relativeTop < 0) {
            container.scrollTop += relativeTop - 8;
        }
    }
}
