import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Order } from './order/order';
import { Capture } from './capture/capture';
import { ViewOrder } from './view-order/view-order';
import { CreateOrder } from './create-order/create-order';
import { EditOrder } from './edit-order/edit-order';
import { Settings } from './settings/settings';
import { AllOrders } from './all-orders/all-orders';
import { authGuard } from './auth.guard';
import { ActionsComponent } from './actions/actions';
import { PackageRecordComponent } from './package-record/package-record';
import { DataMaintenanceComponent } from './data-maintenance/data-maintenance';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [authGuard]
  },
  { 
    path: 'order-management', 
    component: Order,
    canActivate: [authGuard]
  },
  { 
    path: 'capture', 
    component: Capture,
    canActivate: [authGuard]
  },
  { 
    path: 'view-order', 
    component: ViewOrder,
    canActivate: [authGuard]
  },
  { 
    path: 'create-order', 
    component: CreateOrder,
    canActivate: [authGuard]
  },
  { 
    path: 'edit-order', 
    component: EditOrder,
    canActivate: [authGuard]
  },
  { 
    path: 'edit-order/:orderNumber', 
    component: EditOrder,
    canActivate: [authGuard]
  },
  { 
    path: 'all-orders', 
    component: AllOrders,
    canActivate: [authGuard]
  },
  { 
    path: 'settings', 
    component: Settings,
    canActivate: [authGuard]
  },
  { 
    path: 'actions', 
    component: ActionsComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'package-record', 
    component: PackageRecordComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'data-maintenance', 
    component: DataMaintenanceComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
