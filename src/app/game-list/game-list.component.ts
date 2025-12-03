import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { RedeemService } from 'src/services/redeem.service';
import { GameEditModalComponent } from '../game-edit-modal/game-edit-modal.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-game-list',
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.scss'],
})
export class GameListComponent implements OnInit, AfterViewInit, OnDestroy {
  gameList: any[] = [];
  subscription: Subscription;
  private sortSubscription?: Subscription;
  displayedColumns: string[] = [
    'gameName',
    'orgName',
    'userName',
    'adminEmail',
    'gameUrl',
    'suffix',
    'prefix',
    'status',
    'action',
  ];

  dataSource = new MatTableDataSource();
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  private spinnerTimeout: any;
  mobileGames: any[] = [];
  
  constructor(
    private redeemService: RedeemService,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private snackbarService: SnackbarService
  ) {
    this.subscription = redeemService.reloadComponent1$.subscribe(() => {
      this.fetchGameList();
    });
  }

  ngOnInit(): void {
    this.fetchGameList();
  }

  ngAfterViewInit(): void {
    this.sortSubscription = this.sort.sortChange.subscribe(() => {
      this.paginator.firstPage();
      this.updateMobileCards();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.sortSubscription) {
      this.sortSubscription.unsubscribe();
    }
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
        this.updateMobileCards();
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

  onTableInteraction() {
    this.updateMobileCards();
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

  confirmDeleteGame(gameId: string, gameName: string): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete the game "${gameName}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    // Show spinner
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);

    this.redeemService.deleteGame(gameId).subscribe({
      next: () => {
        if (this.spinnerTimeout) {
          clearTimeout(this.spinnerTimeout);
          this.spinnerTimeout = null;
        }
        this.spinner.hide('mainSpinner');
        this.snackbarService.openSnackbar(
          'Game deleted successfully!',
          'success'
        );
        this.fetchGameList(); // Refresh the list
      },
      error: (error: HttpErrorResponse) => {
        if (this.spinnerTimeout) {
          clearTimeout(this.spinnerTimeout);
          this.spinnerTimeout = null;
        }
        this.spinner.hide('mainSpinner');
        
        let errorMessage = '';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        if (error.status === 404) {
          const message = errorMessage || 'Game not found. Please refresh and try again.';
          this.snackbarService.openSnackbar(message, 'failed');
        } else if (error.status === 401) {
          this.snackbarService.openSnackbar(
            'You are not authorized. Please log in again.',
            'failed'
          );
        } else if (error.status === 403) {
          this.snackbarService.openSnackbar(
            'You do not have permission to delete games.',
            'failed'
          );
        } else {
          const message = errorMessage || 'Failed to delete game. Please try again.';
          this.snackbarService.openSnackbar(message, 'failed');
        }
      },
    });
  }

  private updateMobileCards() {
    if (!this.dataSource) {
      this.mobileGames = [];
      return;
    }

    const data = (this.dataSource.filteredData ?? this.dataSource.data) || [];

    if (!this.paginator) {
      this.mobileGames = data;
      return;
    }

    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    this.mobileGames = data.slice(startIndex, startIndex + this.paginator.pageSize);
  }

  trackGameById(index: number, item: any) {
    return item?.id ?? item?.gameName ?? index;
  }
}
