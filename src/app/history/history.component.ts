import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription, interval } from 'rxjs';
import { RedeemService } from 'src/services/redeem.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {
  historyList: any[] = [];
  subscription: Subscription;
  autoRefreshSubscription?: Subscription;
  displayedColumns: string[] = [
    'gameName',
    'username',
    'date',
    'coin',
    'action',
    'status',
    'message',
  ];

  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  private spinnerTimeout: any;
  
  constructor(
    private redeemService: RedeemService,
    private spinner: NgxSpinnerService
  ) {
    this.subscription = redeemService.reloadComponent1$.subscribe(() => {
      this.fetchHistory();
    });
  }

  ngOnInit(): void {
    this.setupFilterPredicate();
    this.fetchHistory();
    this.startAutoRefresh();
  }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const username = data.redeem?.username || data.coins?.username || '';
      const gameName = data.redeem?.gameName || data.coins?.gameName || '';
      return username.toLowerCase().includes(filter) || gameName.toLowerCase().includes(filter);
    };
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
    // Clear spinner timeout if component is destroyed
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
      this.spinner.hide('mainSpinner');
    }
  }

  private startAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
    this.autoRefreshSubscription = interval(10000).subscribe(() => {
      this.fetchHistory(false);
    });
  }

  fetchHistory(showSpinner: boolean = true) {
    if (showSpinner) {
      // Clear any existing timeout
      if (this.spinnerTimeout) {
        clearTimeout(this.spinnerTimeout);
      }
      
      // Show spinner only if loading takes more than 300ms
      this.spinnerTimeout = setTimeout(() => {
        this.spinner.show('mainSpinner');
      }, 300);
    }
    
    this.redeemService.getHistoryDetails().subscribe({
      next: (res: any) => {
        if (showSpinner) {
          // Clear the timeout and hide spinner
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
        }
        
        this.historyList = (res || []).map((entry: any) => ({
          ...entry,
          displayDate: this.formatToCst(entry?.date),
        }));
        this.historyList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.dataSource = new MatTableDataSource(this.historyList);
        // Re-apply filter predicate after creating new dataSource
        this.setupFilterPredicate();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (err) => {
        if (showSpinner) {
          // Clear the timeout and hide spinner on error
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
        }
      }
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();  
    this.dataSource.filter = filterValue;
    
    // Reset paginator to first page when filtering
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private formatToCst(dateValue: string | Date): string {
    if (!dateValue) {
      return '';
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return String(dateValue);
    }

    return formatDate(date, 'MMM d, y, h:mm:ss a', 'en-US', 'America/Chicago');
  }
}
