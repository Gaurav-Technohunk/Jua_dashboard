import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/services/auth.service';
import { ThemeMode, ThemeService } from 'src/services/theme.service';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  // User role properties
  userRole: string | null = null;
  isSuperAdmin: boolean = false;
  isOrgAdmin: boolean = false;
  username: string | null = null;
  themeMode: ThemeMode = 'light';

  @Output() toggle = new EventEmitter();
  private destroy$ = new Subject<void>();
  
  constructor(
        private authService: AuthService,
        private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Get user role and username
    this.userRole = this.authService.getUserRole();
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.isOrgAdmin = this.authService.isOrgAdmin();
    this.username = this.authService.getUsername();

    this.themeMode = this.themeService.currentTheme;
    this.themeService.themeChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => (this.themeMode = mode));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidenav(){
    this.toggle.emit('');
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  get themeTooltip(): string {
    return this.themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
  
}
