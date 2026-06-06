import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'tm_token';

  setToken(token: string) { localStorage.setItem(this.TOKEN_KEY, token); }
  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  isLoggedIn(): boolean { return !!this.getToken(); }
  logout() { localStorage.removeItem(this.TOKEN_KEY); }
}
