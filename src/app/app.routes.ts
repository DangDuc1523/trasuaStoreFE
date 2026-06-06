import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/menu/menu.component').then(m => m.MenuComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/order-manage/order-manage.component').then(m => m.OrderManageComponent)
      },
      {
        path: 'menu',
        loadComponent: () => import('./features/admin/menu-manage/menu-manage.component').then(m => m.MenuManageComponent)
      },
      { path: '', redirectTo: 'orders', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
