import { Component, OnInit, signal, computed } from '@angular/core';
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
<div class="theme-wrapper" [class.dark-theme]="isDarkMode()">
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
        <div class="header-actions">
          <button class="btn-theme" (click)="toggleTheme()" [title]="isDarkMode() ? 'Chế độ sáng' : 'Chế độ tối'">
            {{ isDarkMode() ? '☀️' : '🌙' }}
          </button>
          <button class="btn-add-mobile" (click)="openAdd()">+</button>
          <button class="btn-add-desktop" (click)="openAdd()">+ Thêm món mới</button>
        </div>
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
    }

    .admin-layout { display: flex; min-height: 100vh; background: var(--bg); color: var(--text); transition: 0.3s; }

    /* Sidebar */
    .sidebar { width: 240px; background: var(--brand); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 0; position: sticky; top: 0; height: 100vh; z-index: 1000; }
    .dark-theme .sidebar { background: #111; }
    .sidebar-brand { font-family: 'Fredoka', sans-serif; font-size: 26px; color: #fff; padding: 0 24px 30px; font-weight: 700; }
    .nav-menu { flex: 1; padding: 0 12px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; color: rgba(255,255,255,0.7); text-decoration: none; font-weight: 700; margin-bottom: 6px; transition: 0.2s; }
    .nav-item.active { background: rgba(255,255,255,0.15); color: #fff; }

    /* Main Content */
    .main-content { flex: 1; padding: 32px; max-width: 1000px; margin: 0 auto; width: 100%; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .page-header h1 { font-family: 'Fredoka', sans-serif; font-size: 28px; color: var(--brand); }
    .subtitle { color: var(--text-sec); font-size: 14px; font-weight: 600; }
    
    .header-actions { display: flex; gap: 10px; align-items: center; }
    .btn-theme { background: var(--card); border: 1px solid var(--border); color: var(--brand); width: 44px; height: 44px; border-radius: 12px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; }

    .btn-add-desktop { background: var(--brand); color: #fff; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 800; cursor: pointer; }
    .btn-add-mobile { display: none; background: var(--brand); color: #fff; border: none; width: 44px; height: 44px; border-radius: 12px; font-size: 24px; font-weight: 800; }

    /* Filter Chips */
    .filter-bar { margin-bottom: 24px; overflow-x: auto; scrollbar-width: none; }
    .category-chips { display: flex; gap: 8px; }
    .category-chips button { white-space: nowrap; background: var(--card); border: 1px solid var(--border); color: var(--text-sec); padding: 8px 18px; border-radius: 50px; font-weight: 700; cursor: pointer; font-family: inherit; font-size: 13px; }
    .category-chips button.active { background: var(--brand); color: #fff; border-color: var(--brand); }

    /* Menu List */
    .menu-list { display: flex; flex-direction: column; gap: 12px; }
    .menu-item-row { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 12px; display: flex; align-items: center; gap: 14px; }
    .menu-item-row.is-hidden { opacity: 0.4; filter: grayscale(1); }
    
    .item-visual { width: 56px; height: 56px; background: var(--brand-light); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; }
    .item-info { flex: 1; min-width: 0; }
    .item-name-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .item-name-row h3 { font-family: 'Fredoka', sans-serif; font-size: 17px; font-weight: 600; color: var(--text); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-badges { display: flex; gap: 4px; flex-shrink: 0; }
    .item-meta { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-sec); }
    .price { color: var(--brand); font-weight: 700; font-size: 15px; }
    .dot { opacity: 0.5; }
    
    .badge { font-size: 9px; padding: 2px 6px; border-radius: 6px; font-weight: 800; letter-spacing: 0.5px; }
    .badge.hot { background: var(--red); color: #fff; }
    .badge.new { background: #6b8e23; color: #fff; }

    .btn-edit-row { background: var(--brand-light); color: var(--brand); border: none; padding: 10px 18px; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; }
    .btn-edit-row:hover { background: var(--brand); color: #fff; }

    .empty-state { padding: 80px 20px; text-align: center; background: var(--card); border-radius: 32px; border: 1.5px dashed var(--border); margin-top: 32px; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state p { font-weight: 700; color: var(--text-sec); margin: 0; }

    /* Bottom Sheet */
    .sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 2000; display: flex; align-items: flex-end; backdrop-filter: blur(8px); }
    .sheet-container { background: var(--bg); width: 100%; border-radius: 24px 24px 0 0; padding: 20px; max-height: 92vh; overflow-y: auto; padding-bottom: calc(20px + env(safe-area-inset-bottom)); border-top: 1px solid var(--border); }
    .sheet-handle { width: 36px; height: 4px; background: var(--border); border-radius: 10px; margin: -5px auto 20px; }
    .sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .sheet-header h2 { font-family: 'Fredoka', sans-serif; font-size: 22px; color: var(--brand); margin: 0; }
    .close-x { background: var(--brand-light); border: none; color: var(--brand); width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

    .form-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .form-group { flex: 1; min-width: calc(50% - 8px); }
    .form-group.full { flex: 1 1 100%; }
    .form-group label { display: block; color: var(--text-sec); font-size: 12px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; background: var(--card); border: 1.5px solid var(--border); border-radius: 14px; padding: 14px; color: var(--text); font-family: inherit; font-size: 15px; outline: none; transition: 0.2s; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 4px var(--brand-light); }
    
    .emoji-picker-container { display: flex; gap: 12px; align-items: center; }
    .emoji-preview-input { width: 64px !important; height: 64px !important; text-align: center; font-size: 32px !important; padding: 0 !important; }
    .quick-emojis-scroll { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 4px 0; }
    .quick-emojis-scroll button { flex-shrink: 0; width: 48px; height: 48px; background: var(--card); border: 1.5px solid var(--border); border-radius: 12px; font-size: 22px; cursor: pointer; transition: 0.2s; }
    .quick-emojis-scroll button:hover { background: var(--brand-light); }
    .quick-emojis-scroll button.selected { border-color: var(--brand); background: var(--brand-light); transform: scale(1.1); }

    .options-list { background: var(--card); border-radius: 16px; margin: 20px 0; border: 1px solid var(--border); }
    .option-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border); cursor: pointer; }
    .opt-title { font-weight: 700; font-size: 14px; }
    .custom-toggle { width: 44px; height: 24px; background: var(--border); border-radius: 20px; position: relative; transition: 0.3s; }
    .custom-toggle::after { content: ''; width: 18px; height: 18px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: 0.3s; }
    .custom-toggle.on { background: var(--brand); }
    .custom-toggle.on::after { left: 23px; }

    .sheet-footer { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
    .footer-main-row { display: flex; gap: 12px; }
    .btn-sheet-primary { flex: 2; background: var(--brand); color: #fff; border: none; padding: 16px; border-radius: 16px; font-weight: 800; font-size: 16px; cursor: pointer; }
    .btn-sheet-secondary { flex: 1; background: var(--brand-light); color: var(--brand); border: none; padding: 16px; border-radius: 16px; font-weight: 700; font-size: 16px; cursor: pointer; }
    .btn-sheet-danger { width: 100%; background: rgba(230, 107, 91, 0.1); color: var(--red); border: none; padding: 14px; border-radius: 16px; font-weight: 700; font-size: 14px; cursor: pointer; }

    @media (max-width: 768px) {
      .sidebar { width: 100%; height: auto; position: fixed; top: auto; bottom: 0; flex-direction: row; border-right: none; border-top: 1px solid var(--border); padding: 0; padding-bottom: env(safe-area-inset-bottom); }
      .sidebar-brand { display: none; }
      .nav-menu { display: flex; width: 100%; padding: 4px 10px; }
      .nav-item { flex: 1; flex-direction: column; gap: 4px; padding: 8px; margin-bottom: 0; border-radius: 8px; }
      .nav-item.active { background: rgba(255,255,255,0.1); color: #fff; }
      .main-content { padding: 16px; padding-top: 24px; padding-bottom: calc(100px + env(safe-area-inset-bottom)); }
      .btn-add-desktop { display: none; }
      .btn-add-mobile { display: block; }
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
  isDarkMode = signal(false);
  emojis = ['🧋','🍵','🍓','💜','☕','🥛','🧊','🥑','🥭','🍊','🍉','🍑','🟡','🍹','🥤','🍰','🧁','🍫','🫖','🥜'];
  catLabels = CATEGORY_LABELS;
  catKeys = Object.keys(CATEGORY_LABELS);

  form: Partial<MenuItem> = this.emptyForm();

  constructor(private api: ApiService) {}
  ngOnInit() { 
    this.load(); 
    const savedTheme = localStorage.getItem('hana_theme');
    if (savedTheme === 'dark') this.isDarkMode.set(true);
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    localStorage.setItem('hana_theme', this.isDarkMode() ? 'dark' : 'light');
  }

  load() { this.api.getMenuAdmin().subscribe(i => this.items = i); }

  get filteredItems() { return this.catFilter ? this.items.filter(i => i.category === this.catFilter) : this.items; }

  emptyForm(): Partial<MenuItem> {
    return { name:'', price: 0, description:'', category:'trasua', emoji:'🧋', isHot:false, isNew:false, isHidden:false };
  }

  openAdd() { this.editingId = null; this.form = this.emptyForm(); this.formError = ''; this.showSheet = true; }

  openEdit(item: MenuItem) {
    this.editingId = item.id;
    this.form = { ...item };
    this.formError = '';
    this.showSheet = true;
  }

  onOverlay(e: Event) { if ((e.target as HTMLElement).classList.contains('sheet-overlay')) this.showSheet = false; }

  save() {
    if (!this.form.name?.trim()) { this.formError = 'Vui lòng nhập tên món'; return; }
    if (!this.form.price || this.form.price < 0) { this.formError = 'Vui lòng nhập giá hợp lệ'; return; }
    this.saving = true; this.formError = '';
    const req = this.editingId ? this.api.updateMenuItem(this.editingId, this.form) : this.api.createMenuItem(this.form);
    req.subscribe({
      next: () => { this.showSheet = false; this.saving = false; this.load(); },
      error: () => { this.formError = 'Lỗi lưu dữ liệu!'; this.saving = false; }
    });
  }

  confirmDelete(item: MenuItem) { if (confirm(`Xoá món "${item.name}"?`)) this.api.deleteMenuItem(item.id).subscribe(() => this.load()); }

  deleteEditing() {
    if (!this.editingId) return;
    const item = this.items.find(i => i.id === this.editingId);
    if (item && confirm(`Xoá món "${item.name}"?`)) {
      this.api.deleteMenuItem(this.editingId).subscribe(() => { this.showSheet = false; this.load(); });
    }
  }
}
