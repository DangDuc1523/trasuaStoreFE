import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-order-manage',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="admin-wrap">
  <!-- Topbar -->
  <div class="topbar">
    <div class="brand">🧋 Admin Panel</div>
    <div class="topbar-actions">
      <a routerLink="/admin/menu" class="nav-btn">🍽 Menu</a>
      <button class="nav-btn logout" (click)="logout()">Đăng xuất</button>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats">
    <div class="stat"><div class="stat-val">{{ orders.length }}</div><div class="stat-label">Tổng đơn</div></div>
    <div class="stat"><div class="stat-val">{{ pendingCount }}</div><div class="stat-label">Chờ làm</div></div>
    <div class="stat"><div class="stat-val" style="font-size:14px">{{ revenue | number }}đ</div><div class="stat-label">Doanh thu</div></div>
  </div>

  <!-- Filter tabs -->
  <div class="section-bar">
    <h2>📋 Danh sách đơn</h2>
    <button class="clear-btn" (click)="clearDone()">Xoá đơn xong</button>
  </div>
  <div class="tabs">
    <button class="tab-btn" [class.active]="filter===''" (click)="setFilter('')">Tất cả</button>
    <button class="tab-btn" [class.active]="filter==='new'" (click)="setFilter('new')">🔴 Mới</button>
    <button class="tab-btn" [class.active]="filter==='making'" (click)="setFilter('making')">🔵 Đang làm</button>
    <button class="tab-btn" [class.active]="filter==='done'" (click)="setFilter('done')">✅ Xong</button>
  </div>

  <!-- Orders -->
  <div class="orders">
    @for (order of filteredOrders; track order.id) {
      <div class="order-card" [class.done]="order.status==='done'">
        <div class="order-head">
          <div class="order-table">📍 Bàn {{ order.tableNumber }}</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="order-time">⏱ {{ order.createdAt }}</div>
            <div class="status-badge" [ngClass]="'badge-'+order.status">{{ statusLabel(order.status) }}</div>
          </div>
        </div>
        <div class="order-items">
          @for (item of order.items; track item.name) {
            <div class="order-item-row">
              <div>
                <div class="item-row-name">{{ item.name }}</div>
                @if (item.note) { <div class="item-row-note">📝 {{ item.note }}</div> }
                <div class="item-row-qty">x{{ item.quantity }}</div>
              </div>
              <div class="item-row-price">{{ item.unitPrice | number }}đ</div>
            </div>
          }
        </div>
        <div class="order-foot">
          <div>
            <div style="font-size:13px;font-weight:600">Tổng đơn</div>
            <div class="order-total">{{ order.total | number }}đ</div>
          </div>
          <div class="action-btns">
            @if (order.status === 'new') {
              <button class="action-btn btn-making" (click)="updateStatus(order, 'making')">🔵 Đang làm</button>
            }
            @if (order.status === 'making') {
              <button class="action-btn btn-done" (click)="updateStatus(order, 'done')">✅ Xong</button>
            }
            <button class="action-btn btn-delete" (click)="deleteOrder(order)">🗑</button>
          </div>
        </div>
      </div>
    }
    @if (filteredOrders.length === 0) {
      <div class="empty"><div style="font-size:48px">☕</div><div>Chưa có đơn hàng nào</div></div>
    }
  </div>
