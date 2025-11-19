import { Component, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, Event } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit{
  title = 'AngularJuwaProject';
  spinnerName = 'mainSpinner';

  constructor(
    private spinner: NgxSpinnerService,
    private router: Router,
    private authService: AuthService
  ) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.spinner.show(this.spinnerName);
      } else if (event instanceof NavigationEnd) {
        setTimeout(() => {
          this.spinner.hide(this.spinnerName);
        }, 500);
      }
    });
  }

  ngOnInit(): void {
    // Show spinner on initial load
    this.spinner.show(this.spinnerName);
    
    // Hide spinner after a short delay to ensure page is loaded
    setTimeout(() => {
      this.spinner.hide(this.spinnerName);
    }, 800);
    
    this.authService.autoLogout();
  }
}
