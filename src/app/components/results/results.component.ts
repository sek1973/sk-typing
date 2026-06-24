import { Component, input, output, HostListener } from '@angular/core';
import { TestResult } from '../../services/typing.service';

@Component({
    selector: 'app-results',
    imports: [],
    templateUrl: './results.component.html',
    styleUrl: './results.component.scss',
})
export class ResultsComponent {
    result = input.required<TestResult>();
    restart = output<void>();

    onRestart(): void {
        this.restart.emit();
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
            this.restart.emit();
        }
    }
}
