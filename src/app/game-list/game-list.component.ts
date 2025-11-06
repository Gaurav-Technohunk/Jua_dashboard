import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { RedeemService } from 'src/services/redeem.service';
import { GameEditModalComponent } from '../game-edit-modal/game-edit-modal.component';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-game-list',
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.scss'],
})
export class GameListComponent implements OnInit {
  gameList: any[] = [];
  subscription: Subscription;
  displayedColumns: string[] = [
    'gameName',
    'userName',
    'gameUrl',
    'suffix',
    'prefix',
    'password',
    // 'status',
    'action',
  ];

  dataSource = new MatTableDataSource();
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  private spinnerTimeout: any;
  
  constructor(
    private redeemService: RedeemService,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService
  ) {
    this.subscription = redeemService.reloadComponent1$.subscribe(() => {
      this.fetchGameList();
    });
  }

  ngOnInit(): void {
    this.fetchGameList();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    // Clear spinner timeout if component is destroyed
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
      this.spinner.hide('mainSpinner');
    }
  }

  fetchGameList() {
    // Clear any existing timeout
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    
    // Show spinner only if loading takes more than 300ms
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);
    
    this.redeemService.fetchGameList().subscribe({
      next: (res: any) => {
        // Clear the timeout and hide spinner
        if (this.spinnerTimeout) {
          clearTimeout(this.spinnerTimeout);
          this.spinnerTimeout = null;
        }
        this.spinner.hide('mainSpinner');
        
        this.gameList = res;
        this.dataSource = new MatTableDataSource(this.gameList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (err) => {
        // Clear the timeout and hide spinner on error
        if (this.spinnerTimeout) {
          clearTimeout(this.spinnerTimeout);
          this.spinnerTimeout = null;
        }
        this.spinner.hide('mainSpinner');
      }
    });
  }

  openEditModal(gameId: string) {
    this.dialog.open(GameEditModalComponent, {
      data: { gameId: gameId },
      width: '650px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      panelClass: 'edit-game-dialog',
      autoFocus: false,
      disableClose: false,
    });
  }
}
