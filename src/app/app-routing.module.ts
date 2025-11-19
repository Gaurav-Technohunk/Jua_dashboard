import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SigninComponent } from './signin/signin.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { ManualRedeemComponent } from './manual-redeem/manual-redeem.component';
import { AuthGuard } from '../services/auth.guard';
import { SettingComponent } from './setting/setting.component';
import { HistoryComponent } from './history/history.component';
import { GameListComponent } from './game-list/game-list.component';
import { PlayerRegistrationComponent } from './player-registration/player-registration.component';
import { PlayerListComponent } from './player-list/player-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    component: SigninComponent,
  },
  {
    path: 'dashboard',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'form', pathMatch: 'full' },
      {
        path: 'form',
        component: DashboardComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'manual-redeem',
        component: ManualRedeemComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'setting',
        component: SettingComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'game-list',
        component: GameListComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'history',
        component: HistoryComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'player-registration',
        component: PlayerRegistrationComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'player-list',
        component: PlayerListComponent,
        canActivate: [AuthGuard],
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
