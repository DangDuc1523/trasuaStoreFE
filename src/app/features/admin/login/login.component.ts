import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="login-wrap">
  <div class="login-card">
    <div class="brand">🥤 HANA</div>
    <div class="subtitle">Admin Panel</div>
    <div class="form-group">
      <label>Tên đăng nhập</label>
      <input [(ngModel)]="username" placeholder="admin" (keyup.enter)="login()">
    </div>
    <div class="form-group">
      <label>Mật khẩu</label>
      <input type="password" [(ngModel)]="password" placeholder="••••••" (keyup.enter)="login()">
    </div>
    <div class="error" *ngIf="loginError">{{ errorText }}</div>
    <button class="login-btn" [disabled]="loading" (click)="login()">
      {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
    </button>
  </div>
</div>
  `,
  styles: [`
    .login-wrap { 
      height: 100vh; display: flex; align-items: center; justify-content: center; 
      background: #fdfaf5; font-family: 'Quicksand', sans-serif;
    }
    .login-card { 
      background: #fff; padding: 40px; border-radius: 32px; width: 100%; max-width: 400px; 
      box-shadow: 0 20px 50px rgba(123, 78, 42, 0.1); border: 1.5px solid #ece1d6;
      text-align: center;
    }
    .brand { font-family: 'Fredoka', sans-serif; font-size: 32px; font-weight: 700; color: #7b4e2a; margin-bottom: 8px; }
    .subtitle { color: #8c7366; font-size: 16px; font-weight: 600; margin-bottom: 32px; }
    .form-group { text-align: left; margin-bottom: 20px; }
    .form-group label { display: block; font-size: 14px; font-weight: 700; color: #4a3424; margin-bottom: 8px; }
    .form-group input { 
      width: 100%; padding: 14px 18px; background: #fdfaf5; border: 1.5px solid #ece1d6; 
      border-radius: 16px; font-family: inherit; font-size: 16px; outline: none; transition: 0.2s;
    }
    .form-group input:focus { border-color: #7b4e2a; background: #fff; }
    .error { color: #e66b5b; font-size: 14px; margin-bottom: 16px; font-weight: 600; }
    .login-btn { 
      width: 100%; padding: 16px; background: #7b4e2a; color: #fff; border: none; 
      border-radius: 18px; font-size: 16px; font-weight: 800; cursor: pointer; transition: 0.2s;
    }
    .login-btn:active { transform: scale(0.97); }
    .login-btn:disabled { opacity: 0.7; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  loginError = false;
  errorText = 'Sai tài khoản hoặc mật khẩu';

  constructor(
    private auth: AuthService, 
    private api: ApiService,
    private router: Router
  ) {}

  login() {
    this.loading = true;
    this.loginError = false;
    this.api.login(this.username, this.password).subscribe({
      next: (res) => {
        this.auth.setToken(res.token);
        this.router.navigate(['/admin/orders']);
      },
      error: () => { 
        this.loginError = true; 
        this.loading = false; 
      }
    });
  }
}
