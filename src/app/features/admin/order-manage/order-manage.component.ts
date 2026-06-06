import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order, OrderItem } from '../../../core/models';
import { forkJoin } from 'rxjs';

interface TableBill {
  tableNumber: string;
  total: number;
  orderCount: number;
  orderIds: number[];
  items: OrderItem[];
}

@Component({
  selector: 'app-order-manage',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="theme-wrapper" [class.dark-theme]="isDarkMode()">
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
          <p class="subtitle">Quản lý pha chế & thanh toán</p>
        </div>
        <div class="header-actions">
          <button class="btn-theme" (click)="toggleTheme()" [title]="isDarkMode() ? 'Chế độ sáng' : 'Chế độ tối'">
            {{ isDarkMode() ? '☀️' : '🌙' }}
          </button>
          <button class="btn-sound" [class.muted]="!soundEnabled" (click)="toggleSound()" [title]="soundEnabled ? 'Tắt âm báo' : 'Bật âm báo'">
            {{ soundEnabled ? '🔔' : '🔕' }}
          </button>
          <button class="btn-refresh" (click)="load()" title="Làm mới">🔄</button>
          <button class="btn-logout-mobile" (click)="logout()">🚪</button>
        </div>
      </header>

      <!-- Stats Row -->
      <div class="stats-scroll">
        <div class="stat-card new">
          <span class="stat-label">Đang chờ</span>
          <span class="stat-val">{{ pendingCount }}</span>
        </div>
        <div class="stat-card making">
          <span class="stat-label">Đang pha chế</span>
          <span class="stat-val">{{ makingCount + readyCount }}</span>
        </div>
        <div class="stat-card revenue">
          <span class="stat-label">Doanh thu ngày</span>
          <span class="stat-val">{{ revenue | number }}đ</span>
        </div>
      </div>

      <!-- Table Billing Section -->
      <div class="section-title">💰 Thanh toán theo bàn</div>
      <div class="table-bills-scroll">
        @for (bill of tableBills; track bill.tableNumber) {
          <div class="bill-card">
            <div class="bill-head">
              <span class="bill-table">Bàn {{ bill.tableNumber }}</span>
              <span class="bill-count">{{ bill.orderCount }} đơn</span>
            </div>
            <div class="bill-total">{{ bill.total | number }}đ</div>
            <button class="btn-checkout" (click)="openCheckoutModal(bill)">
              Thanh toán
            </button>
          </div>
        } @empty {
          <div class="bill-empty">Hiện không có bàn nào đang order</div>
        }
      </div>

      <!-- Filter Tabs -->
      <div class="filter-bar">
        <div class="category-chips">
          <button [class.active]="filter===''" (click)="setFilter('')">Tất cả</button>
          <button [class.active]="filter==='new'" (click)="setFilter('new')">🔴 Mới</button>
          <button [class.active]="filter==='making'" (click)="setFilter('making')">🔵 Đang làm</button>
          <button [class.active]="filter==='ready'" (click)="setFilter('ready')">🟡 Đã xong món</button>
          <button [class.active]="filter==='done'" (click)="setFilter('done')">✅ Đã thu tiền</button>
        </div>
        @if (doneCount > 0) {
          <button class="btn-clear-done" (click)="clearDone()">Dọn đơn xong</button>
        }
      </div>

      <!-- Orders List -->
      <div class="orders-list">
        @for (order of filteredOrders; track order.id) {
          <div class="order-card" [class.is-done]="order.status==='done'" [class.is-ready]="order.status==='ready'">
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
                  <button class="btn-step ready-btn" (click)="updateStatus(order, 'ready')">Xong món</button>
                }
                @if (order.status === 'ready') {
                  <span class="msg-status-ready">🥤 Chờ thanh toán</span>
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

    <!-- Checkout Detail Modal -->
    @if (selectedBill) {
      <div class="modal-overlay" (click)="closeCheckoutModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-header">
            <h2>Hóa đơn thanh toán</h2>
            <span class="table-num">Bàn số {{ selectedBill.tableNumber }}</span>
          </div>
          
          <div class="bill-details-list">
            @for (item of selectedBill.items; track $index) {
              <div class="bill-item">
                <div class="col-name">
                  <div class="name">{{ item.name }}</div>
                  @if (item.note) { <div class="note">📝 {{ item.note }}</div> }
                </div>
                <span class="col-qty">{{ item.quantity }}</span>
                <span class="col-total">{{ item.unitPrice * item.quantity | number }}đ</span>
              </div>
            }
          </div>

          <div class="modal-footer">
            <div class="summary-row total">
              <span>TỔNG CỘNG</span>
              <span class="val-total">{{ selectedBill.total | number }}đ</span>
            </div>
            
            <div class="modal-actions">
              <button class="btn-modal-close" (click)="closeCheckoutModal()">Hủy</button>
              <button class="btn-modal-confirm" (click)="confirmCheckout()" [disabled]="checkingOutTable === selectedBill.tableNumber">
                {{ checkingOutTable === selectedBill.tableNumber ? '⏳...' : 'Xác nhận thanh toán' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  </div>
</div>
  `,
  styles: [`
    :host { 
      --bg: #fdfaf5; 
      --card: #ffffff; 
      --brand: #7b4e2a; 
      --brand-light: #f1e4d8;
      --text: #4a3424; 
      --text-sec: #8c7366; 
      --accent: #d2a679; 
      --border: #ece1d6; 
      --red: #e66b5b; 
      --blue: #5d9cec;
      --green: #8cc152;
      --orange: #f6bb42;
      display: block; 
      font-family: 'Quicksand', sans-serif; 
    }
    
    .dark-theme {
      --bg: #0d0d0d; 
      --card: #1a1a1a; 
      --brand: #e8c547; 
      --brand-light: #242424;
      --text: #f0ebe0; 
      --text-sec: #888888; 
      --accent: #e8c547; 
      --border: #2e2e2e; 
      --red: #ff4444; 
      --blue: #0096ff;
      --green: #2d9e5c;
      --orange: #f39c12;
    }

    .admin-layout { display: flex; min-height: 100vh; background: var(--bg); color: var(--text); transition: 0.3s; }

    /* Sidebar & Bottom Nav */
    .sidebar { width: 240px; background: var(--brand); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 0; position: sticky; top: 0; height: 100vh; z-index: 1000; }
    .dark-theme .sidebar { background: #111; }
    .sidebar-brand { font-family: 'Fredoka', sans-serif; font-size: 26px; color: #fff; padding: 0 24px 30px; font-weight: 700; }
    .nav-menu { flex: 1; padding: 0 12px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; color: rgba(255,255,255,0.7); text-decoration: none; font-weight: 700; margin-bottom: 6px; transition: 0.2s; }
    .nav-item.active { background: rgba(255,255,255,0.15); color: #fff; }
    .logout-btn-desktop { margin: 20px 12px 0; padding: 12px; background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #fff; border-radius: 12px; font-weight: 700; cursor: pointer; }

    /* Content Area */
    .main-content { flex: 1; padding: 32px; max-width: 1000px; margin: 0 auto; width: 100%; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .page-header h1 { font-family: 'Fredoka', sans-serif; font-size: 32px; color: var(--brand); }
    .subtitle { color: var(--text-sec); font-size: 15px; font-weight: 600; }
    
    .header-actions { display: flex; gap: 10px; align-items: center; }
    .btn-refresh, .btn-sound, .btn-theme { background: var(--card); border: 1px solid var(--border); color: var(--brand); width: 44px; height: 44px; border-radius: 12px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-sound.muted { color: var(--text-sec); opacity: 0.5; }
    .btn-refresh:active, .btn-sound:active, .btn-theme:active { transform: scale(0.92); }
    .btn-logout-mobile { display: none; background: var(--card); border: 1px solid var(--border); color: var(--red); width: 44px; height: 44px; border-radius: 12px; cursor: pointer; font-size: 18px; }

    /* Stats Row */
    .stats-scroll { display: flex; gap: 16px; overflow-x: auto; scrollbar-width: none; margin-bottom: 32px; padding-bottom: 4px; }
    .stat-card { flex: 1; min-width: 150px; background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
    .stat-label { font-size: 11px; font-weight: 700; color: var(--text-sec); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-val { font-size: 26px; font-weight: 800; color: var(--brand); }
    .stat-card.revenue .stat-val { color: var(--accent); }
    .stat-card.new { border-bottom: 4px solid var(--red); }
    .stat-card.making { border-bottom: 4px solid var(--blue); }

    /* Table Billing Section */
    .section-title { font-size: 13px; font-weight: 800; color: var(--text-sec); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; }
    .table-bills-scroll { display: flex; gap: 14px; overflow-x: auto; scrollbar-width: none; margin-bottom: 32px; padding-bottom: 4px; }
    .bill-card { flex: 0 0 200px; background: var(--card); border: 1.5px solid var(--border); border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.04); }
    .bill-head { display: flex; justify-content: space-between; align-items: center; }
    .bill-table { font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 18px; color: var(--brand); }
    .bill-count { font-size: 12px; color: var(--text-sec); font-weight: 700; }
    .bill-total { font-size: 22px; font-weight: 800; color: var(--text); }
    .btn-checkout { background: var(--brand); color: #fff; border: none; padding: 10px; border-radius: 14px; font-weight: 800; font-size: 14px; cursor: pointer; transition: 0.2s; }
    .dark-theme .btn-checkout { color: #000; }
    .btn-checkout:active { transform: scale(0.96); }
    .bill-empty { padding: 32px; background: var(--card); border-radius: 24px; border: 1.5px dashed var(--border); color: var(--text-sec); text-align: center; width: 100%; font-weight: 700; font-size: 14px; }

    /* Filter Chips */
    .category-chips { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; margin-bottom: 8px; }
    .category-chips button { white-space: nowrap; background: var(--card); border: 1.5px solid var(--border); color: var(--text-sec); padding: 10px 22px; border-radius: 50px; font-weight: 700; cursor: pointer; font-family: inherit; font-size: 14px; transition: 0.2s; }
    .category-chips button.active { background: var(--brand); color: #fff; border-color: var(--brand); }
    .dark-theme .category-chips button.active { color: #000; }
    .btn-clear-done { background: none; border: none; color: var(--text-sec); font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: underline; margin-top: 10px; }

    /* Orders List */
    .orders-list { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
    .order-card { background: var(--card); border: 1.5px solid var(--border); border-radius: 28px; padding: 24px; display: flex; flex-direction: column; gap: 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: 0.2s; }
    .order-card.is-done { opacity: 0.6; border-style: dashed; }
    .order-card.is-ready { border-color: var(--orange); background: var(--brand-light); }

    .order-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .order-title { display: flex; flex-direction: column; gap: 4px; }
    .table-tag { font-family: 'Fredoka', sans-serif; font-size: 20px; font-weight: 700; color: var(--brand); }
    .time-tag { font-size: 13px; color: var(--text-sec); font-weight: 600; }
    .status-badge { font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-new { background: rgba(230, 107, 91, 0.1); color: var(--red); }
    .status-making { background: rgba(93, 156, 236, 0.1); color: var(--blue); }
    .status-ready { background: rgba(246, 187, 66, 0.1); color: var(--orange); }
    .status-done { background: rgba(140, 193, 82, 0.1); color: var(--green); }

    .order-items-box { background: var(--bg); border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 12px; border: 1px solid var(--border); }
    .order-item-row { display: flex; flex-direction: column; gap: 4px; }
    .item-info { display: flex; gap: 10px; font-weight: 700; font-size: 15px; color: var(--text); }
    .item-qty { color: var(--brand); }
    .item-name { flex: 1; }
    .item-note { font-size: 13px; color: var(--text-sec); font-style: italic; margin-left: 28px; }

    .order-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 18px; border-top: 1.5px solid var(--border); }
    .total-info { display: flex; flex-direction: column; gap: 2px; }
    .total-label { font-size: 11px; font-weight: 700; color: var(--text-sec); text-transform: uppercase; letter-spacing: 0.5px; }
    .total-val { font-size: 22px; font-weight: 800; color: var(--brand); }
    
    .order-actions { display: flex; align-items: center; gap: 12px; }
    .btn-step { border: none; padding: 12px 20px; border-radius: 14px; font-weight: 800; font-size: 14px; cursor: pointer; font-family: inherit; transition: 0.2s; }
    .btn-step.start { background: var(--blue); color: #fff; }
    .btn-step.ready-btn { background: var(--orange); color: #fff; }
    .msg-status-ready { font-size: 13px; color: var(--orange); font-weight: 800; }
    .btn-del-order { background: var(--brand-light); color: var(--brand); width: 44px; height: 44px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; border: none; font-size: 18px; transition: 0.2s; }
    .btn-del-order:hover { background: var(--red); color: #fff; }

    .empty-state { padding: 80px 20px; text-align: center; background: var(--card); border-radius: 32px; border: 1.5px dashed var(--border); margin-top: 32px; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state p { font-weight: 700; color: var(--text-sec); margin: 0; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(10px); }
    .modal-content { background: var(--bg); border: 2px solid var(--border); border-radius: 32px; width: 100%; max-width: 500px; padding: 32px; display: flex; flex-direction: column; gap: 28px; max-height: 90vh; overflow-y: auto; }
    .modal-handle { display: none; width: 40px; height: 4px; background: var(--border); border-radius: 10px; margin: -10px auto 10px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { font-family: 'Fredoka', sans-serif; font-size: 24px; color: var(--brand); margin: 0; }
    .table-num { background: var(--brand-light); color: var(--brand); padding: 6px 14px; border-radius: 10px; font-weight: 700; font-size: 14px; }

    .bill-details-list { display: flex; flex-direction: column; background: var(--card); border-radius: 24px; overflow: hidden; border: 1.5px solid var(--border); max-height: 400px; overflow-y: auto; }
    .bill-item { display: flex; align-items: flex-start; padding: 18px; border-bottom: 1.5px solid var(--border); font-size: 15px; gap: 12px; }
    .bill-item:last-child { border-bottom: none; }
    .col-name { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .col-name .name { font-weight: 700; color: var(--text); }
    .col-name .note { font-size: 12px; color: var(--text-sec); font-style: italic; }
    .col-qty { width: 45px; text-align: center; font-weight: 800; color: var(--brand); background: var(--brand-light); border-radius: 8px; padding: 4px 0; }
    .col-total { font-weight: 700; color: var(--text); min-width: 80px; text-align: right; }

    .modal-footer { display: flex; flex-direction: column; gap: 20px; }
    .summary-row.total { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 2px dashed var(--border); }
    .summary-row.total span { font-weight: 800; color: var(--text-sec); font-size: 14px; }
    .val-total { font-size: 36px; font-weight: 800; color: var(--brand); font-family: 'Fredoka', sans-serif; }
    
    .modal-actions { display: flex; gap: 12px; }
    .btn-modal-close { flex: 1; background: var(--brand-light); color: var(--brand); border: none; padding: 18px; border-radius: 20px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-modal-confirm { flex: 2; background: var(--brand); color: #fff; border: none; padding: 18px; border-radius: 20px; font-weight: 800; font-size: 17px; cursor: pointer; transition: 0.2s; }
    .btn-modal-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 768px) {
      .sidebar { width: 100%; height: auto; position: fixed; top: auto; bottom: 0; flex-direction: row; border-right: none; border-top: 1px solid var(--border); padding: 0; padding-bottom: env(safe-area-inset-bottom); }
      .sidebar-brand, .logout-btn-desktop { display: none; }
      .nav-menu { display: flex; width: 100%; padding: 6px 12px; }
      .nav-item { flex: 1; flex-direction: column; gap: 4px; padding: 10px; margin-bottom: 0; border-radius: 12px; }
      .main-content { padding: 20px; padding-top: 32px; padding-bottom: calc(100px + env(safe-area-inset-bottom)); }
      .page-header h1 { font-size: 26px; }
      .modal-content { padding: 24px; border-radius: 32px 32px 0 0; align-self: flex-end; margin: 0; max-width: none; }
      .modal-handle { display: block; }
    }
  `]
})
export class OrderManageComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filter = '';
  soundEnabled = false;
  isDarkMode = signal(false);
  checkingOutTable: string | null = null;
  selectedBill: TableBill | null = null;
  notifPermission: NotificationPermission = 'default';
  
  private lastOrderCount = 0;
  private timer?: ReturnType<typeof setInterval>;
  private notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  private visibilityListener = () => {
    if (document.visibilityState === 'visible') {
      this.load();
    }
  };

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit() { 
    this.load(true); 
    this.timer = setInterval(() => this.load(), 5000); 
    document.addEventListener('visibilitychange', this.visibilityListener);
    if ('Notification' in window) {
      this.notifPermission = Notification.permission;
    }
    const savedTheme = localStorage.getItem('hana_theme');
    if (savedTheme === 'dark') this.isDarkMode.set(true);
  }

  ngOnDestroy() { 
    if (this.timer) clearInterval(this.timer);
    document.removeEventListener('visibilitychange', this.visibilityListener);
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    localStorage.setItem('hana_theme', this.isDarkMode() ? 'dark' : 'light');
  }

  requestNotifPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => { this.notifPermission = perm; });
    }
  }

  load(isInitial = false) { 
    this.api.getOrders().subscribe({
      next: (o) => {
        const newOrders = o.filter(order => order.status === 'new');
        if (!isInitial && newOrders.length > this.lastOrderCount) {
          this.triggerAlert(newOrders[0]);
        }
        this.orders = o;
        this.lastOrderCount = newOrders.length;
      }
    }); 
  }

  triggerAlert(order: Order) {
    if (this.soundEnabled) {
      this.notificationSound.currentTime = 0;
      this.notificationSound.play().catch(() => {});
    }
    if (this.notifPermission === 'granted') {
      new Notification('🥤 HANA - CÓ ORDER MỚI!', { body: `Bàn số ${order.tableNumber} vừa đặt món.`, silent: true });
    }
  }

  get tableBills(): TableBill[] {
    const activeOrders = this.orders.filter(o => o.status !== 'done');
    const billsMap = new Map<string, TableBill>();
    activeOrders.forEach(o => {
      const existing = billsMap.get(o.tableNumber);
      if (existing) {
        existing.total += o.total; existing.orderCount += 1; existing.orderIds.push(o.id);
        existing.items = [...existing.items, ...o.items];
      } else {
        billsMap.set(o.tableNumber, { tableNumber: o.tableNumber, total: o.total, orderCount: 1, orderIds: [o.id], items: [...o.items] });
      }
    });
    return Array.from(billsMap.values()).map(bill => {
      const mergedItems: OrderItem[] = [];
      bill.items.forEach(item => {
        const existing = mergedItems.find(mi => mi.name === item.name && mi.note === item.note);
        if (existing) existing.quantity += item.quantity;
        else mergedItems.push({ ...item });
      });
      bill.items = mergedItems;
      return bill;
    }).sort((a, b) => a.tableNumber.localeCompare(b.tableNumber));
  }

  openCheckoutModal(bill: TableBill) { this.selectedBill = bill; }
  closeCheckoutModal() { this.selectedBill = null; }
  get totalItemsInBill(): number { return this.selectedBill?.items.reduce((s, i) => s + i.quantity, 0) || 0; }

  confirmCheckout() {
    if (!this.selectedBill) return;
    this.checkingOutTable = this.selectedBill.tableNumber;
    const requests = this.selectedBill.orderIds.map(id => this.api.updateOrderStatus(id, 'done'));
    forkJoin(requests).subscribe({
      next: () => { this.checkingOutTable = null; this.closeCheckoutModal(); this.load(); },
      error: () => { alert('Lỗi khi thanh toán!'); this.checkingOutTable = null; }
    });
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    if (this.soundEnabled) {
      this.notificationSound.play().then(() => {
        setTimeout(() => { this.notificationSound.pause(); this.notificationSound.currentTime = 0; }, 500);
      }).catch(() => alert('Vui lòng cho phép âm thanh!'));
    }
  }

  get filteredOrders() { return this.filter ? this.orders.filter(o => o.status === this.filter) : this.orders; }
  get pendingCount() { return this.orders.filter(o => o.status === 'new').length; }
  get makingCount() { return this.orders.filter(o => o.status === 'making').length; }
  get readyCount() { return this.orders.filter(o => o.status === 'ready').length; }
  get doneCount() { return this.orders.filter(o => o.status === 'done').length; }
  get revenue() { return this.orders.filter(o => o.status === 'done').reduce((s, o) => s + o.total, 0); }
  setFilter(f: string) { this.filter = f; }
  statusLabel(s: string) { return { new: 'Mới', making: 'Đang làm', ready: 'Xong món', done: 'Đã thanh toán' }[s] ?? s; }
  updateStatus(order: Order, status: string) { this.api.updateOrderStatus(order.id, status).subscribe(() => this.load()); }
  deleteOrder(order: Order) { if (confirm('Xoá đơn hàng này?')) this.api.deleteOrder(order.id).subscribe(() => this.load()); }
  clearDone() { if (confirm('Xoá tất cả đơn đã xong?')) { const doneOrders = this.orders.filter(o => o.status === 'done'); forkJoin(doneOrders.map(o => this.api.deleteOrder(o.id))).subscribe(() => this.load()); } }
  logout() { this.auth.logout(); this.router.navigate(['/admin/login']); }
}
