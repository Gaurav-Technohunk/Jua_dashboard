import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { HeaderComponent } from './header/header.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SigninComponent } from './signin/signin.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { ManualRedeemComponent } from './manual-redeem/manual-redeem.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from '../services/auth.interceptor';
import { CustomSnackbarComponent } from './custom-snackbar/custom-snackbar.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DeleteModalComponent } from './delete-modal/delete-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { SettingComponent } from './setting/setting.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MatSelectModule } from '@angular/material/select';
import { HistoryComponent } from './history/history.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { GameListComponent } from './game-list/game-list.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GameEditModalComponent } from './game-edit-modal/game-edit-modal.component';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PlayerRegistrationComponent } from './player-registration/player-registration.component';
import { PlayerListComponent } from './player-list/player-list.component';

const modules = [
  MatSidenavModule,
  MatListModule,
  MatIconModule,
  MatInputModule,
  NgbModule,
  MatFormFieldModule,
  MatButtonModule,
  MatSnackBarModule,
  MatDialogModule,
  MatSlideToggleModule,
  MatSelectModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatTooltipModule,
  MatToolbarModule,
  MatAutocompleteModule
];

@NgModule({
  declarations: [
    AppComponent,
    SidenavComponent,
    HeaderComponent,
    DashboardComponent,
    SigninComponent,
    MainLayoutComponent,
    ManualRedeemComponent,
    CustomSnackbarComponent,
    DeleteModalComponent,
    SettingComponent,
    HistoryComponent,
    GameListComponent,
    GameEditModalComponent,
    PlayerRegistrationComponent,
    PlayerListComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgbModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' }),
    ...modules,
  ],

  exports: [...modules],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
