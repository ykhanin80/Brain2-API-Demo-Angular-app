import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Capture } from './capture/capture';
import { ViewOrder } from './view-order/view-order';
import { CreateOrder } from './create-order/create-order';
import { EditOrder } from './edit-order/edit-order';
import { Settings } from './settings/settings';
import { AllOrders } from './all-orders/all-orders';
import { authGuard } from './auth.guard';
import { userAuthGuard, userPermissionGuard } from './user-auth.guard';
import { ActionsComponent } from './actions/actions';
import { PackageRecordComponent } from './package-record/package-record';
import { DataMaintenanceComponent } from './data-maintenance/data-maintenance';
import { LabelPreviewPage } from './label-preview/label-preview-page';
import { UserLoginComponent } from './user-login/user-login';

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
    canActivate: [userAuthGuard, authGuard]
  },
  { 
    path: 'capture', 
    component: Capture,
    canActivate: [userPermissionGuard('capture'), userAuthGuard, authGuard]
  },
  { 
    path: 'view-order', 
    component: ViewOrder,
    canActivate: [userAuthGuard, authGuard] // All authenticated users
  },
  { 
    path: 'create-order', 
    component: CreateOrder,
    canActivate: [userPermissionGuard('create-order'), userAuthGuard, authGuard]
  },
  { 
    path: 'edit-order', 
    component: EditOrder,
    canActivate: [userAuthGuard, authGuard]
  },
  { 
    path: 'edit-order/:orderNumber', 
    component: EditOrder,
    canActivate: [userAuthGuard, authGuard]
  },
  { 
    path: 'all-orders', 
    component: AllOrders,
    canActivate: [userPermissionGuard('all-orders'), userAuthGuard, authGuard]
  },
  { 
    path: 'settings', 
    component: Settings,
    canActivate: [userPermissionGuard('settings'), userAuthGuard, authGuard]
  },
  { 
    path: 'actions', 
    component: ActionsComponent,
    canActivate: [userPermissionGuard('actions'), userAuthGuard, authGuard]
  },
  { 
    path: 'package-record', 
    component: PackageRecordComponent,
    canActivate: [userPermissionGuard('package-record'), userAuthGuard, authGuard]
  },
  { 
    path: 'data-maintenance', 
    component: DataMaintenanceComponent,
    canActivate: [userPermissionGuard('data-maintenance'), userAuthGuard, authGuard]
  },
  { 
    path: 'label-preview', 
    component: LabelPreviewPage,
    canActivate: [userPermissionGuard('label-preview'), userAuthGuard, authGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
