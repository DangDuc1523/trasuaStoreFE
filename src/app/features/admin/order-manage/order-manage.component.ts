import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-order-manage',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="admin-layout">
  <!-- Desktop Sidebar / Mobile Bottom Nav -->
  <aside class="sidebar">
    <div class="sidebar-brand">🥤 HANA</div>
    <nav class="nav-menu">
      <a routerLink="/admin/orders" class="nav-item active">
        <span class="icon">📋</span>
        <span class="label">Đơn hàng</span>
      </a>
      <a routerLink="/admin/menu" class="nav-item">
        <span class="icon">🍽</span>
        <span class="label">Thực đơn</span>
      </a>
    </nav>
    <button class="logout-btn-desktop" (click)="logout()">🚪 Đăng xuất</button>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <header class="page-header">
      <div class="header-left">
        <h1>Đơn hàng</h1>
        <p class="subtitle">Quản lý pha chế & giao món</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" (click)="load()" title="Làm mới">🔄</button>
        <button class="btn-logout-mobile" (click)="logout()">🚪</button>
      </div>
    </header>

    <!-- Stats Row (Optimized for Mobile) -->
    <div class="stats-scroll">
      <div class="stat-card new">
        <span class="stat-label">Chờ làm</span>
        <span class="stat-val">{{ pendingCount }}</span>
      </div>
      <div class="stat-card making">
        <span class="stat-label">Đang làm</span>
        <span class="stat-val">{{ makingCount }}</span>
      </div>
      <div class="stat-card revenue">
        <span class="stat-label">Doanh thu</span>
        <span class="stat-val">{{ revenue | number }}đ</span>
      </div>
    </div>

    <!-- Filter Tabs (Optimized for Mobile) -->
    <div class="filter-bar">
      <div class="category-chips">
        <button [class.active]="filter===''" (click)="setFilter('')">Tất cả</button>
        <button [class.active]="filter==='new'" (click)="setFilter('new')">🔴 Mới</button>
        <button [class.active]="filter==='making'" (click)="setFilter('making')">🔵 Đang làm</button>
        <button [class.active]="filter==='done'" (click)="setFilter('done')">✅ Xong</button>
      </div>
      @if (doneCount > 0) {
        <button class="btn-clear-done" (click)="clearDone()">Dọn đơn xong</button>
      }
    </div>

    <!-- Orders List -->
    <div class="orders-list">
      @for (order of filteredOrders; track order.id) {
        <div class="order-card" [class.is-done]="order.status==='done'">
          <div class="order-card-header">
            <div class="order-title">
              <span class="table-tag">Bàn {{ order.tableNumber }}</span>
              <span class="time-tag">{{ order.createdAt }}</span>
            </div>
            <div class="status-badge" [ngClass]="'status-'+order.status">
              {{ statusLabel(order.status) }}
            </div>
          </div>

          <div class="order-items-box">
            @for (item of order.items; track $index) {
              <div class="order-item-row">
                <div class="item-info">
                  <span class="item-qty">{{ item.quantity }}x</span>
                  <span class="item-name">{{ item.name }}</span>
                </div>
                @if (item.note) { <div class="item-note">📝 {{ item.note }}</div> }
              </div>
            }
          </div>

          <div class="order-card-footer">
            <div class="total-info">
              <span class="total-label">Tổng tiền</span>
              <span class="total-val">{{ order.total | number }}đ</span>
            </div>
            <div class="order-actions">
              @if (order.status === 'new') {
                <button class="btn-step start" (click)="updateStatus(order, 'making')">Bắt đầu làm</button>
              }
              @if (order.status === 'making') {
                <button class="btn-step finish" (click)="updateStatus(order, 'done')">Hoàn thành</button>
              }
              <button class="btn-del-order" (click)="deleteOrder(order)">🗑</button>
            </div>
          </div>
        </div>
      }
    </div>

    @if (filteredOrders.length === 0) {
      <div class="empty-state">
        <div class="empty-icon">☕</div>
        <p>Hiện không có đơn hàng nào</p>
      </div>
    }
  </main>

  <!-- Mobile Bottom Nav Spacer -->
  <div class="nav-spacer"></div>
