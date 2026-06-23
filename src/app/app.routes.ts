import { Routes } from '@angular/router';
import { TypingTestComponent } from './components/typing-test/typing-test.component';
import { UploadComponent } from './components/upload/upload.component';

export const routes: Routes = [
    { path: '', component: TypingTestComponent },
    { path: 'upload', component: UploadComponent },
    { path: '**', redirectTo: '' },
];
