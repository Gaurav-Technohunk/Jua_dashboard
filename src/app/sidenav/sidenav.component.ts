import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeleteModalComponent } from '../delete-modal/delete-modal.component';
import { RedeemService } from 'src/services/redeem.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit {

  @Output() navigate = new EventEmitter<void>();

  constructor(
    private dialog: MatDialog,
    private redeemService: RedeemService
  ) {}

  ngOnInit(): void {}

  openDialog() {
    this.dialog.open(DeleteModalComponent, {
      width: '450px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      panelClass: 'logout-dialog',
      autoFocus: false,
      disableClose: false,
    });
  }

  refreshHistoryDetails() {
    this.redeemService.reloadComponent1();
  }

  onNavClick() {
    this.navigate.emit();
  }
}
