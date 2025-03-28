import { ValidatorFn, AbstractControl } from "@angular/forms";

export function minimumAgeValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return null;
  
      const birthDate = new Date(control.value);
      const today = new Date();
      
      const age = today.getFullYear() - birthDate.getFullYear();
      const isBirthdayPassedThisYear =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  
      const actualAge = isBirthdayPassedThisYear ? age : age - 1;
  
      return actualAge >= minAge ? null : { minAge: { requiredAge: minAge, actualAge } };
    };
  }
  