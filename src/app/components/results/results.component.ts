import { Component, input, output } from '@angular/core';
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
}
