import { AbstractControl } from "@angular/forms";

export function validDateFormatValidator(control: AbstractControl) {
    if (!control.value) return null;
  
    const birthDate = new Date(control.value);
    const today = new Date();
  
    if (birthDate > today) {
      return { futureDate: true };
    }
    return null;
  }
  