import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {

  opened = true;
  isMobile = false;
  constructor() {}

  ngOnInit(): void {
    this.checkScreenSize();
  }

  toggleSidenav() {
    this.opened = !this.opened;
  }

  @HostListener('window:resize', ['$event'])
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    this.opened = !this.isMobile;
  }
}
