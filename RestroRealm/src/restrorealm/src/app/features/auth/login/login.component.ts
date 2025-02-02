import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToasterComponent } from '../../../shared/components/toaster/toaster.component';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Import HttpClientModule

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToasterComponent,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  toast: {
    message: string;
    type: 'success' | 'error';
  } | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  handleLogin() {
    if (this.loginForm.invalid) {
      this.toast = { message: 'Please fill all required fields correctly.', type: 'error' };
      return;
    }

    this.loading = true;

    this.authService.login(this.email?.value, this.password?.value).subscribe({
      next: () => {
      this.toast = { message: 'Login successful!', type: 'success' };
      setTimeout(() => {
        this.toast = null;
        this.router.navigate(['/dashboard']);
      }, 3000);
      },
      error: () => {
      this.toast = { message: 'Invalid credentials.', type: 'error' };
      setTimeout(() => {
        this.toast = null;
      }, 3000);
      this.loading = false;
      },
      complete: () => {
      this.loading = false;
      },
    });
  }
}
