import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-toaster',
  imports: [ CommonModule ],
  templateUrl: './toaster.component.html',
  styleUrl: './toaster.component.css',
  standalone: true
})
export class ToasterComponent {

  @Input() message: string | null = null;

  @Input() type: 'success' | 'error' = 'success';

  constructor() { }

  close() {
    this.message = null;
  }
  

}
