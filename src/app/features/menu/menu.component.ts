import { Component, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
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
    <div class="brand">🥤 HANA</div>
    <div class="table-tag">📍 Bàn <span>{{ tableNum }}</span></div>
  </div>

  <!-- Hero -->
  <div class="hero">
    <div>
      <h2>Chào buổi chiều ☀️</h2>
      <p>Chọn thức uống bạn thích nhé!</p>
    </div>
  </div>

  <!-- Hot Picks -->
  @if (hotItems().length > 0) {
    <div class="section-title">🔥 Hot Picks</div>
    <div class="hot-picks" #hotContainer>
      @for (item of hotItems(); track item.id) {
        <div class="hot-card" (click)="changeQty(item, 1)">
          <div class="hot-emoji-large">{{ item.emoji }}</div>
          <div class="hot-content">
            <div class="hot-name">{{ item.name }}</div>
            <div class="hot-price">{{ item.price | number }}đ</div>
          </div>
          <div class="hot-badge">TOP</div>
        </div>
      }
    </div>
  }

  <!-- Search -->
  <div class="search-wrap">
    <input [ngModel]="searchQ()" (ngModelChange)="searchQ.set($event)" placeholder="🔍 Tìm thức uống...">
  </div>

  <div class="random-box">
    <button class="btn-random" (click)="openRandomizer()">
      🎲 Bạn không biết uống gì?
    </button>
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
        
        <div class="cart-items-list">
          @for (entry of cartEntries(); track entry.item.id) {
            <div class="order-item">
              <div class="order-item-main">
                <div class="order-item-info">
                  <div class="order-name">{{ entry.item.emoji }} {{ entry.item.name }}</div>
                  @if (entry.note) { <div class="order-note">📝 {{ entry.note }}</div> }
                  <div class="order-price-unit">{{ entry.item.price | number }}đ</div>
                </div>
                <div class="order-item-actions">
                  <div class="modal-qty-ctrl">
                    <button class="modal-qty-btn" (click)="changeQty(entry.item, -1)">−</button>
                    <span class="modal-qty-num">{{ entry.qty }}</span>
                    <button class="modal-qty-btn" (click)="changeQty(entry.item, 1)">+</button>
                  </div>
                  <button class="btn-remove-item" (click)="removeItem(entry.item.id)">✕</button>
                </div>
              </div>
              <div class="order-subtotal">{{ entry.item.price * entry.qty | number }}đ</div>
            </div>
          }
        </div>

        <div class="divider"></div>
        <div class="modal-total">
          <div class="modal-total-label">Tổng cộng</div>
          <div class="modal-total-val">{{ totalPrice() | number }}đ</div>
        </div>
        <button class="btn-order" [disabled]="ordering || cartEntries().length === 0" (click)="placeOrder()">
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

  <!-- Randomizer Modal -->
  @if (showSpinner) {
    <div class="spinner-overlay" (click)="$event.stopPropagation()">
      <div class="spinner-modal">
        <div class="spinner-header">
          <h3>Gợi ý cho bạn</h3>
          <button class="close-x" (click)="closeSpinner()">✕</button>
        </div>
        
        <div class="spinner-view">
          <div class="spinner-pointer"></div>
          <div class="spinner-track" [class.spinning]="spinning" [style.transform]="spinning ? 'translateX(-5400px)' : 'translateX(0)'">
            @for (item of spinnerItems; track $index) {
              <div class="spinner-item">
                <div class="item-icon">{{ item.emoji }}</div>
                <div class="item-label">{{ item.name }}</div>
              </div>
            }
          </div>
        </div>

        <div class="spinner-footer">
          @if (spinFinished) {
            <div class="win-announcement">
              <h4>Thử món này nhé!</h4>
              <p>{{ wonItem?.name }}</p>
              <div class="win-actions">
                <button class="btn-respin" (click)="reSpin()">🔄 Quay lại</button>
                <button class="btn-add-win" (click)="addWonItem()">✅ Chọn luôn</button>
              </div>
            </div>
          } @else if (!spinning) {
            <div class="spin-start-msg">Đang chuẩn bị...</div>
          } @else {
            <div class="spinning-msg">🎰 Chúc bạn may mắn!</div>
          }
        </div>
      </div>
    </div>
  }
</div>
  `,
  styles: [`
    :host { display: block; -webkit-tap-highlight-color: transparent; }
    * { margin:0;padding:0;box-sizing:border-box; -webkit-font-smoothing: antialiased; }
    .wrapper { 
      background:#0d0d0d;
      color:#f0ebe0;
      font-family:'Quicksand', sans-serif;
      min-height:100vh;
      padding-bottom: calc(120px + env(safe-area-inset-bottom));
    }
    .topbar { 
      position:sticky;top:0;z-index:100;
      background:rgba(13,13,13,0.9);
      backdrop-filter:blur(20px);
      -webkit-backdrop-filter:blur(20px);
      border-bottom:1px solid #2e2e2e;
      padding: env(safe-area-inset-top) 20px 10px;
      display:flex;align-items:center;justify-content:space-between 
    }
    .brand { font-family:'Fredoka', sans-serif;font-size:24px;color:#e8c547;font-weight:700;letter-spacing:1px }
    .table-tag { background:#242424;border:1px solid #2e2e2e;border-radius:20px;padding:4px 12px;font-size:12px;color:#888 }
    .table-tag span { color:#e8c547;font-weight:600 }
    
    .hero { padding:20px 20px 8px }
    .hero h2 { font-family:'Fredoka', sans-serif;font-size:30px;font-weight:600 }
    .hero p { color:#888;font-size:15px;margin-top:4px }
    
    .hot-picks { 
      display:flex;gap:16px;padding:0 20px 24px;
      overflow-x:auto;scrollbar-width:none;
      scroll-snap-type:x mandatory;
      scroll-behavior: smooth;
    }
    .hot-picks::-webkit-scrollbar { display:none }
    .hot-card { 
      flex:0 0 85%;
      max-width:320px;
      aspect-ratio:16/9;
      background:linear-gradient(135deg, #2e2e2e 0%, #1a1a1a 100%);
      border-radius:24px;
      padding:20px;
      position:relative;
      display:flex;
      align-items:center;
      gap:16px;
      scroll-snap-align:center;
      border:1px solid #3e3e3e;
      overflow:hidden;
      box-shadow:0 10px 30px rgba(0,0,0,0.3);
      cursor:pointer;
      transition: transform 0.2s ease;
    }
    .hot-card:active { transform: scale(0.98); }
    
    .hot-emoji-large { font-size: 64px; flex-shrink: 0; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); }

    .hot-content { flex: 1; min-width: 0; }
    .hot-name { font-size:18px;font-weight:700;margin-bottom:4px;color:#fff; }
    .hot-price { font-size:20px;color:#e8c547;font-weight:800; }
    .hot-badge { 
      position:absolute;
      top:16px;right:16px;
      background:#e8c547;
      color:#0d0d0d;
      font-size:10px;
      font-weight:800;
      padding:4px 10px;
      border-radius:10px;
      letter-spacing:1px;
    }

    .search-wrap { padding:0 20px 16px }
    .search-wrap input { 
      width:100%;background:#242424;border:1px solid #2e2e2e;
      border-radius:24px;padding:12px 20px;color:#f0ebe0;
      font-size:15px;outline:none;
      transition: border-color 0.3s;
      font-family: inherit;
    }
    .search-wrap input:focus { border-color: #e8c547; }

    .random-box { padding: 0 20px 20px; }
    .btn-random { 
      width: 100%; padding: 14px; background: rgba(232,197,71,0.1); 
      border: 1px dashed #e8c547; border-radius: 16px; color: #e8c547; 
      font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s;
      font-family: inherit;
    }
    .btn-random:active { transform: scale(0.97); background: rgba(232,197,71,0.2); }

    .cats { display:flex;gap:8px;padding:0 20px 20px;overflow-x:auto;scrollbar-width:none }
    .cat-btn { 
      white-space:nowrap;padding:8px 18px;border-radius:20px;
      font-size:14px;border:1px solid #2e2e2e;background:#242424;
      color:#888;cursor:pointer;font-weight:600;flex-shrink:0;
      transition: all 0.2s;
      font-family: inherit;
    }
    .cat-btn.active { background:#e8c547;border-color:#e8c547;color:#0d0d0d }
    .cat-btn:active { transform: scale(0.95); }

    .section-title { padding:4px 20px 12px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#888;font-weight:700 }
    
    .menu-list { padding:0 20px;display:flex;flex-direction:column;gap:14px }
    .item-card { 
      background:#1a1a1a;border:1px solid #2e2e2e;border-radius:20px;
      padding:14px;display:flex;gap:14px;
      transition: transform 0.2s;
    }
    .item-card:active { transform: scale(0.99); }
    .item-card.in-cart { border-color:#e8c547;background:rgba(232,197,71,0.03) }
    
    .item-emoji { 
      width:72px;height:72px;background:#242424;border-radius:16px;
      display:flex;align-items:center;justify-content:center;
      font-size:36px;flex-shrink:0;
    }

    .item-info { flex:1;min-width:0 }
    .item-name { font-family:'Fredoka', sans-serif; font-weight:600;font-size:17px;margin-bottom:4px; display:flex; align-items:center; flex-wrap:wrap; gap:4px; }
    .item-desc { font-size:14px;color:#888;line-height:1.4;margin-bottom:10px }
    .item-footer { display:flex;align-items:center;justify-content:space-between }
    .item-price { font-size:18px;color:#e8c547;font-weight:700 }
    
    .badge-hot { background:#ff4444;color:#fff;font-size:10px;padding:2px 7px;border-radius:8px;font-weight:700 }
    .badge-new { background:#4caf7d;color:#fff;font-size:10px;padding:2px 7px;border-radius:8px;font-weight:700 }
    
    .qty-ctrl { display:flex;align-items:center;gap:4px; background: #242424; border-radius: 20px; padding: 2px; }
    .qty-btn { 
      width:32px;height:32px;border-radius:50%;border:none;
      background:transparent;color:#f0ebe0;font-size:18px;
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      transition: background 0.2s;
    }
    .qty-btn:active { background: rgba(255,255,255,0.1); }
    .qty-btn.add-btn { background:#e8c547;color:#0d0d0d;font-weight:800; box-shadow: 0 4px 12px rgba(232,197,71,0.2); }
    .qty-btn.add-btn:active { background: #d4b43f; }
    .qty-num { min-width:24px;text-align:center;font-weight:700;font-size:15px }
    
    .note-btn { font-size:13px;color:#888;cursor:pointer;padding:6px 0;margin-top:4px; display:inline-block; }
    .note-input { 
      margin-top:8px;width:100%;background:#242424;border:1px solid #2e2e2e;
      border-radius:12px;padding:10px 12px;color:#f0ebe0;font-size:14px;
      resize:none;display:none;outline:none;font-family:inherit 
    }
    .note-input.show { display:block }

    .float-cart { 
      position:fixed;bottom:0;left:0;right:0;z-index:200;
      padding:12px 20px calc(20px + env(safe-area-inset-bottom));
      background:linear-gradient(to top,#0d0d0d 80%,transparent) 
    }
    .cart-bar { 
      background:#e8c547;border-radius:18px;padding:16px 20px;
      display:flex;align-items:center;justify-content:space-between;
      cursor:pointer;box-shadow:0 8px 32px rgba(232,197,71,0.3);
      transition: transform 0.2s;
    }
    .cart-bar:active { transform: scale(0.97); }
    .cart-info { display:flex; align-items:center; }
    .cart-count { background:#0d0d0d;color:#e8c547;font-weight:800;font-size:14px;padding:4px 12px;border-radius:12px }
    .cart-label { font-family:'Fredoka', sans-serif; font-weight:700;font-size:17px;color:#0d0d0d;margin-left:12px }
    .cart-total { font-size:20px;color:#0d0d0d;font-weight:800 }

    .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:300;display:flex;align-items:flex-end; backdrop-filter: blur(4px); }
    .modal { 
      background:#1a1a1a;border-radius:32px 32px 0 0;width:100%;
      padding:20px 20px calc(20px + env(safe-area-inset-bottom));
      max-height:85vh;overflow-y:auto;
      box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
    }
    .modal-handle { width:40px;height:5px;background:#3e3e3e;border-radius:3px;margin:0 auto 24px }
    .modal-title { font-family:'Fredoka', sans-serif;font-size:26px;font-weight:700;margin-bottom:6px }
    .modal-sub { color:#888;font-size:15px;margin-bottom:24px }
    
    .cart-items-list { display: flex; flex-direction: column; gap: 16px; }
    .order-item { display:flex; flex-direction: column; gap: 8px; padding:16px 0; border-bottom:1px solid #2e2e2e }
    .order-item-main { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .order-item-info { flex: 1; min-width: 0; }
    .order-name { font-weight:600;font-size:16px }
    .order-note { font-size:13px;color:#888;margin-top:4px }
    .order-price-unit { font-size: 13px; color: #888; margin-top: 2px; }
    
    .order-item-actions { display: flex; align-items: center; gap: 12px; }
    .modal-qty-ctrl { display: flex; align-items: center; background: #242424; border-radius: 12px; padding: 4px; }
    .modal-qty-btn { 
      width: 28px; height: 28px; border: none; background: transparent; color: #f0ebe0; 
      font-size: 16px; display: flex; align-items: center; justify-content: center;
    }
    .modal-qty-num { min-width: 24px; text-align: center; font-weight: 700; font-size: 14px; }
    .btn-remove-item { 
      width: 28px; height: 28px; background: rgba(255, 68, 68, 0.1); color: #ff4444; 
      border: none; border-radius: 8px; font-size: 14px; display: flex; align-items: center; justify-content: center;
    }

    .order-subtotal { align-self: flex-end; color:#e8c547;font-weight:700;font-size:16px; }
    
    .divider { height:1px;background:#2e2e2e;margin:20px 0 }
    .modal-total { display:flex;justify-content:space-between;align-items:center;margin:20px 0 }
    .modal-total-label { font-size:18px;font-weight:700 }
    .modal-total-val { font-size:28px;color:#e8c547;font-weight:800 }
    
    .btn-order { 
      width:100%;padding:18px;background:#e8c547;color:#0d0d0d;border:none;
      border-radius:18px;font-size:18px;font-weight:800;cursor:pointer;
      margin-top:8px; transition: all 0.2s;
      font-family: inherit;
    }
    .btn-order:active { transform: scale(0.97); background: #d4b43f; }
    .btn-order:disabled { opacity:0.6;cursor:not-allowed }
    .btn-close { 
      width:100%;padding:14px;background:transparent;color:#888;
      border:1px solid #2e2e2e;border-radius:18px;font-size:16px;
      cursor:pointer;margin-top:12px; font-weight:600;
      font-family: inherit;
    }
    
    .success-screen { 
      position:fixed;inset:0;background:#0d0d0d;z-index:500;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      text-align:center;padding:40px 
    }
    .success-icon { font-size:80px;margin-bottom:24px }
    .success-title { font-family:'Fredoka', sans-serif;font-size:34px;margin-bottom:12px;color:#4caf7d;font-weight:700 }
    .success-sub { color:#888;font-size:16px;line-height:1.6 }
    .success-table { font-size:22px;color:#e8c547;font-weight:700;margin-top:20px }
    .btn-back { 
      margin-top:40px;padding:16px 48px;background:#242424;color:#f0ebe0;
      border:1px solid #2e2e2e;border-radius:18px;font-size:17px;
      cursor:pointer; font-weight:700; transition: all 0.2s;
      font-family: inherit;
    }
    .btn-back:active { transform: scale(0.95); background: #333; }

    /* Spinner CS:GO Style */
    .spinner-overlay { 
      position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:1000; 
      display:flex; align-items:center; justify-content:center; padding:20px;
      backdrop-filter: blur(8px);
    }
    .spinner-modal { 
      background:#1a1a1a; border: 1px solid #333; border-radius:32px; width:100%; max-width:500px;
      padding:24px; position:relative; overflow:hidden;
    }
    .spinner-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; }
    .spinner-header h3 { font-family:'Fredoka', sans-serif; font-size:22px; color:#e8c547; }
    .close-x { background:none; border:none; color:#888; font-size:24px; cursor:pointer; }
    
    .spinner-view { 
      position:relative; height:140px; background:#0d0d0d; border-radius:16px; 
      overflow:hidden; border:1px solid #2e2e2e;
      margin-bottom:20px;
    }
    .spinner-pointer { 
      position:absolute; top:0; bottom:0; left:50%; width:4px; background:#e8c547;
      transform:translateX(-50%); z-index:2; box-shadow:0 0 15px rgba(232,197,71,0.5);
    }
    .spinner-pointer::after {
      content:''; position:absolute; top:-10px; left:-8px; border:10px solid transparent; border-top-color:#e8c547;
    }
    .spinner-track { 
      display:flex; position:absolute; left:50%; top:0; bottom:0; 
      transition: none; transform: translateX(0);
    }
    .spinner-track.spinning { 
      transition: transform 5s cubic-bezier(0.15, 0, 0.15, 1);
    }
    .spinner-item { 
      width:120px; flex-shrink:0; display:flex; flex-direction:column; 
      align-items:center; justify-content:center; border-right:1px solid #1a1a1a;
      background:linear-gradient(to bottom, #1a1a1a, #0d0d0d);
    }
    .item-icon { width: 60px; height: 60px; margin-bottom:8px; display: flex; align-items: center; justify-content: center; font-size: 40px; }
    .item-label { font-size:11px; color:#888; text-align:center; padding:0 5px; font-weight:500; }
    
    .spinner-footer { min-height:140px; display:flex; align-items:center; justify-content:center; text-align:center; }
    .win-announcement { animation: fadeIn 0.5s ease forwards; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .win-announcement h4 { color:#888; font-size:14px; margin-bottom:8px; }
    .win-announcement p { font-family:'Fredoka', sans-serif; font-size:22px; font-weight:700; color:#fff; margin-bottom:16px; }
    
    .win-actions { display: flex; gap: 12px; justify-content: center; }
    .btn-respin { 
      background: rgba(255,255,255,0.1); color: #fff; border: 1px solid #333; 
      padding: 12px 20px; border-radius: 14px; font-weight: 600; cursor: pointer;
    }
    .btn-add-win { 
      background:#e8c547; color:#0d0d0d; border:none; padding:12px 30px; 
      border-radius:14px; font-weight:800; font-size:16px; cursor:pointer;
      font-family: inherit;
    }
    .spinning-msg { color: #888; font-style: italic; }
  `]
})
export class MenuComponent implements OnInit, AfterViewInit, OnDestroy {
  tableNum = '1';

  @ViewChild('hotContainer') hotContainer?: ElementRef<HTMLDivElement>;
  private slideInterval?: any;

  allItems = signal<MenuItem[]>([]);
  activeCat = signal('all');
  searchQ = signal('');
  cartMap = signal<Map<number, { qty: number; note: string }>>(new Map());

  showNote: Record<number, boolean> = {};
  openModal = false;
  ordering = false;
  orderSuccess = false;

  // Spinner state
  showSpinner = false;
  spinning = false;
  spinFinished = false;
  spinnerItems: MenuItem[] = [];
  wonItem: MenuItem | null = null;

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

  hotItems = computed(() => this.allItems().filter(i => i.isHot));

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.tableNum = this.route.snapshot.queryParamMap.get('table') ?? '1';
    this.api.getMenu().subscribe(items => this.allItems.set(items));
  }

  ngAfterViewInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    if (this.slideInterval) clearInterval(this.slideInterval);
  }

  private currentHotIndex = 0;
  startAutoSlide() {
    if (this.slideInterval) clearInterval(this.slideInterval);
    this.slideInterval = setInterval(() => {
      const items = this.hotItems();
      const el = this.hotContainer?.nativeElement;
      if (!el || items.length <= 1) return;
      
      this.currentHotIndex++;
      if (this.currentHotIndex >= items.length) {
        this.currentHotIndex = 0;
      }
      
      const cards = el.querySelectorAll('.hot-card');
      const targetCard = cards[this.currentHotIndex] as HTMLElement;
      
      if (targetCard) {
        const targetScroll = targetCard.offsetLeft - (el.clientWidth - targetCard.clientWidth) / 2;
        el.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    }, 4000);
  }

  openRandomizer() {
    const all = this.allItems();
    if (all.length < 3) return;

    this.prepareSpinner();
    this.showSpinner = true;
    this.spinning = false;
    this.spinFinished = false;

    setTimeout(() => {
      this.startSpin();
    }, 300);
  }

  private prepareSpinner() {
    const all = this.allItems();
    this.spinnerItems = [];
    for (let i = 0; i < 50; i++) {
      this.spinnerItems.push(all[Math.floor(Math.random() * all.length)]);
    }
    this.wonItem = this.spinnerItems[45];
  }

  private startSpin() {
    this.spinning = true;
    this.spinFinished = false;
    setTimeout(() => {
      this.spinFinished = true;
    }, 5200);
  }

  reSpin() {
    this.spinning = false;
    this.spinFinished = false;
    this.prepareSpinner();
    setTimeout(() => {
      this.startSpin();
    }, 100);
  }

  closeSpinner() {
    this.showSpinner = false;
    this.spinning = false;
    this.spinFinished = false;
    this.wonItem = null;
  }

  addWonItem() {
    if (this.wonItem) {
      this.changeQty(this.wonItem, 1);
      this.closeSpinner();
    }
  }

  setCat(cat: string) { this.activeCat.set(cat); }

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

  removeItem(id: number) {
    const map = new Map(this.getCart());
    map.delete(id);
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