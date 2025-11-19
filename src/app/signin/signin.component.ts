import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { login } from '../../services/interface';
import { Router } from '@angular/router';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
})
export class SigninComponent implements OnInit {
  loginForm: any = FormGroup;
  hide: boolean = true;
  labelName = [
    {
      name: "Username",
      field: 'userName',
      placeholder: 'Enter your username',
      type: 'text',
      hide: 'false',
    },
  ];
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      // orgId: [''],
      userName: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  login() {
    if (this.loginForm.valid) {
      let formData = this.loginForm.value;
      let userData: login = {
        username: formData.userName.trim(),
        password: formData.password.trim(),
        // orgId: formData.orgId.trim(),
      };
      this.authService
        .login(userData)
        .subscribe({
          next: (result: any) => {
            if (result) {
              this.snackbarService.openSnackbar(
                'You have been successfully login',
                'success'
              );
              const token = result.jwt;
              this.authService.addAccessToken(token);
              this.router.navigate(['/dashboard']);
            }
          },
          error: (error: HttpErrorResponse) => {
            if (error.status == 401) {
              this.snackbarService.openSnackbar(
                'Invalid username or password',
                'failed'
              );
            } else {
              this.snackbarService.openSnackbar(
                'Login failed. Please try again.',
                'failed'
              );
            }
          },
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
