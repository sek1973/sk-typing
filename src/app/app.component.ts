import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { FileUploadService } from './fileupload.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'SK Typing';
  form: FormGroup;
  maxSize = 100;
  text = '';
  fileInputDisplay = 'flex';
  private mutationObserver: MutationObserver;

  constructor(private _fb: FormBuilder,
    private fileUpload: FileUploadService) { }

  ngOnInit() {
    this.mutationObserver = new MutationObserver((mutations) => {
      this.fileInputDisplay = 'flex';
    });

    const node = document.querySelector('p[id="tekst"]');

    this.mutationObserver.observe(node, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });

    this.form = this._fb.group({
      file: []
    });

    this.fileUpload.onLoadStart().subscribe((txt) => {
      this.fileInputDisplay = 'none';
    });
    this.fileUpload.onProgress().subscribe((val) => console.log(`Loaded: ${val}%`));
    this.fileUpload.onLoadEnd().subscribe((txt) => {
      this.text = txt;
    });
  }

  onSubmit(form: FormGroup) {}

  onSelectFile(event) {
    this.fileUpload.uploadText(event);
  }

}
