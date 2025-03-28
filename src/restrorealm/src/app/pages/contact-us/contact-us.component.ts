import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

@Component({
  selector: 'app-contact-us',
  imports: [CommonModule, FormsModule,],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent implements OnInit {
  
  contactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };
  
  subjects = [
    'General Inquiry',
    'Reservation Question',
    'Private Event',
    'Feedback',
    'Career Opportunity',
    'Press Inquiry'
  ];
  
  formSubmitted = false;
  formSuccess = false;
  formError = false;
  
  constructor() { }

  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
  
  submitForm(): void {
    this.formSubmitted = true;
    
    // Simulate form validation
    if (this.contactForm.name && this.contactForm.email && this.contactForm.message) {
      // Simulate API call success
      setTimeout(() => {
        this.formSuccess = true;
        this.formError = false;
        
        // Reset form after successful submission
        this.contactForm = {
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        };
        
        this.formSubmitted = false;
      }, 1500);
    } else {
      // Simulate API call failure
      setTimeout(() => {
        this.formSuccess = false;
        this.formError = true;
      }, 1500);
    }
  }
}