</div>
  `,
  styles: [`
    :host { --bg: #000000; --card: #121212; --text: #ffffff; --text-sec: #999999; --gold: #e8c547; --border: #222222; --red: #ff4d4d; --blue: #0096ff; --green: #2d9e5c; display: block; font-family: 'Quicksand', sans-serif; }
    
    .admin-layout { display: flex; min-height: 100vh; background: var(--bg); color: var(--text); }

    /* Sidebar & Bottom Nav */
    .sidebar { width: 240px; background: var(--card); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 0; position: sticky; top: 0; height: 100vh; z-index: 1000; }
    .sidebar-brand { font-family: 'Fredoka', sans-serif; font-size: 26px; color: var(--gold); padding: 0 24px 30px; font-weight: 700; }
    .nav-menu { flex: 1; padding: 0 12px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; color: var(--text-sec); text-decoration: none; font-weight: 700; margin-bottom: 6px; transition: 0.2s; }
    .nav-item.active { background: var(--gold); color: #000; }
    .logout-btn-desktop { margin: 20px 12px 0; padding: 12px; background: transparent; border: 1px solid var(--border); color: var(--red); border-radius: 12px; font-weight: 700; cursor: pointer; }

    /* Content Area */
    .main-content { flex: 1; padding: 24px; max-width: 1000px; margin: 0 auto; width: 100%; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { font-family: 'Fredoka', sans-serif; font-size: 28px; }
    .subtitle { color: var(--text-sec); font-size: 14px; font-weight: 600; }
    
    .header-actions { display: flex; gap: 10px; }
    .btn-refresh { background: var(--card); border: 1px solid var(--border); color: var(--text); width: 44px; height: 44px; border-radius: 12px; cursor: pointer; font-size: 18px; }
    .btn-logout-mobile { display: none; background: rgba(255,77,77,0.1); border: 1px solid rgba(255,77,77,0.2); color: var(--red); width: 44px; height: 44px; border-radius: 12px; cursor: pointer; font-size: 18px; }

    /* Stats Scroll */
    .stats-scroll { display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none; margin-bottom: 24px; padding-bottom: 4px; }
    .stats-scroll::-webkit-scrollbar { display: none; }
    .stat-card { flex: 1; min-width: 140px; background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .stat-label { font-size: 12px; font-weight: 700; color: var(--text-sec); text-transform: uppercase; }
    .stat-val { font-size: 24px; font-weight: 800; }
    .stat-card.revenue .stat-val { color: var(--gold); }
    .stat-card.new { border-left: 4px solid var(--red); }
    .stat-card.making { border-left: 4px solid var(--blue); }

    /* Filter Chips */
    .filter-bar { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
    .category-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
    .category-chips::-webkit-scrollbar { display: none; }
    .category-chips button { white-space: nowrap; background: var(--card); border: 1px solid var(--border); color: var(--text-sec); padding: 8px 18px; border-radius: 50px; font-weight: 700; cursor: pointer; font-family: inherit; font-size: 13px; }
    .category-chips button.active { background: var(--text); color: #000; border-color: var(--text); }
    .btn-clear-done { align-self: flex-start; background: none; border: none; color: var(--text-sec); font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: underline; }

    /* Orders List */
    .orders-list { display: flex; flex-direction: column; gap: 16px; }
    .order-card { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 16px; transition: 0.2s; }
    .order-card:active { transform: scale(0.98); }
    .order-card.is-done { opacity: 0.5; border-style: dashed; }

    .order-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .order-title { display: flex; flex-direction: column; gap: 4px; }
    .table-tag { font-family: 'Fredoka', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); }
    .time-tag { font-size: 12px; color: var(--text-sec); font-weight: 600; }
    
    .status-badge { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-new { background: rgba(255, 77, 77, 0.1); color: var(--red); }
    .status-making { background: rgba(0, 150, 255, 0.1); color: var(--blue); }
    .status-done { background: rgba(45, 158, 92, 0.1); color: var(--green); }

    .order-items-box { background: var(--bg); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
    .order-item-row { display: flex; flex-direction: column; gap: 2px; }
    .item-info { display: flex; gap: 8px; font-weight: 700; font-size: 14px; }
    .item-qty { color: var(--gold); }
    .item-note { font-size: 12px; color: var(--text-sec); font-style: italic; margin-left: 24px; }

    .order-card-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 12px; border-top: 1px dashed var(--border); }
    .total-info { display: flex; flex-direction: column; gap: 2px; }
    .total-label { font-size: 11px; font-weight: 700; color: var(--text-sec); text-transform: uppercase; }
    .total-val { font-size: 18px; font-weight: 800; color: var(--gold); }
    
    .order-actions { display: flex; gap: 8px; }
    .btn-step { border: none; padding: 10px 16px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; font-family: inherit; }
    .btn-step.start { background: var(--blue); color: #fff; }
    .btn-step.finish { background: var(--green); color: #fff; }
    .btn-del-order { background: rgba(255,77,77,0.05); border: 1px solid rgba(255,77,77,0.1); color: var(--red); width: 40px; height: 40px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

    .empty-state { text-align: center; padding: 80px 0; color: var(--text-sec); }
    .empty-icon { font-size: 48px; margin-bottom: 10px; opacity: 0.2; }

    /* Mobile Logic (Bottom Nav) */
    @media (max-width: 768px) {
      .sidebar { 
        width: 100%; height: auto; position: fixed; top: auto; bottom: 0; 
        flex-direction: row; border-right: none; border-top: 1px solid var(--border);
        padding: 0; padding-bottom: env(safe-area-inset-bottom);
      }
      .sidebar-brand, .logout-btn-desktop { display: none; }
      .nav-menu { display: flex; width: 100%; padding: 4px 10px; }
      .nav-item { flex: 1; flex-direction: column; gap: 4px; padding: 8px; margin-bottom: 0; border-radius: 8px; }
      .nav-item .icon { font-size: 20px; }
      .nav-item .label { font-size: 10px; }
      .nav-item.active { background: transparent; color: var(--gold); }
      
      .main-content { padding: 16px; padding-top: 24px; }
      .page-header h1 { font-size: 24px; }
      .btn-logout-mobile { display: block; }
      .nav-spacer { height: 80px; }
      
      .stat-card { min-width: 120px; padding: 12px; }
      .stat-val { font-size: 20px; }
    }
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
  get makingCount() { return this.orders.filter(o => o.status === 'making').length; }
  get doneCount() { return this.orders.filter(o => o.status === 'done').length; }
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
    if (confirm('Xoá đơn hàng này?')) {
      this.api.deleteOrder(order.id).subscribe(() => {
        this.orders = this.orders.filter(o => o.id !== order.id);
      });
    }
  }

  clearDone() {
    if (confirm('Xoá tất cả đơn đã hoàn thành?')) {
      const doneOrders = this.orders.filter(o => o.status === 'done');
      Promise.all(doneOrders.map(o => this.api.deleteOrder(o.id).toPromise())).then(() => this.load());
    }
  }

  logout() { this.auth.logout(); this.router.navigate(['/admin/login']); }
}
