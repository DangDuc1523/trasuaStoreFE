import { Component, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { MenuItem, CATEGORY_LABELS } from '../../core/models';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="theme-wrapper" [class.dark-theme]="isDarkMode()">
  <div class="wrapper">
    <!-- Topbar -->
    <div class="topbar">
      <div class="brand">🥤 HANA</div>
      <div class="top-actions">
        <button class="btn-theme" (click)="toggleTheme()" [title]="isDarkMode() ? 'Bật chế độ sáng' : 'Bật chế độ tối'">
          {{ isDarkMode() ? '☀️' : '🌙' }}
        </button>
        <div class="table-tag">📍 Bàn <span>{{ tableNum }}</span></div>
      </div>
    </div>

    <!-- Hero -->
    <div class="hero">
      <div>
        <h2>{{ greeting().text }}</h2>
        <p>{{ greeting().sub }}</p>
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

    <!-- Search & Random -->
    <div class="search-section">
      <div class="search-wrap">
        <input [ngModel]="searchQ()" (ngModelChange)="searchQ.set($event)" placeholder="🔍 Tìm thức uống...">
      </div>
      <button class="btn-random-wide" (click)="openRandomizer()">
        <span class="dice">🎲</span>
        <span class="text">Bạn chưa biết chọn gì?</span>
      </button>
    </div>

    <!-- Categories -->
    <div class="cats">
      <button class="cat-btn" [class.active]="activeCat()==='all'" (click)="setCat('all')">Tất cả</button>
      @for (cat of catKeys; track cat) {
        <button class="cat-btn" [class.active]="activeCat()===cat" (click)="setCat(cat)">
          {{ catLabels[cat] }}
        </button>
      }
    </div>

    <!-- Menu list -->
    <div class="section-title">Thực đơn hôm nay</div>
    <div class="menu-list">
      @for (item of filteredItems(); track item.id) {
        <div class="item-card" [class.in-cart]="cartQty(item.id) > 0">
          <div class="item-emoji-box">{{ item.emoji }}</div>
          <div class="item-info">
            <div class="item-name-row">
              <span class="name">{{ item.name }}</span>
              <div class="badges">
                @if (item.isHot) { <span class="badge hot">HOT</span> }
                @if (item.isNew) { <span class="badge new">MỚI</span> }
              </div>
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
              <div class="note-section">
                <div class="note-toggle" (click)="toggleNote(item.id)">
                  {{ showNote[item.id] ? '🔼 Thu gọn' : '✏️ Thêm ghi chú' }}
                </div>
                <textarea
                  class="note-input"
                  [class.show]="showNote[item.id]"
                  [ngModel]="getNote(item.id)"
                  (ngModelChange)="setNote(item.id, $event)"
                  placeholder="Ghi chú (ít đá, nhiều đường...)">
                </textarea>
              </div>
            }
          </div>
        </div>
      }
    </div>

    <!-- Float cart bar -->
    <div class="float-cart" *ngIf="totalItems() > 0">
      <div class="cart-bar" (click)="openModal = true">
        <div class="cart-left">
          <div class="cart-count">{{ totalItems() }}</div>
          <span class="cart-label">Xem giỏ hàng</span>
        </div>
        <div class="cart-total">{{ totalPrice() | number }}đ</div>
      </div>
    </div>

    <!-- Cart modal -->
    @if (openModal) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div class="modal">
          <div class="modal-handle"></div>
          <div class="modal-header">
            <h3>Giỏ hàng của bạn</h3>
            <button class="btn-close-modal" (click)="openModal = false">✕</button>
          </div>
          
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
          <div class="modal-footer">
            <div class="modal-total-row">
              <span class="label">Tổng cộng</span>
              <span class="value">{{ totalPrice() | number }}đ</span>
            </div>
            <button class="btn-order" [disabled]="ordering || cartEntries().length === 0" (click)="placeOrder()">
              {{ ordering ? '⏳ Đang gửi...' : '✅ Gửi đặt món' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Success screen -->
    @if (orderSuccess) {
      <div class="success-screen">
        <div class="success-icon">🎉</div>
        <div class="success-title">Đặt món thành công!</div>
        <div class="success-sub">Nhân viên đã nhận được yêu cầu của bạn.</div>
        <button class="btn-back" (click)="resetOrder()">🛍 Tiếp tục đặt</button>
      </div>
    }

    @if (showSpinner) {
      <div class="spinner-overlay" (click)="$event.stopPropagation()">
        <div class="spinner-modal">
          <div class="spinner-header">
            <h3>🎲 Gợi ý cho bạn</h3>
            <button class="close-x" (click)="closeSpinner()">✕</button>
          </div>
          
          <div class="spinner-view" #spinnerView>
            <div class="spinner-pointer"></div>
            <div class="spinner-track" [class.spinning]="spinning" 
                 [style.transform]="spinning ? 'translateX(' + spinOffset + 'px)' : 'translateX(0)'">
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
                <div class="win-emoji">{{ wonItem?.emoji }}</div>
                <p class="win-name">{{ wonItem?.name }}</p>
                <div class="win-actions">
                  <button class="btn-respin" (click)="reSpin()">🔄 Thử lại</button>
                  <button class="btn-add-win" (click)="addWonItem()">✅ Chọn món này</button>
                </div>
              </div>
            } @else {
              <div class="spinner-status">
                <div class="spinning-msg">{{ spinning ? '⏳ Chờ xíu nhé...' : 'Chờ xíu nha!' }}</div>
              </div>
            }
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
      display: block; 
      -webkit-tap-highlight-color: transparent; 
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
    
    * { margin:0;padding:0;box-sizing:border-box; -webkit-font-smoothing: antialiased; }
    .theme-wrapper { transition: background 0.3s ease; }
    .wrapper { background: var(--bg); color: var(--text); font-family: 'Quicksand', sans-serif; min-height: 100vh; padding-bottom: calc(120px + env(safe-area-inset-bottom)); }
    
    .topbar { position:sticky; top:0; z-index:100; background: var(--bg); border-bottom: 1px solid var(--border); padding: env(safe-area-inset-top) 20px 10px; display:flex; align-items:center; justify-content:space-between; }
    .brand { font-family:'Fredoka', sans-serif; font-size:24px; color: var(--brand); font-weight:700; }
    .top-actions { display: flex; align-items: center; gap: 12px; }
    .btn-theme { background: var(--brand-light); border: 1px solid var(--border); width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
    .table-tag { background: var(--brand-light); border: 1px solid var(--border); border-radius:20px; padding:6px 14px; font-size:12px; color: var(--brand); font-weight: 700; }
    
    .hero { padding:32px 20px 12px }
    .hero h2 { font-family:'Fredoka', sans-serif; font-size:32px; font-weight:600; color: var(--brand); }
    .hero p { color: var(--text-sec); font-size: 16px; margin-top: 6px; }

    .hot-picks { display:flex; gap:16px; padding:0 20px 24px; overflow-x:auto; scrollbar-width:none; scroll-snap-type:x mandatory; scroll-behavior: smooth; }
    .hot-card { flex:0 0 85%; max-width:320px; aspect-ratio:16/9; background: linear-gradient(135deg, var(--brand) 0%, #4a3424 100%); border-radius:28px; padding:20px; position:relative; display:flex; align-items:center; gap:20px; scroll-snap-align:center; box-shadow: 0 12px 30px rgba(123, 78, 42, 0.15); border: 1px solid rgba(255,255,255,0.1); }
    .dark-theme .hot-card { background: linear-gradient(135deg, #2e2e2e 0%, #1a1a1a 100%); box-shadow: 0 12px 30px rgba(0,0,0,0.3); }
    .hot-emoji-large { font-size: 64px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.2)); }
    .hot-name { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .hot-price { font-size: 20px; color: var(--accent); font-weight: 800; }
    .hot-badge { position:absolute; top:16px; right:16px; background: var(--accent); color: #fff; font-size:10px; font-weight:800; padding:4px 10px; border-radius:10px; }
    .dark-theme .hot-badge { color: #000; }

    .search-section { display: flex; flex-direction: column; gap: 12px; padding: 0 20px 20px; }
    .search-wrap input { width:100%; background: var(--card); border: 1.5px solid var(--border); border-radius:20px; padding:14px 20px; color: var(--text); font-size:15px; outline:none; font-family: inherit; transition: 0.2s; }
    .search-wrap input:focus { border-color: var(--brand); box-shadow: 0 0 0 4px var(--brand-light); }
    
    .btn-random-wide { background: var(--brand-light); border: 1.5px solid var(--border); border-radius: 20px; padding: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.2s; }
    .btn-random-wide:active { transform: scale(0.98); }
    .btn-random-wide .dice { font-size: 20px; }
    .btn-random-wide .text { font-size: 14px; font-weight: 700; color: var(--brand); }

    .cats { display:flex; gap:10px; padding:0 20px 24px; overflow-x:auto; scrollbar-width:none }
    .cat-btn { white-space:nowrap; padding:10px 20px; border-radius:50px; font-size:14px; border: 1.5px solid var(--border); background: var(--card); color: var(--text-sec); cursor:pointer; font-weight:700; font-family: inherit; transition: 0.2s; }
    .cat-btn.active { background: var(--brand); border-color: var(--brand); color: #fff; }
    .dark-theme .cat-btn.active { color: #000; }

    .section-title { padding:0 20px 14px; font-size:13px; font-weight:800; color: var(--text-sec); text-transform: uppercase; letter-spacing: 1.5px; }

    .menu-list { padding:0 20px; display:flex; flex-direction:column; gap:16px }
    .item-card { background: var(--card); border: 1.5px solid var(--border); border-radius:24px; padding:16px; display:flex; gap:16px; transition: 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
    .item-card.in-cart { border-color: var(--brand); background: var(--brand-light); }
    .item-emoji-box { width:80px; height:80px; background: var(--brand-light); border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:38px; flex-shrink:0; }
    .item-info { flex:1; min-width:0; }
    .item-name-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .item-name-row .name { font-family:'Fredoka', sans-serif; font-weight:600; font-size:17px; color: var(--text); }
    .item-desc { font-size:14px; color: var(--text-sec); line-height:1.4; margin-bottom:12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .item-footer { display:flex; align-items:center; justify-content:space-between }
    .item-price { font-size:19px; color: var(--brand); font-weight:800 }
    
    .badges { display: flex; gap: 4px; }
    .badge { font-size: 8px; padding: 2px 6px; border-radius: 6px; font-weight: 800; }
    .badge.hot { background: var(--red); color: #fff; }
    .badge.new { background: #6b8e23; color: #fff; }

    .qty-ctrl { display:flex; align-items:center; gap:8px; background: var(--brand-light); border-radius: 50px; padding: 4px; border: 1px solid var(--border); }
    .qty-btn { width:32px; height:32px; border-radius:50%; border:none; background: var(--brand); color: #fff; font-size:18px; cursor:pointer; font-weight: 800; display:flex; align-items:center; justify-content:center; }
    .dark-theme .qty-btn { color: #000; }
    .qty-num { min-width:20px; text-align:center; font-weight:800; font-size:15px; color: var(--brand); }
    
    .note-section { margin-top: 12px; }
    .note-toggle { font-size: 13px; font-weight: 700; color: var(--accent); cursor: pointer; }
    .note-input { margin-top: 8px; width: 100%; background: var(--bg); border: 1.5px solid var(--border); border-radius: 16px; padding: 12px; color: var(--text); font-size: 14px; resize: none; display: none; outline: none; font-family: inherit; }
    .note-input.show { display: block; }

    .float-cart { position:fixed; bottom:0; left:0; right:0; z-index:200; padding:16px 20px calc(24px + env(safe-area-inset-bottom)); background: linear-gradient(to top, var(--bg) 80%, transparent) }
    .cart-bar { background: var(--brand); border-radius:24px; padding:18px 24px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; box-shadow: 0 15px 40px rgba(123, 78, 42, 0.3); transition: 0.2s; }
    .cart-bar:active { transform: scale(0.97); }
    .cart-left { display: flex; align-items: center; gap: 14px; }
    .cart-count { background: #fff; color: var(--brand); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
    .cart-label { font-family:'Fredoka', sans-serif; font-weight:700; font-size:18px; color: #fff; }
    .cart-total { font-size:22px; color: #fff; font-weight: 800; }
    .dark-theme .cart-label, .dark-theme .cart-total, .dark-theme .cart-count { color: #000; }

    .modal-overlay { position:fixed; inset:0; background: rgba(0,0,0,0.6); z-index:300; display:flex; align-items:flex-end; backdrop-filter: blur(8px); }
    .modal { background: var(--bg); border-radius:32px 32px 0 0; width:100%; padding:24px; max-height:85vh; overflow-y:auto; }
    .modal-handle { width:40px; height:5px; background: var(--border); border-radius:3px; margin:0 auto 24px }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .modal-header h3 { font-family:'Fredoka', sans-serif; font-size:24px; font-weight:700; color: var(--brand); }
    .btn-close-modal { background: var(--brand-light); border: none; color: var(--text); width: 32px; height: 32px; border-radius: 50%; font-size: 14px; cursor: pointer; }

    .cart-items-list { display: flex; flex-direction: column; gap: 16px; }
    .order-item { padding:16px; background: var(--card); border-radius: 20px; border: 1.5px solid var(--border); }
    .order-item-main { display: flex; justify-content: space-between; align-items: center; }
    .order-name { font-weight:700; font-size:16px; color: var(--text); }
    .order-note { font-size:13px; color: var(--text-sec); margin-top: 4px; font-style: italic; }
    .order-item-actions { display: flex; align-items: center; gap: 12px; }
    .modal-qty-ctrl { display: flex; align-items: center; background: var(--brand-light); border-radius: 12px; padding: 4px; }
    .modal-qty-btn { width: 32px; height: 32px; border: none; background: transparent; color: var(--brand); font-size: 18px; font-weight: 800; cursor: pointer; }
    .btn-remove-item { width: 32px; height: 32px; background: rgba(230, 107, 91, 0.1); color: var(--red); border: none; border-radius: 10px; font-size: 14px; }
    .order-subtotal { text-align: right; margin-top: 12px; color: var(--brand); font-weight:800; font-size:16px; }

    .divider { height:1px; background: var(--border); margin:24px 0 }
    .modal-footer { display: flex; flex-direction: column; gap: 16px; }
    .modal-total-row { display: flex; justify-content: space-between; align-items: center; }
    .modal-total-row .label { font-size: 18px; font-weight: 700; color: var(--text-sec); }
    .modal-total-row .value { font-size: 32px; font-weight: 800; color: var(--brand); font-family: 'Fredoka', sans-serif; }
    
    .btn-order { width:100%; padding:20px; background: var(--brand); color: #fff; border:none; border-radius:24px; font-size:18px; font-weight:800; cursor:pointer; font-family: inherit; }
    .dark-theme .btn-order { color: #000; }

    .success-screen { position:fixed; inset:0; background: var(--bg); z-index:500; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:40px }
    .success-icon { font-size: 80px; margin-bottom: 20px; }
    .success-title { font-family:'Fredoka', sans-serif; font-size:32px; color: var(--brand); font-weight:700; margin-bottom: 12px; }
    .success-sub { color: var(--text-sec); font-size: 16px; }
    .btn-back { margin-top:40px; padding:18px 48px; background: var(--brand); color: #fff; border:none; border-radius:20px; font-size:16px; font-weight:700; font-family: inherit; }

    .spinner-overlay { position:fixed; inset:0; background: rgba(0,0,0,0.8); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter: blur(10px); }
    .spinner-modal { background: var(--bg); border: 2px solid var(--border); border-radius:32px; width:100%; max-width:460px; padding:32px; position:relative; overflow:hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
    
    .spinner-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .spinner-header h3 { font-family:'Fredoka', sans-serif; font-size:22px; font-weight:700; color: var(--brand); margin: 0; }
    .close-x { background: var(--brand-light); border: none; color: var(--brand); width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .close-x:hover { transform: rotate(90deg); background: var(--brand); color: #fff; }

    .spinner-view { position:relative; height:160px; background: var(--card); border-radius:24px; overflow:hidden; border: 2px solid var(--border); margin-bottom:24px; }
    .spinner-pointer { position:absolute; top:0; bottom:0; left:50%; width:4px; background: var(--brand); transform:translateX(-50%); z-index:10; box-shadow: 0 0 15px rgba(123, 78, 42, 0.4); border-radius: 2px; }
    .spinner-pointer::before { content: '▼'; position: absolute; top: -2px; left: 50%; transform: translateX(-50%); color: var(--brand); font-size: 14px; }
    .spinner-pointer::after { content: '▲'; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); color: var(--brand); font-size: 14px; }

    .spinner-track { display: flex; height: 100%; transition: none; will-change: transform; }
    .spinner-track.spinning { transition: transform 5s cubic-bezier(0.1, 0, 0.1, 1); }
    
    .spinner-item { flex: 0 0 120px; width: 120px; max-width: 120px; background: var(--card); border-right: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
    .spinner-item:nth-child(even) { background: var(--brand-light); }
    .item-icon { font-size: 48px; margin-bottom: 8px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)); }
    .item-label { font-size: 13px; color: var(--text-sec); font-weight: 700; text-align: center; padding: 0 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }

    .spinner-footer { text-align: center; min-height: 120px; display: flex; align-items: center; justify-content: center; }
    .win-announcement { animation: fadeInScale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .win-emoji { font-size: 60px; margin-bottom: 10px; animation: bounce 2s infinite; }
    .win-name { font-family:'Fredoka', sans-serif; font-size:24px; font-weight:700; color: var(--brand); margin-bottom: 24px; }
    
    .win-actions { display: flex; gap: 12px; justify-content: center; }
    .btn-add-win { background: var(--brand); color: #fff; padding:16px 32px; border-radius:20px; font-weight:800; font-size:16px; border: none; font-family: inherit; cursor: pointer; transition: 0.2s; box-shadow: 0 8px 20px rgba(123, 78, 42, 0.2); }
    .btn-add-win:active { transform: scale(0.95); }
    .btn-respin { background: var(--bg); color: var(--brand); border: 2px solid var(--brand); padding: 16px 24px; border-radius: 20px; font-weight: 700; cursor: pointer; font-family: inherit; transition: 0.2s; }
    .btn-respin:hover { background: var(--brand-light); }

    .spinner-status { display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .spinning-msg { color: var(--text-sec); font-style: italic; font-weight: 600; font-size: 15px; }
    .btn-start-spin { background: var(--brand); color: #fff; padding:16px 40px; border-radius:20px; font-weight:800; font-size:18px; border: none; font-family: inherit; cursor: pointer; animation: pulse 2s infinite; }

    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-20px); }
      60% { transform: translateY(-10px); }
    }
    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(123, 78, 42, 0.4); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(123, 78, 42, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(123, 78, 42, 0); }
    }
  `]
})
export class MenuComponent implements OnInit, AfterViewInit, OnDestroy {
  tableNum = '1';
  isDarkMode = signal(false);

  private readonly ITEM_WIDTH = 120;
  private readonly WINNING_INDEX = 130;

  @ViewChild('hotContainer') hotContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('spinnerView') spinnerView?: ElementRef<HTMLDivElement>;
  private slideInterval?: any;

  allItems = signal<MenuItem[]>([]);
  activeCat = signal('all');
  searchQ = signal('');
  cartMap = signal<Map<number, { qty: number; note: string }>>(new Map());

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 11) return { text: 'Chào buổi sáng ☀️', sub: 'Chúc bạn một ngày năng lượng!' };
    if (hour < 18) return { text: 'Chào buổi chiều ☀️', sub: 'Chọn thức uống giải nhiệt nhé!' };
    return { text: 'Chào buổi tối 🌙', sub: 'Một ly trà cho tối nhẹ nhàng?' };
  });

  showNote: Record<number, boolean> = {};
  openModal = false;
  ordering = false;
  orderSuccess = false;

  showSpinner = false;
  spinning = false;
  spinFinished = false;
  spinOffset = 0;
  spinnerItems: MenuItem[] = [];
  wonItem: MenuItem | null = null;

  catLabels = CATEGORY_LABELS;
  catKeys = Object.keys(CATEGORY_LABELS);

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
    
    // Load theme preference
    const savedTheme = localStorage.getItem('hana_theme');
    if (savedTheme === 'dark') this.isDarkMode.set(true);
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    localStorage.setItem('hana_theme', this.isDarkMode() ? 'dark' : 'light');
  }

  ngAfterViewInit() { this.startAutoSlide(); }
  ngOnDestroy() { if (this.slideInterval) clearInterval(this.slideInterval); }

  private currentHotIndex = 0;
  startAutoSlide() {
    if (this.slideInterval) clearInterval(this.slideInterval);
    this.slideInterval = setInterval(() => {
      const items = this.hotItems();
      const el = this.hotContainer?.nativeElement;
      if (!el || items.length <= 1) return;
      this.currentHotIndex++;
      if (this.currentHotIndex >= items.length) this.currentHotIndex = 0;
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
    this.spinOffset = 0;
    
    // Tự động quay sau 300ms để người dùng kịp thấy giao diện
    setTimeout(() => this.startSpin(), 300);
  }

  private prepareSpinner() {
    const all = this.allItems();
    this.spinnerItems = [];
    // Tạo danh sách vật phẩm đủ dài để quay mượt
    for (let i = 0; i < 150; i++) {
      this.spinnerItems.push(all[Math.floor(Math.random() * all.length)]);
    }
    // Gán món thắng dựa trên chỉ số cố định dùng trong startSpin
    this.wonItem = this.spinnerItems[this.WINNING_INDEX];
  }

  startSpin() {
    if (this.spinning) return;
    this.spinning = true;
    this.spinFinished = false;

    // Đợi frame tiếp theo để class .spinning được áp dụng giúp kích hoạt transition
    setTimeout(() => {
      const viewWidth = this.spinnerView?.nativeElement.clientWidth || 400;
      
      // Tọa độ điểm giữa của món thắng trên track: (index * width) + (width / 2)
      const targetCenterOnTrack = (this.WINNING_INDEX * this.ITEM_WIDTH) + (this.ITEM_WIDTH / 2);
      
      // Để tâm món thắng trùng với tâm của View (nơi có kim chỉ)
      // Offset = (Nửa chiều rộng View) - (Tọa độ tâm món trên dải quay)
      this.spinOffset = (viewWidth / 2) - targetCenterOnTrack;
    }, 50);
    
    // Kết thúc sau 5s quay + buffer thời gian
    setTimeout(() => { this.spinFinished = true; }, 5300);
  }

  reSpin() {
    this.spinning = false;
    this.spinFinished = false;
    this.spinOffset = 0;
    this.prepareSpinner();
    setTimeout(() => { this.startSpin(); }, 100);
  }

  closeSpinner() { this.showSpinner = false; this.spinning = false; this.spinFinished = false; this.wonItem = null; }

  addWonItem() {
    if (this.wonItem) { this.changeQty(this.wonItem, 1); this.closeSpinner(); }
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
  totalItems() { return [...this.getCart().values()].reduce((s, e) => s + e.qty, 0); }
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
  onOverlayClick(e: Event) { if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.openModal = false; }
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
      next: () => { this.openModal = false; this.orderSuccess = true; this.ordering = false; },
      error: () => { alert('Lỗi kết nối, thử lại nhé!'); this.ordering = false; }
    });
  }
  resetOrder() { this.cartMap.set(new Map()); this.orderSuccess = false; }
}
