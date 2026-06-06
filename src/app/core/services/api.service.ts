import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuItem, Order, PlaceOrderDto } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ── Menu (public) ────────────────────────────────────────
  getMenu(category?: string): Observable<MenuItem[]> {
    const params = category ? `?category=${category}` : '';
    return this.http.get<MenuItem[]>(`${this.base}/menu${params}`);
  }

  // ── Menu (admin) ─────────────────────────────────────────
  getMenuAdmin(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.base}/menu/all`);
  }
  createMenuItem(data: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.base}/menu`, data);
  }
  updateMenuItem(id: number, data: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.base}/menu/${id}`, data);
  }
  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/menu/${id}`);
  }

  // ── Orders ───────────────────────────────────────────────
  placeOrder(dto: PlaceOrderDto): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders`, dto);
  }
  getOrders(status?: string): Observable<Order[]> {
    const params = status ? `?status=${status}` : '';
    return this.http.get<Order[]>(`${this.base}/orders${params}`);
  }
  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${id}/status`, { status });
  }
  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/orders/${id}`);
  }

  // ── Auth ─────────────────────────────────────────────────
  login(username: string, password: string) {
    return this.http.post<{ token: string; username: string }>(
      `${this.base}/auth/login`, { username, password }
    );
  }
}
