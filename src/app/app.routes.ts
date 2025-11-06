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
import { userAuthGuard, userRoleGuard } from './user-auth.guard';
import { ActionsComponent } from './actions/actions';
import { PackageRecordComponent } from './package-record/package-record';
import { DataMaintenanceComponent } from './data-maintenance/data-maintenance';
import { LabelPreviewPage } from './label-preview/label-preview-page';
import { UserLoginComponent } from './user-login/user-login';
import { AdminComponent } from './admin/admin';

export const routes: Routes = [
  { path: '', redirectTo: '/user-login', pathMatch: 'full' },
  { path: 'user-login', component: UserLoginComponent }, // Merged login (Brain2 + Local)
  { 
    path: 'login', 
    redirectTo: '/user-login', // Redirect old Brain2 login to merged login
    pathMatch: 'full'
  },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [userAuthGuard, authGuard] // All authenticated users
  },
  { 
    path: 'order-management', 
    component: Order,
    canActivate: [userRoleGuard('admin'), authGuard] // Admin only
  },
  { 
    path: 'capture', 
    component: Capture,
    canActivate: [userRoleGuard('admin'), authGuard] // Admin only
  },
  { 
    path: 'view-order', 
    component: ViewOrder,
    canActivate: [userAuthGuard, authGuard] // All authenticated users
  },
  { 
    path: 'create-order', 
    component: CreateOrder,
    canActivate: [userRoleGuard('admin'), authGuard] // Admin only
  },
  { 
    path: 'edit-order', 
    component: EditOrder,
    canActivate: [userRoleGuard('admin'), authGuard] // Admin only
  },
  { 
    path: 'edit-order/:orderNumber', 
    component: EditOrder,
    canActivate: [userRoleGuard('admin'), authGuard] // Admin only
  },
  { 
    path: 'all-orders', 
    component: AllOrders,
    canActivate: [userAuthGuard, authGuard] // All authenticated users (viewer can see)
  },
  { 
    path: 'settings', 
    component: Settings,
    canActivate: [userRoleGuard('admin'), authGuard] // Admin only
  },
  { 
    path: 'actions', 
    component: ActionsComponent,
    canActivate: [userRoleGuard('operator'), authGuard] // Operator or Admin only
  },
  { 
    path: 'package-record', 
    component: PackageRecordComponent,
    canActivate: [userAuthGuard, authGuard]
  },
  { 
    path: 'data-maintenance', 
    component: DataMaintenanceComponent,
    canActivate: [userRoleGuard('admin'), authGuard] // Admin only
  },
  { 
    path: 'label-preview', 
    component: LabelPreviewPage,
    canActivate: [userAuthGuard, authGuard]
  },
  { 
    path: 'admin', 
    component: AdminComponent,
    canActivate: [userRoleGuard('admin')] // Admin only - no Brain2 auth needed for this page
  },
  { path: '**', redirectTo: '/dashboard' }
];
