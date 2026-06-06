export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  emoji: string;
  category: string;
  isHot: boolean;
  isNew: boolean;
  isHidden: boolean;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  note: string;
}

export interface Order {
  id: number;
  tableNumber: string;
  status: 'new' | 'making' | 'done';
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export interface PlaceOrderDto {
  tableNumber: string;
  items: OrderItem[];
}

export type Category = 'all' | 'trasua' | 'cafe' | 'sinh-to' | 'nuoc-ep' | 'tra';

export const CATEGORY_LABELS: Record<string, string> = {
  trasua: '🧋 Trà sữa',
  cafe: '☕ Cà phê',
  'sinh-to': '🥤 Sinh tố',
  'nuoc-ep': '🍹 Nước ép',
  tra: '🍵 Trà',
  khac: '🍽 Khác',
};
