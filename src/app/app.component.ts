import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { FileValidator } from 'ngx-material-file-input';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'SK Typing';
  formDoc: FormGroup;
  maxSize = 100;
  text = '';

  constructor(private _fb: FormBuilder) { }

  ngOnInit() {
    this.formDoc = this._fb.group({
      basicFile: []
    });
  }

  onSubmit(form: FormGroup) {}

  onSelectFile(event) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();

      reader.readAsText(event.target.files[0], 'windows-1250'); // read file as data url

      reader.onload = (e) => { // called once readAsDataURL is completed
        this.text = e.target.result;
      };
    }
  }

}
