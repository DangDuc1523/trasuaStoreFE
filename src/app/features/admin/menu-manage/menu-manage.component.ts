import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { MenuItem, CATEGORY_LABELS } from '../../../core/models';

const EMOJIS = ['🧋','🍵','🍓','💜','☕','🥛','🧊','🥑','🥭','🍊','🍉','🍑','🟡','🍹','🥤','🍰','🧁','🍫','🫖','🥜'];

@Component({
  selector: 'app-menu-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="admin-wrap">
  <div class="topbar">
    <div class="brand">🧋 Quản lý Menu</div>
    <div class="topbar-actions">
      <a routerLink="/admin/orders" class="nav-btn">📋 Đơn hàng</a>
    </div>
  </div>

  <div class="menu-header">
    <h2>🍽 Danh sách món ({{ items.length }})</h2>
    <button class="add-btn" (click)="openAdd()">+ Thêm món</button>
  </div>

  <!-- Category filter -->
  <div class="cats">
    <button class="cat-btn" [class.active]="catFilter===''" (click)="catFilter=''">Tất cả</button>
    @for (cat of catKeys; track cat) {
      <button class="cat-btn" [class.active]="catFilter===cat" (click)="catFilter=cat">{{ catLabels[cat] }}</button>
    }
  </div>

  <!-- Items list -->
  <div class="items-list">
    @for (item of filteredItems; track item.id) {
      <div class="item-row" [class.hidden-item]="item.isHidden">
        <div class="item-emoji">{{ item.emoji }}</div>
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-meta">{{ catLabels[item.category] ?? item.category }}</div>
          <div class="item-price">{{ item.price | number }}đ</div>
          <div class="badges">
            @if (item.isHot) { <span class="badge hot">🔥 HOT</span> }
            @if (item.isNew) { <span class="badge new">✨ MỚI</span> }
            @if (item.isHidden) { <span class="badge hidden">🚫 Ẩn</span> }
          </div>
        </div>
        <div class="row-actions">
          <button class="btn-edit" (click)="openEdit(item)">✏️</button>
          <button class="btn-del" (click)="confirmDelete(item)">🗑</button>
        </div>
      </div>
    }
    @if (filteredItems.length === 0) {
      <div class="empty">Chưa có món nào</div>
    }
  </div>
</div>

<!-- Add/Edit Sheet -->
@if (showSheet) {
  <div class="overlay" (click)="onOverlay($event)">
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-title">{{ editingId ? '✏️ Chỉnh sửa' : '➕ Thêm món mới' }}</div>

      <div class="form-row">
        <div class="form-group">
          <label>Tên món *</label>
          <input [(ngModel)]="form.name" placeholder="Trà Sữa Oolong">
        </div>
        <div class="form-group">
          <label>Giá (đ) *</label>
          <input type="number" [(ngModel)]="form.price" placeholder="35000">
        </div>
      </div>

      <div class="form-group">
        <label>Mô tả</label>
        <input [(ngModel)]="form.description" placeholder="Mô tả ngắn về món...">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Danh mục</label>
          <select [(ngModel)]="form.category">
            <option value="trasua">🧋 Trà sữa</option>
            <option value="cafe">☕ Cà phê</option>
            <option value="sinh-to">🥤 Sinh tố</option>
            <option value="nuoc-ep">🍹 Nước ép</option>
            <option value="tra">🍵 Trà</option>
            <option value="khac">🍽 Khác</option>
          </select>
        </div>
        <div class="form-group">
          <label>Emoji</label>
          <input [(ngModel)]="form.emoji" placeholder="🧋" maxlength="4">
        </div>
      </div>

      <div class="form-group">
        <label>Chọn emoji nhanh</label>
        <div class="emoji-grid">
          @for (e of emojis; track e) {
            <button class="ep-btn" [class.sel]="form.emoji===e" (click)="form.emoji=e">{{ e }}</button>
          }
        </div>
      </div>

      <div class="toggle-row">
        <span>🔥 Đánh dấu HOT</span>
        <label class="toggle"><input type="checkbox" [(ngModel)]="form.isHot"><span class="slider"></span></label>
      </div>
      <div class="toggle-row">
        <span>✨ Đánh dấu MỚI</span>
        <label class="toggle"><input type="checkbox" [(ngModel)]="form.isNew"><span class="slider"></span></label>
      </div>
      <div class="toggle-row">
        <span>🚫 Ẩn (hết hàng)</span>
        <label class="toggle"><input type="checkbox" [(ngModel)]="form.isHidden"><span class="slider"></span></label>
      </div>

      @if (formError) { <div class="form-error">{{ formError }}</div> }

      <div class="sheet-btns">
        <button class="btn-cancel" (click)="showSheet=false">Huỷ</button>
        <button class="btn-save" [disabled]="saving" (click)="save()">
          {{ saving ? 'Đang lưu...' : '💾 Lưu' }}
        </button>
      </div>
      @if (editingId) {
        <button class="btn-del-full" (click)="deleteEditing()">🗑 Xoá món này</button>
      }
    </div>
  </div>
}
  `,
  styles: [`
    .admin-wrap { background:#f7f5f0;min-height:100vh;font-family:'DM Sans',sans-serif;color:#1a1a1a;padding-bottom:40px }
    .topbar { background:#fff;border-bottom:1px solid #e5e0d5;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50 }
    .brand { font-family:'Playfair Display',serif;font-size:20px;color:#c9a227 }
    .topbar-actions { display:flex;gap:8px }
    .nav-btn { padding:7px 14px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid #e5e0d5;background:#f0ede5;cursor:pointer;color:#1a1a1a;text-decoration:none }
    .menu-header { display:flex;align-items:center;justify-content:space-between;padding:16px }
    .menu-header h2 { font-size:15px;font-weight:600 }
    .add-btn { background:#c9a227;color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer }
    .cats { display:flex;gap:8px;padding:0 16px 12px;overflow-x:auto;scrollbar-width:none }
    .cat-btn { white-space:nowrap;padding:6px 14px;border-radius:16px;font-size:12px;border:1px solid #e5e0d5;background:#fff;color:#888;cursor:pointer;font-weight:500;flex-shrink:0 }
    .cat-btn.active { background:#c9a227;border-color:#c9a227;color:#fff }
    .items-list { padding:0 16px;display:flex;flex-direction:column;gap:10px }
    .item-row { background:#fff;border:1px solid #e5e0d5;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px }
    .item-row.hidden-item { opacity:0.5 }
    .item-emoji { width:48px;height:48px;background:#f0ede5;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0 }
    .item-info { flex:1;min-width:0 }
    .item-name { font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
    .item-meta { font-size:11px;color:#888;margin-top:2px }
    .item-price { font-family:'Playfair Display',serif;font-size:14px;color:#c9a227;font-weight:700 }
    .badges { display:flex;gap:4px;margin-top:4px }
    .badge { font-size:10px;padding:2px 6px;border-radius:6px;font-weight:600 }
    .badge.hot { background:#ffe4e1;color:#c0392b }
    .badge.new { background:#e8f8ef;color:#1e8449 }
    .badge.hidden { background:#f0f0f0;color:#888 }
    .row-actions { display:flex;gap:6px;flex-shrink:0 }
    .btn-edit { width:32px;height:32px;border-radius:8px;border:1px solid #c9a227;background:#fff;cursor:pointer;font-size:15px;color:#c9a227 }
    .btn-del { width:32px;height:32px;border-radius:8px;border:1px solid #e05a4b;background:#fff;cursor:pointer;font-size:15px;color:#e05a4b }
    .empty { text-align:center;padding:40px;color:#888 }
    /* Sheet */
    .overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:400;display:flex;align-items:flex-end }
    .sheet { background:#fff;border-radius:24px 24px 0 0;width:100%;padding:20px;max-height:92vh;overflow-y:auto }
    .sheet-handle { width:40px;height:4px;background:#e5e0d5;border-radius:2px;margin:0 auto 20px }
    .sheet-title { font-family:'Playfair Display',serif;font-size:20px;margin-bottom:16px }
    .form-row { display:grid;grid-template-columns:1fr 1fr;gap:10px }
    .form-group { margin-bottom:14px }
    .form-group label { display:block;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px }
    .form-group input, .form-group select { width:100%;padding:10px 14px;border:1px solid #e5e0d5;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#f7f5f0 }
    .form-group input:focus { border-color:#c9a227 }
    .emoji-grid { display:flex;flex-wrap:wrap;gap:8px;margin-top:6px }
    .ep-btn { width:40px;height:40px;border-radius:10px;border:1.5px solid #e5e0d5;background:#f0ede5;font-size:20px;cursor:pointer }
    .ep-btn.sel { border-color:#c9a227;background:rgba(201,162,39,0.1) }
    .toggle-row { display:flex;align-items:center;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:500 }
    .toggle { position:relative;width:44px;height:24px;flex-shrink:0 }
    .toggle input { opacity:0;width:0;height:0 }
    .slider { position:absolute;inset:0;background:#ddd;border-radius:12px;cursor:pointer;transition:.2s }
    .slider:before { content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s }
    .toggle input:checked+.slider { background:#c9a227 }
    .toggle input:checked+.slider:before { transform:translateX(20px) }
    .form-error { color:#e05a4b;font-size:13px;padding:8px 12px;background:#fff5f5;border-radius:8px;margin-bottom:10px }
    .sheet-btns { display:flex;gap:10px;margin-top:20px }
    .btn-save { flex:1;padding:14px;background:#c9a227;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer }
    .btn-save:disabled { opacity:0.6 }
    .btn-cancel { flex:1;padding:14px;background:#f0ede5;color:#1a1a1a;border:1px solid #e5e0d5;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer }
    .btn-del-full { width:100%;padding:12px;background:transparent;color:#e05a4b;border:1px solid #e05a4b;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px }
  `]
})
export class MenuManageComponent implements OnInit {
  items: MenuItem[] = [];
  catFilter = '';
  showSheet = false;
  editingId: number | null = null;
  saving = false;
  formError = '';
  emojis = EMOJIS;
  catLabels = CATEGORY_LABELS;
  catKeys = Object.keys(CATEGORY_LABELS);

  form = this.emptyForm();

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }

  load() { this.api.getMenuAdmin().subscribe(i => this.items = i); }

  get filteredItems() { return this.catFilter ? this.items.filter(i => i.category === this.catFilter) : this.items; }

  emptyForm() {
    return { name:'', price: 0, description:'', category:'trasua', emoji:'🧋', isHot:false, isNew:false, isHidden:false };
  }

  openAdd() { this.editingId = null; this.form = this.emptyForm(); this.formError = ''; this.showSheet = true; }

  openEdit(item: MenuItem) {
    this.editingId = item.id;
    this.form = { name:item.name, price:item.price, description:item.description,
      category:item.category, emoji:item.emoji, isHot:item.isHot, isNew:item.isNew, isHidden:item.isHidden };
    this.formError = '';
    this.showSheet = true;
  }

  onOverlay(e: Event) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.showSheet = false;
  }

  save() {
    if (!this.form.name.trim()) { this.formError = 'Vui lòng nhập tên món'; return; }
    if (!this.form.price || this.form.price < 0) { this.formError = 'Vui lòng nhập giá hợp lệ'; return; }
    this.saving = true; this.formError = '';

    const req = this.editingId
      ? this.api.updateMenuItem(this.editingId, this.form)
      : this.api.createMenuItem(this.form);

    req.subscribe({
      next: () => { this.showSheet = false; this.saving = false; this.load(); },
      error: () => { this.formError = 'Lỗi lưu dữ liệu, thử lại!'; this.saving = false; }
    });
  }

  confirmDelete(item: MenuItem) {
    if (confirm(`Xoá món "${item.name}"?`)) {
      this.api.deleteMenuItem(item.id).subscribe(() => this.load());
    }
  }

  deleteEditing() {
    if (!this.editingId) return;
    const item = this.items.find(i => i.id === this.editingId);
    if (item && confirm(`Xoá món "${item.name}"?`)) {
      this.api.deleteMenuItem(this.editingId).subscribe(() => {
        this.showSheet = false;
        this.load();
      });
    }
  }
}
