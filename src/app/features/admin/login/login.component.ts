import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="login-wrap">
  <div class="login-card">
    <div class="brand">🧋 Trà Sữa Mộc</div>
    <div class="subtitle">Admin Panel</div>
    <div class="form-group">
      <label>Tên đăng nhập</label>
      <input [(ngModel)]="username" placeholder="admin" (keyup.enter)="login()">
    </div>
    <div class="form-group">
      <label>Mật khẩu</label>
      <input type="password" [(ngModel)]="password" placeholder="••••••••" (keyup.enter)="login()">
    </div>
    @if (error) { <div class="error">{{ error }}</div> }
    <button class="btn-login" [disabled]="loading" (click)="login()">
      {{ loading ? 'Đang đăng nhập...' : '→ Đăng nhập' }}
    </button>
  </div>
</div>
  `,
  styles: [`
    .login-wrap { min-height:100vh;background:#f7f5f0;display:flex;align-items:center;justify-content:center;padding:20px }
    .login-card { background:#fff;border-radius:20px;padding:36px 32px;width:100%;max-width:380px;box-shadow:0 4px 24px rgba(0,0,0,0.08) }
    .brand { font-family:'Playfair Display',serif;font-size:24px;color:#c9a227;margin-bottom:4px }
    .subtitle { color:#888;font-size:14px;margin-bottom:28px }
    .form-group { margin-bottom:16px }
    .form-group label { display:block;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px }
    .form-group input { width:100%;padding:11px 14px;border:1px solid #e5e0d5;border-radius:10px;font-size:14px;outline:none;font-family:inherit }
    .form-group input:focus { border-color:#c9a227 }
    .error { color:#e05a4b;font-size:13px;margin-bottom:12px;padding:8px 12px;background:#fff5f5;border-radius:8px }
    .btn-login { width:100%;padding:14px;background:#c9a227;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px }
    .btn-login:disabled { opacity:0.6 }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  login() {
    if (!this.username || !this.password) { this.error = 'Vui lòng nhập đủ thông tin'; return; }
    this.loading = true; this.error = '';
    this.api.login(this.username, this.password).subscribe({
      next: res => { this.auth.setToken(res.token); this.router.navigate(['/admin']); },
      error: () => { this.error = 'Sai tên đăng nhập hoặc mật khẩu'; this.loading = false; }
    });
  }
}
