import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { MatFileUploadModule, MatFileUploadQueue } from 'angular-material-fileupload';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MatFileUploadModule,
    MatButtonModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
