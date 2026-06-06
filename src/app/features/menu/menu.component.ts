import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { MenuItem, CATEGORY_LABELS } from '../../core/models';

interface CartItem { item: MenuItem; qty: number; note: string; }

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="wrapper">
  <!-- Topbar -->
  <div class="topbar">
    <div class="brand">🧋 Trà Sữa Mộc</div>
    <div class="table-tag">📍 Bàn <span>{{ tableNum }}</span></div>
  </div>

  <!-- Hero -->
  <div class="hero">
    <div>
      <h2>Chào buổi chiều ☀️</h2>
      <p>Chọn thức uống bạn thích nhé!</p>
    </div>
  </div>

  <!-- Search -->
  <div class="search-wrap">
    <input [ngModel]="searchQ()" (ngModelChange)="searchQ.set($event)" placeholder="🔍 Tìm thức uống...">
  </div>

  <!-- Categories -->
  <div class="cats">
    <button class="cat-btn" [class.active]="activeCat()==='all'" (click)="setCat('all')">Tất cả</button>
    <button class="cat-btn" [class.active]="activeCat()==='trasua'" (click)="setCat('trasua')">🧋 Trà sữa</button>
    <button class="cat-btn" [class.active]="activeCat()==='cafe'" (click)="setCat('cafe')">☕ Cà phê</button>
    <button class="cat-btn" [class.active]="activeCat()==='sinh-to'" (click)="setCat('sinh-to')">🥤 Sinh tố</button>
    <button class="cat-btn" [class.active]="activeCat()==='nuoc-ep'" (click)="setCat('nuoc-ep')">🍊 Nước ép</button>
    <button class="cat-btn" [class.active]="activeCat()==='tra'" (click)="setCat('tra')">🍵 Trà</button>
  </div>

  <!-- Menu list -->
  <div class="section-title">Thực đơn hôm nay</div>
  <div class="menu-list">
    @for (item of filteredItems(); track item.id) {
      <div class="item-card" [class.in-cart]="cartQty(item.id) > 0">
        <div class="item-emoji">{{ item.emoji }}</div>
        <div class="item-info">
          <div class="item-name">
            {{ item.name }}
            @if (item.isHot) { <span class="badge-hot">HOT</span> }
            @if (item.isNew) { <span class="badge-new">MỚI</span> }
          </div>
          <div class="item-desc">{{ item.description }}</div>
          <div class="item-footer">
            <div class="item-price">{{ item.price | number }}đ</div>
            <div class="qty-ctrl">
              @if (cartQty(item.id) > 0) {
                <button class="qty-btn" (click)="changeQty(item, -1)">−</button>
                <span class="qty-num">{{ cartQty(item.id) }}</span>
              }
              <button class="qty-btn add-btn" (click)="changeQty(item, 1)">+</button>
            </div>
          </div>
          @if (cartQty(item.id) > 0) {
            <div class="note-btn" (click)="toggleNote(item.id)">✏️ Ghi chú</div>
            <textarea
              class="note-input"
              [class.show]="showNote[item.id]"
              [ngModel]="getNote(item.id)"
              (ngModelChange)="setNote(item.id, $event)"
              placeholder="Ít đường, nhiều đá...">
            </textarea>
          }
        </div>
      </div>
    }
  </div>

  <!-- Float cart bar -->
  <div class="float-cart">
    @if (totalItems() > 0) {
      <div class="cart-bar" (click)="openModal = true">
        <div class="cart-info">
          <div class="cart-count">{{ totalItems() }} món</div>
          <div class="cart-label">Xem giỏ hàng</div>
        </div>
        <div class="cart-total">{{ totalPrice() | number }}đ</div>
      </div>
    }
  </div>

  <!-- Cart modal -->
  @if (openModal) {
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-title">Giỏ hàng của bạn</div>
        <div class="modal-sub">Bàn số {{ tableNum }} · Vui lòng xác nhận đặt món</div>
        @for (entry of cartEntries(); track entry.item.id) {
          <div class="order-item">
            <div>
              <div class="order-name">{{ entry.item.emoji }} {{ entry.item.name }}</div>
              @if (entry.note) { <div class="order-note">📝 {{ entry.note }}</div> }
              <div class="order-qty">x{{ entry.qty }}</div>
            </div>
            <div class="order-price">{{ entry.item.price * entry.qty | number }}đ</div>
          </div>
        }
        <div class="divider"></div>
        <div class="modal-total">
          <div class="modal-total-label">Tổng cộng</div>
          <div class="modal-total-val">{{ totalPrice() | number }}đ</div>
        </div>
        <button class="btn-order" [disabled]="ordering" (click)="placeOrder()">
          {{ ordering ? '⏳ Đang gửi...' : '✅ Gửi đặt món' }}
        </button>
        <button class="btn-close" (click)="openModal = false">Tiếp tục chọn</button>
      </div>
    </div>
  }

  <!-- Success screen -->
  @if (orderSuccess) {
    <div class="success-screen">
      <div class="success-icon">🎉</div>
      <div class="success-title">Đặt món thành công!</div>
      <div class="success-sub">Nhân viên đã nhận được yêu cầu của bạn.<br>Vui lòng chờ trong giây lát.</div>
      <div class="success-table">📍 Bàn số {{ tableNum }}</div>
      <button class="btn-back" (click)="resetOrder()">🛍 Đặt thêm món</button>
    </div>
  }
