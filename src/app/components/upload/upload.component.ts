import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TypingService } from '../../services/typing.service';
import { WordSetService } from '../../services/word-set.service';

@Component({
    selector: 'app-upload',
    imports: [],
    templateUrl: './upload.component.html',
    styleUrl: './upload.component.scss',
})
export class UploadComponent {
    private readonly typing = inject(TypingService);
    private readonly wordSets = inject(WordSetService);
    private readonly router = inject(Router);

    protected isDragging = signal(false);
    protected fileName = signal('');
    protected error = signal('');
    protected wordCount = signal(0);
    protected preview = signal<string[]>([]);

    private parsedWords: string[] = [];

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragging.set(true);
    }

    onDragLeave(): void {
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging.set(false);
        const file = event.dataTransfer?.files[0];
        if (file) this.readFile(file);
    }

    onFileSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) this.readFile(file);
    }

    private readFile(file: File): void {
        this.error.set('');

        if (!file.type.startsWith('text/') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
            this.error.set('Only plain text files (.txt, .md) are supported.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.error.set('File is too large. Maximum size is 5 MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const words = this.wordSets.parseTextFile(text, 300);
            if (words.length === 0) {
                this.error.set('No words found in the file.');
                return;
            }
            this.parsedWords = words;
            this.fileName.set(file.name);
            this.wordCount.set(words.length);
            this.preview.set(words.slice(0, 20));
        };
        reader.onerror = () => {
            this.error.set('Failed to read the file.');
        };
        reader.readAsText(file);
    }

    startTest(): void {
        if (this.parsedWords.length === 0) return;
        this.typing.reset();
        this.typing.loadWords(this.parsedWords);
        this.router.navigate(['/']);
    }

    cancel(): void {
        this.router.navigate(['/']);
    }
}