</div>
  `,
  styles: [`
    .admin-wrap { background:#f7f5f0;min-height:100vh;font-family:'DM Sans',sans-serif;color:#1a1a1a;padding-bottom:40px }
    .topbar { background:#fff;border-bottom:1px solid #e5e0d5;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50 }
    .brand { font-family:'Playfair Display',serif;font-size:20px;color:#c9a227 }
    .topbar-actions { display:flex;gap:8px;align-items:center }
    .nav-btn { padding:7px 14px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid #e5e0d5;background:#f0ede5;cursor:pointer;color:#1a1a1a;text-decoration:none }
    .nav-btn.logout { color:#e05a4b;border-color:#e05a4b;background:transparent }
    .stats { display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:20px 16px 8px }
    .stat { background:#fff;border:1px solid #e5e0d5;border-radius:14px;padding:14px 16px;text-align:center }
    .stat-val { font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:#c9a227 }
    .stat-label { font-size:11px;color:#888;margin-top:2px;font-weight:500 }
    .section-bar { display:flex;align-items:center;justify-content:space-between;padding:16px 16px 8px }
    .section-bar h2 { font-size:15px;font-weight:600 }
    .clear-btn { font-size:12px;color:#e05a4b;cursor:pointer;background:none;border:none }
    .tabs { display:flex;gap:8px;padding:0 16px 12px;overflow-x:auto;scrollbar-width:none }
    .tab-btn { white-space:nowrap;padding:6px 14px;border-radius:16px;font-size:12px;border:1px solid #e5e0d5;background:#fff;color:#888;cursor:pointer;font-weight:500 }
    .tab-btn.active { background:#c9a227;border-color:#c9a227;color:#fff }
    .orders { padding:0 16px;display:flex;flex-direction:column;gap:12px }
    .order-card { background:#fff;border:1px solid #e5e0d5;border-radius:16px;overflow:hidden }
    .order-card.done { opacity:0.55 }
    .order-head { display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e5e0d5 }
    .order-table { font-weight:700;font-size:16px }
    .order-time { font-size:12px;color:#888 }
    .status-badge { padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700 }
    .badge-new { background:#fff3cd;color:#856404 }
    .badge-making { background:#d1ecf1;color:#0c5460 }
    .badge-done { background:#d4edda;color:#155724 }
    .order-items { padding:12px 16px }
    .order-item-row { display:flex;justify-content:space-between;align-items:flex-start;padding:5px 0;border-bottom:1px dashed #e5e0d5 }
    .order-item-row:last-child { border-bottom:none }
    .item-row-name { font-size:14px;font-weight:500 }
    .item-row-note { font-size:11px;color:#888;margin-top:1px }
    .item-row-qty { font-size:13px;color:#888 }
    .item-row-price { font-family:'Playfair Display',serif;font-size:14px;color:#c9a227;font-weight:700 }
    .order-foot { display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f0ede5;border-top:1px solid #e5e0d5 }
    .order-total { font-family:'Playfair Display',serif;font-size:18px;color:#c9a227;font-weight:700 }
    .action-btns { display:flex;gap:8px }
    .action-btn { padding:7px 14px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;border:none }
    .btn-making { background:#0c5460;color:#fff }
    .btn-done { background:#2d9e5c;color:#fff }
    .btn-delete { background:#fff;border:1px solid #e5e0d5;color:#888 }
    .empty { text-align:center;padding:60px 20px;color:#888 }
  `]
})
export class OrderManageComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filter = '';
  private timer?: ReturnType<typeof setInterval>;

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit() { this.load(); this.timer = setInterval(() => this.load(), 5000); }
  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  load() { this.api.getOrders().subscribe(o => this.orders = o); }

  get filteredOrders() { return this.filter ? this.orders.filter(o => o.status === this.filter) : this.orders; }
  get pendingCount() { return this.orders.filter(o => o.status === 'new').length; }
  get revenue() { return this.orders.filter(o => o.status === 'done').reduce((s, o) => s + o.total, 0); }

  setFilter(f: string) { this.filter = f; }
  statusLabel(s: string) { return { new: 'Mới', making: 'Đang làm', done: 'Hoàn thành' }[s] ?? s; }

  updateStatus(order: Order, status: string) {
    this.api.updateOrderStatus(order.id, status).subscribe(updated => {
      const idx = this.orders.findIndex(o => o.id === order.id);
      if (idx >= 0) this.orders[idx] = updated;
    });
  }

  deleteOrder(order: Order) {
    this.api.deleteOrder(order.id).subscribe(() => {
      this.orders = this.orders.filter(o => o.id !== order.id);
    });
  }

  clearDone() {
    const doneOrders = this.orders.filter(o => o.status === 'done');
    Promise.all(doneOrders.map(o => this.api.deleteOrder(o.id).toPromise())).then(() => this.load());
  }

  logout() { this.auth.logout(); this.router.navigate(['/admin/login']); }
}