</div>
  `,
  styles: [`
    :host { display: block; }
    * { margin:0;padding:0;box-sizing:border-box }
    .wrapper { background:#0d0d0d;color:#f0ebe0;font-family:'DM Sans',sans-serif;min-height:100vh;padding-bottom:120px }
    .topbar { position:sticky;top:0;z-index:100;background:rgba(13,13,13,0.95);backdrop-filter:blur(12px);border-bottom:1px solid #2e2e2e;padding:14px 20px 10px;display:flex;align-items:center;justify-content:space-between }
    .brand { font-family:'Playfair Display',serif;font-size:20px;color:#e8c547 }
    .table-tag { background:#242424;border:1px solid #2e2e2e;border-radius:20px;padding:4px 12px;font-size:12px;color:#888 }
    .table-tag span { color:#e8c547;font-weight:600 }
    .hero { padding:20px 20px 8px }
    .hero h2 { font-family:'Playfair Display',serif;font-size:26px }
    .hero p { color:#888;font-size:13px;margin-top:4px }
    .search-wrap { padding:0 20px 12px }
    .search-wrap input { width:100%;background:#242424;border:1px solid #2e2e2e;border-radius:24px;padding:10px 18px;color:#f0ebe0;font-size:14px;outline:none }
    .cats { display:flex;gap:8px;padding:0 20px 16px;overflow-x:auto;scrollbar-width:none }
    .cat-btn { white-space:nowrap;padding:7px 16px;border-radius:20px;font-size:13px;border:1px solid #2e2e2e;background:#242424;color:#888;cursor:pointer;font-weight:500;flex-shrink:0 }
    .cat-btn.active { background:#e8c547;border-color:#e8c547;color:#0d0d0d;font-weight:600 }
    .section-title { padding:4px 20px 10px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#888;font-weight:600 }
    .menu-list { padding:0 20px;display:flex;flex-direction:column;gap:12px }
    .item-card { background:#1a1a1a;border:1px solid #2e2e2e;border-radius:16px;padding:14px;display:flex;gap:12px }
    .item-card.in-cart { border-color:#e8c547;background:rgba(232,197,71,0.05) }
    .item-emoji { width:72px;height:72px;background:#242424;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:36px;flex-shrink:0 }
    .item-info { flex:1;min-width:0 }
    .item-name { font-weight:600;font-size:15px;margin-bottom:3px }
    .item-desc { font-size:12px;color:#888;line-height:1.4;margin-bottom:8px }
    .item-footer { display:flex;align-items:center;justify-content:space-between }
    .item-price { font-family:'Playfair Display',serif;font-size:16px;color:#e8c547;font-weight:700 }
    .badge-hot { background:#ff4444;color:#fff;font-size:10px;padding:2px 7px;border-radius:8px;font-weight:600;margin-left:6px }
    .badge-new { background:#4caf7d;color:#fff;font-size:10px;padding:2px 7px;border-radius:8px;font-weight:600;margin-left:6px }
    .qty-ctrl { display:flex;align-items:center;gap:0 }
    .qty-btn { width:28px;height:28px;border-radius:50%;border:1.5px solid #2e2e2e;background:#242424;color:#f0ebe0;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center }
    .qty-btn.add-btn { background:#e8c547;border-color:#e8c547;color:#0d0d0d;font-weight:700 }
    .qty-num { min-width:26px;text-align:center;font-weight:600;font-size:14px }
    .note-btn { font-size:11px;color:#888;cursor:pointer;padding:2px 0;margin-top:4px }
    .note-input { margin-top:8px;width:100%;background:#242424;border:1px solid #2e2e2e;border-radius:8px;padding:6px 10px;color:#f0ebe0;font-size:12px;resize:none;display:none;outline:none;font-family:inherit }
    .note-input.show { display:block }
    .float-cart { position:fixed;bottom:0;left:0;right:0;z-index:200;padding:12px 20px 20px;background:linear-gradient(to top,#0d0d0d 80%,transparent) }
    .cart-bar { background:#e8c547;border-radius:16px;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;box-shadow:0 8px 32px rgba(232,197,71,0.3) }
    .cart-count { background:#0d0d0d;color:#e8c547;font-weight:700;font-size:13px;padding:4px 10px;border-radius:10px }
    .cart-label { font-weight:700;font-size:15px;color:#0d0d0d;margin-left:10px }
    .cart-total { font-family:'Playfair Display',serif;font-size:18px;color:#0d0d0d;font-weight:700 }
    .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:300;display:flex;align-items:flex-end }
    .modal { background:#1a1a1a;border-radius:24px 24px 0 0;width:100%;padding:20px;max-height:90vh;overflow-y:auto }
    .modal-handle { width:40px;height:4px;background:#2e2e2e;border-radius:2px;margin:0 auto 20px }
    .modal-title { font-family:'Playfair Display',serif;font-size:22px;margin-bottom:4px }
    .modal-sub { color:#888;font-size:13px;margin-bottom:20px }
    .order-item { display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #2e2e2e }
    .order-name { font-weight:500;font-size:14px }
    .order-note { font-size:11px;color:#888;margin-top:2px }
    .order-qty { color:#888;font-size:13px;margin-top:2px }
    .order-price { color:#e8c547;font-weight:600;font-size:14px;font-family:'Playfair Display',serif }
    .divider { height:1px;background:#2e2e2e;margin:16px 0 }
    .modal-total { display:flex;justify-content:space-between;align-items:center;margin:16px 0 }
    .modal-total-label { font-size:15px;font-weight:600 }
    .modal-total-val { font-family:'Playfair Display',serif;font-size:22px;color:#e8c547;font-weight:700 }
    .btn-order { width:100%;padding:16px;background:#e8c547;color:#0d0d0d;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px }
    .btn-order:disabled { opacity:0.6;cursor:not-allowed }
    .btn-close { width:100%;padding:12px;background:transparent;color:#888;border:1px solid #2e2e2e;border-radius:14px;font-size:14px;cursor:pointer;margin-top:8px }
    .success-screen { position:fixed;inset:0;background:#0d0d0d;z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px }
    .success-icon { font-size:72px;margin-bottom:20px }
    .success-title { font-family:'Playfair Display',serif;font-size:28px;margin-bottom:8px;color:#4caf7d }
    .success-sub { color:#888;font-size:14px;line-height:1.6 }
    .success-table { font-size:18px;color:#e8c547;font-weight:600;margin-top:16px }
    .btn-back { margin-top:32px;padding:14px 40px;background:#242424;color:#f0ebe0;border:1px solid #2e2e2e;border-radius:14px;font-size:15px;cursor:pointer }
  `]
})
export class MenuComponent implements OnInit {
  tableNum = '1';

  // ✅ FIX: Tất cả state dùng signal để computed() có thể track
  allItems = signal<MenuItem[]>([]);
  activeCat = signal('all');
  searchQ = signal('');
  cartMap = signal<Map<number, { qty: number; note: string }>>(new Map());

  showNote: Record<number, boolean> = {};
  openModal = false;
  ordering = false;
  orderSuccess = false;

  // ✅ FIX: computed() giờ reactive đúng vì đọc signals
  filteredItems = computed(() => {
    let items = this.allItems();
    const cat = this.activeCat();
    const q = this.searchQ().toLowerCase();
    if (cat !== 'all') items = items.filter(i => i.category === cat);
    if (q) items = items.filter(i =>
      i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
    return items;
  });

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.tableNum = this.route.snapshot.queryParamMap.get('table') ?? '1';
    this.api.getMenu().subscribe(items => this.allItems.set(items)); // ✅ .set()
  }

  setCat(cat: string) { this.activeCat.set(cat); }

  // Cart helpers — đọc/ghi qua signal để trigger re-render
  private getCart() { return this.cartMap(); }

  cartQty(id: number) { return this.getCart().get(id)?.qty ?? 0; }
  getNote(id: number) { return this.getCart().get(id)?.note ?? ''; }

  setNote(id: number, note: string) {
    const map = new Map(this.getCart());
    const e = map.get(id);
    if (e) { map.set(id, { ...e, note }); this.cartMap.set(map); }
  }

  changeQty(item: MenuItem, delta: number) {
    const map = new Map(this.getCart());
    const cur = map.get(item.id);
    const next = (cur?.qty ?? 0) + delta;
    if (next <= 0) map.delete(item.id);
    else map.set(item.id, { qty: next, note: cur?.note ?? '' });
    this.cartMap.set(map);
  }

  toggleNote(id: number) { this.showNote[id] = !this.showNote[id]; }

  totalItems() {
    return [...this.getCart().values()].reduce((s, e) => s + e.qty, 0);
  }

  totalPrice() {
    let sum = 0;
    this.getCart().forEach((entry, id) => {
      const item = this.allItems().find(i => i.id === id);
      if (item) sum += item.price * entry.qty;
    });
    return sum;
  }

  cartEntries() {
    return [...this.getCart().entries()].map(([id, entry]) => ({
      item: this.allItems().find(i => i.id === id)!,
      ...entry
    })).filter(e => e.item);
  }

  onOverlayClick(e: Event) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.openModal = false;
  }

  placeOrder() {
    this.ordering = true;
    const dto = {
      tableNumber: this.tableNum,
      items: this.cartEntries().map(e => ({
        name: e.item.name, quantity: e.qty,
        unitPrice: e.item.price, note: e.note
      }))
    };
    this.api.placeOrder(dto).subscribe({
      next: () => {
        this.openModal = false;
        this.orderSuccess = true;
        this.ordering = false;
      },
      error: () => { alert('Lỗi kết nối, thử lại nhé!'); this.ordering = false; }
    });
  }

  resetOrder() {
    this.cartMap.set(new Map());
    this.orderSuccess = false;
  }
}