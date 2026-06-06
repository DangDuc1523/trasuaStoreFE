import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { MenuItem, CATEGORY_LABELS } from '../../../core/models';

@Component({
  selector: 'app-menu-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="admin-layout">
  <!-- Desktop Sidebar / Mobile Bottom Nav -->
  <aside class="sidebar">
    <div class="sidebar-brand">🥤 HANA</div>
    <nav class="nav-menu">
      <a routerLink="/admin/orders" class="nav-item">
        <span class="icon">📋</span>
        <span class="label">Đơn hàng</span>
      </a>
      <a routerLink="/admin/menu" class="nav-item active">
        <span class="icon">🍽</span>
        <span class="label">Thực đơn</span>
      </a>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <header class="page-header">
      <div class="header-left">
        <h1>Thực đơn</h1>
        <p class="subtitle">{{ items.length }} món ăn & đồ uống</p>
      </div>
      <button class="btn-add-mobile" (click)="openAdd()">+</button>
      <button class="btn-add-desktop" (click)="openAdd()">+ Thêm món mới</button>
    </header>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="category-chips">
        <button [class.active]="catFilter===''" (click)="catFilter=''">Tất cả</button>
        @for (cat of catKeys; track cat) {
          <button [class.active]="catFilter===cat" (click)="catFilter=cat">{{ catLabels[cat] }}</button>
        }
      </div>
    </div>

    <!-- Menu List -->
    <div class="menu-list">
      @for (item of filteredItems; track item.id) {
        <div class="menu-item-row" [class.is-hidden]="item.isHidden">
          <div class="item-visual">
            <span class="emoji">{{ item.emoji }}</span>
          </div>
          <div class="item-info">
            <div class="item-name-row">
              <h3>{{ item.name }}</h3>
              <div class="item-badges">
                @if (item.isHot) { <span class="badge hot">HOT</span> }
                @if (item.isNew) { <span class="badge new">MỚI</span> }
              </div>
            </div>
            <div class="item-meta">
              <span class="price">{{ item.price | number }}đ</span>
              <span class="dot">•</span>
              <span class="cat">{{ catLabels[item.category] }}</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="btn-edit-row" (click)="openEdit(item)">Sửa</button>
          </div>
        </div>
      }
    </div>

    @if (filteredItems.length === 0) {
      <div class="empty-state">
        <div class="empty-icon">🍽</div>
        <p>Không tìm thấy món nào</p>
      </div>
    }
  </main>
</div>

<!-- Add/Edit Sheet -->
@if (showSheet) {
  <div class="sheet-overlay" (click)="onOverlay($event)">
    <div class="sheet-container" (click)="$event.stopPropagation()">
      <div class="sheet-handle"></div>
      <div class="sheet-header">
        <h2>{{ editingId ? 'Sửa món ăn' : 'Thêm món mới' }}</h2>
        <button class="close-x" (click)="showSheet=false">✕</button>
      </div>

      <div class="sheet-content">
        <div class="form-grid">
          <div class="form-group full">
            <label>Tên món *</label>
            <input [(ngModel)]="form.name" placeholder="Tên sản phẩm...">
          </div>
          
          <div class="form-group">
            <label>Giá bán *</label>
            <input type="number" [(ngModel)]="form.price" placeholder="VNĐ">
          </div>

          <div class="form-group">
            <label>Danh mục</label>
            <select [(ngModel)]="form.category">
              @for (cat of catKeys; track cat) {
                <option [value]="cat">{{ catLabels[cat] }}</option>
              }
            </select>
          </div>

          <div class="form-group full">
            <label>Mô tả ngắn</label>
            <textarea [(ngModel)]="form.description" placeholder="Mô tả hương vị..."></textarea>
          </div>

          <div class="form-group full">
            <label>Biểu tượng (Emoji)</label>
            <div class="emoji-picker-container">
              <input [(ngModel)]="form.emoji" class="emoji-preview-input">
              <div class="quick-emojis-scroll">
                @for (e of emojis; track e) {
                  <button [class.selected]="form.emoji===e" (click)="form.emoji=e">{{ e }}</button>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="options-list">
          <div class="option-row" (click)="form.isHot = !form.isHot">
            <div class="option-text">
              <span class="opt-title">Món nổi bật 🔥</span>
              <span class="opt-desc">Gắn nhãn HOT PICK</span>
            </div>
            <div class="custom-toggle" [class.on]="form.isHot"></div>
          </div>
          <div class="option-row" (click)="form.isNew = !form.isNew">
            <div class="option-text">
              <span class="opt-title">Món mới ✨</span>
              <span class="opt-desc">Gắn nhãn NEW</span>
            </div>
            <div class="custom-toggle" [class.on]="form.isNew"></div>
          </div>
          <div class="option-row" (click)="form.isHidden = !form.isHidden">
            <div class="option-text">
              <span class="opt-title">Tạm ẩn 🚫</span>
              <span class="opt-desc">Ẩn khỏi khách hàng</span>
            </div>
            <div class="custom-toggle" [class.on]="form.isHidden"></div>
          </div>
        </div>

        @if (formError) { <div class="error-msg">{{ formError }}</div> }
      </div>

      <div class="sheet-footer">
        <div class="footer-main-row">
          <button class="btn-sheet-secondary" (click)="showSheet=false">Đóng</button>
          <button class="btn-sheet-primary" [disabled]="saving" (click)="save()">
            {{ saving ? 'Đang lưu...' : 'Lưu dữ liệu' }}
          </button>
        </div>
        @if (editingId) {
          <button class="btn-sheet-danger" (click)="deleteEditing()">Xoá món ăn này</button>
        }
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    :host { 
      --bg: #0d0d0d; 
      --card: #1a1a1a; 
      --text: #f0ebe0; 
      --text-sec: #888888; 
      --gold: #e8c547; 
      --border: #2e2e2e; 
      --red: #ff4444; 
      display: block; 
      font-family: 'Quicksand', sans-serif; 
    }
    
    .admin-layout { display: flex; min-height: 100vh; background: var(--bg); color: var(--text); }

    /* Sidebar */
    .sidebar { width: 260px; background: var(--card); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 32px 0; position: sticky; top: 0; height: 100vh; z-index: 1000; }
    .sidebar-brand { font-family: 'Fredoka', sans-serif; font-size: 28px; color: var(--gold); padding: 0 24px 40px; font-weight: 700; letter-spacing: 1px; }
    .nav-menu { flex: 1; padding: 0 16px; }
    .nav-item { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-radius: 16px; color: var(--text-sec); text-decoration: none; font-weight: 700; margin-bottom: 8px; transition: all 0.3s ease; }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text); }
    .nav-item.active { background: var(--gold); color: #0d0d0d; box-shadow: 0 8px 24px rgba(232,197,71,0.2); }

    /* Main Content */
    .main-content { flex: 1; padding: 40px; max-width: 1000px; margin: 0 auto; width: 100%; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .page-header h1 { font-family: 'Fredoka', sans-serif; font-size: 32px; font-weight: 600; }
    .subtitle { color: var(--text-sec); font-size: 15px; font-weight: 500; margin-top: 4px; }
    
    .btn-add-desktop { background: var(--gold); color: #0d0d0d; border: none; padding: 14px 28px; border-radius: 18px; font-weight: 800; font-size: 15px; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 20px rgba(232,197,71,0.15); font-family: inherit; }
    .btn-add-desktop:active { transform: scale(0.96); }
    .btn-add-mobile { display: none; background: var(--gold); color: #0d0d0d; border: none; width: 48px; height: 48px; border-radius: 16px; font-size: 24px; font-weight: 800; }

    /* Filter Chips */
    .filter-bar { margin-bottom: 32px; overflow-x: auto; scrollbar-width: none; margin: 0 -40px 32px; padding: 0 40px; }
    .category-chips { display: flex; gap: 10px; }
    .category-chips button { white-space: nowrap; background: var(--card); border: 1px solid var(--border); color: var(--text-sec); padding: 10px 22px; border-radius: 50px; font-weight: 700; cursor: pointer; font-family: inherit; font-size: 14px; transition: all 0.2s; }
    .category-chips button.active { background: var(--text); color: var(--bg); border-color: var(--text); }

    /* List Rows */
    .menu-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 40px !important;}
    .menu-item-row { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 16px; display: flex; align-items: center; gap: 18px; transition: 0.2s; }
    .menu-item-row:hover { border-color: #444; }
    .menu-item-row.is-hidden { opacity: 0.4; filter: grayscale(1); }
    
    .item-visual { width: 64px; height: 64px; background: var(--bg); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; }
    .item-info { flex: 1; min-width: 0; }
    .item-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .item-name-row h3 { font-family: 'Fredoka', sans-serif; font-size: 17px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { font-size: 14px; color: var(--text-sec); display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .item-meta .price { color: var(--gold); font-weight: 700; }
    
    .badge { font-size: 9px; padding: 2px 7px; border-radius: 6px; font-weight: 800; letter-spacing: 0.5px; }
    .badge.hot { background: var(--red); color: #fff; }
    .badge.new { background: #2d9e5c; color: #fff; }

    .btn-edit-row { background: #262626; color: var(--text); border: 1px solid #333; padding: 10px 18px; border-radius: 14px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; }
    .btn-edit-row:hover { background: #333; border-color: var(--gold); color: var(--gold); }

    /* Bottom Sheet / Modal */
    .sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 2000; display: flex; align-items: flex-end; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
    .sheet-container { background: var(--card); width: 100%; border-radius: 32px 32px 0 0; padding: 32px; max-height: 94vh; overflow-y: auto; padding-bottom: calc(32px + env(safe-area-inset-bottom)); border-top: 1px solid var(--border); box-shadow: 0 -20px 50px rgba(0,0,0,0.5); }
    .sheet-handle { width: 44px; height: 5px; background: #333; border-radius: 10px; margin: -10px auto 30px; }
    .sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    .sheet-header h2 { font-family: 'Fredoka', sans-serif; font-size: 24px; color: var(--gold); font-weight: 700; }
    .close-x { background: rgba(255,255,255,0.05); border: none; color: var(--text-sec); width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group.full { grid-column: span 2; }
    .form-group label { display: block; color: var(--text-sec); font-size: 13px; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 14px 18px; color: var(--text); font-family: inherit; font-size: 16px; outline: none; transition: 0.2s; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--gold); background: #000; }
    .form-group textarea { height: 90px; resize: none; }

    .emoji-picker-container { display: flex; flex-direction: column; gap: 12px; }
    .emoji-preview-input { width: 70px !important; text-align: center; font-size: 28px !important; }
    .quick-emojis-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
    .quick-emojis-scroll button { flex-shrink: 0; width: 48px; height: 48px; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; font-size: 24px; cursor: pointer; transition: 0.2s; }
    .quick-emojis-scroll button.selected { border-color: var(--gold); background: rgba(232,197,71,0.1); transform: scale(1.1); }

    .options-list { background: var(--bg); border-radius: 20px; margin: 28px 0; border: 1px solid var(--border); overflow: hidden; }
    .option-row { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid var(--border); cursor: pointer; transition: 0.2s; }
    .option-row:active { background: rgba(255,255,255,0.02); }
    .option-row:last-child { border-bottom: none; }
    .opt-title { display: block; font-weight: 700; font-size: 15px; margin-bottom: 2px; }
    .opt-desc { display: block; font-size: 12px; color: var(--text-sec); }
    
    .custom-toggle { width: 50px; height: 28px; background: #333; border-radius: 20px; position: relative; transition: 0.3s; }
    .custom-toggle::after { content: ''; width: 22px; height: 22px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .custom-toggle.on { background: var(--gold); }
    .custom-toggle.on::after { left: 25px; background: #0d0d0d; }

    .error-msg { color: var(--red); font-size: 14px; font-weight: 700; margin-top: 12px; text-align: center; background: rgba(255,68,68,0.1); padding: 12px; border-radius: 12px; }

    .sheet-footer { margin-top: 40px; display: flex; flex-direction: column; gap: 14px; }
    .footer-main-row { display: flex; gap: 14px; }
    
    .btn-sheet-primary { flex: 2; background: var(--gold); color: #0d0d0d; border: none; padding: 18px; border-radius: 20px; font-weight: 800; font-size: 17px; cursor: pointer; transition: all 0.2s; font-family: inherit; box-shadow: 0 10px 20px rgba(232,197,71,0.2); }
    .btn-sheet-primary:active { transform: scale(0.96); box-shadow: 0 4px 10px rgba(232,197,71,0.1); }
    .btn-sheet-primary:disabled { opacity: 0.5; box-shadow: none; }
    
    .btn-sheet-secondary { flex: 1; background: #262626; color: var(--text); border: 1px solid #333; padding: 18px; border-radius: 20px; font-weight: 700; font-size: 17px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .btn-sheet-secondary:active { background: #333; }
    
    .btn-sheet-danger { width: 100%; background: rgba(255,68,68,0.05); border: 1px solid rgba(255,68,68,0.15); color: var(--red); padding: 16px; border-radius: 20px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; margin-top: 8px; font-family: inherit; }
    .btn-sheet-danger:hover { background: rgba(255,68,68,0.1); border-color: var(--red); }
    .btn-sheet-danger:active { transform: scale(0.98); }

    .empty-state { text-align: center; padding: 80px 0; color: var(--text-sec); }
    .empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.2; }

    /* Mobile Logic */
    @media (max-width: 768px) {
      .sidebar { width: 100%; height: auto; position: fixed; top: auto; bottom: 0; flex-direction: row; border-right: none; border-top: 1px solid var(--border); padding: 0; padding-bottom: env(safe-area-inset-bottom); box-shadow: 0 -10px 30px rgba(0,0,0,0.3); }
      .sidebar-brand { display: none; }
      .nav-menu { display: flex; width: 100%; padding: 6px 12px; }
      .nav-item { flex: 1; flex-direction: column; gap: 4px; padding: 10px; margin-bottom: 0; border-radius: 12px; }
      .nav-item .icon { font-size: 22px; }
      .nav-item .label { font-size: 11px; }
      .nav-item.active { background: transparent; color: var(--gold); box-shadow: none; }
      
      .main-content { padding: 16px; padding-top: 24px; padding-bottom: calc(100px + env(safe-area-inset-bottom)); }
      .page-header h1 { font-size: 24px; }
      .btn-add-desktop { display: none; }
      .btn-add-mobile { display: block; }
      .filter-bar { margin: 0 -24px 28px; padding: 0 24px; }
      .sheet-container { padding: 24px; }
    }
  `]
})
export class MenuManageComponent implements OnInit {
  items: MenuItem[] = [];
  catFilter = '';
  showSheet = false;
  editingId: number | null = null;
  saving = false;
  formError = '';
  emojis = ['🧋','🍵','🍓','💜','☕','🥛','🧊','🥑','🥭','🍊','🍉','🍑','🟡','🍹','🥤','🍰','🧁','🍫','🫖','🥜'];
  catLabels = CATEGORY_LABELS;
  catKeys = Object.keys(CATEGORY_LABELS);

  form: Partial<MenuItem> = this.emptyForm();

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }

  load() { this.api.getMenuAdmin().subscribe(i => this.items = i); }

  get filteredItems() { return this.catFilter ? this.items.filter(i => i.category === this.catFilter) : this.items; }

  emptyForm(): Partial<MenuItem> {
    return { name:'', price: 0, description:'', category:'trasua', emoji:'🧋', isHot:false, isNew:false, isHidden:false };
  }

  getItemImage(item: MenuItem): string {
    return ''; // Images removed per user request
  }

  openAdd() { this.editingId = null; this.form = this.emptyForm(); this.formError = ''; this.showSheet = true; }

  openEdit(item: MenuItem) {
    this.editingId = item.id;
    this.form = { ...item };
    this.formError = '';
    this.showSheet = true;
  }

  onOverlay(e: Event) {
    if ((e.target as HTMLElement).classList.contains('sheet-overlay')) this.showSheet = false;
  }

  save() {
    if (!this.form.name?.trim()) { this.formError = 'Vui lòng nhập tên món'; return; }
    if (!this.form.price || this.form.price < 0) { this.formError = 'Vui lòng nhập giá hợp lệ'; return; }
    this.saving = true; this.formError = '';

    const req = this.editingId
      ? this.api.updateMenuItem(this.editingId, this.form)
      : this.api.createMenuItem(this.form);

    req.subscribe({
      next: () => { this.showSheet = false; this.saving = false; this.load(); },
      error: () => { this.formError = 'Lỗi lưu dữ liệu, vui lòng thử lại.'; this.saving = false; }
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
