import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {
  date: any;
  constructor() { }

  ngOnInit(): void {
    this.date = new Date().getFullYear();
   }

}
