import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RedeemService } from 'src/services/redeem.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss'],
})
export class PlayerListComponent implements OnInit, AfterViewInit, OnDestroy {
  playerList: any[] = []; // List of all players
  groupedPlayers: any = {}; // Grouped players by game name
  searchTerm: string = ''; // Holds the search term
  displayedColumns: string[] = ['plUname']; // Columns to display
  dataSource = new MatTableDataSource<any>(); // Create a MatTableDataSource instance

  @ViewChild(MatPaginator) paginator!: MatPaginator; // Reference to paginator
  @ViewChild(MatSort) sort!: MatSort; // Reference to sort
  private spinnerTimeout: any;

  constructor(
    private redeemService: RedeemService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.getPlayers(); // Fetch players on component initialization
  }

  ngAfterViewInit() {
    // Initialize pagination and sorting after the view is initialized
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    // Clear spinner timeout if component is destroyed
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
      this.spinner.hide('mainSpinner');
    }
  }

  // Fetch players from the redeem service
  getPlayers() {
    // Clear any existing timeout
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    
    // Show spinner only if loading takes more than 300ms
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);
    
    this.redeemService.fetchPlayersList().subscribe({
      next: (players: any[]) => {
        // Clear the timeout and hide spinner
        if (this.spinnerTimeout) {
          clearTimeout(this.spinnerTimeout);
          this.spinnerTimeout = null;
        }
        this.spinner.hide('mainSpinner');
        
        this.playerList = players;
        this.filterPlayers(); // Re-apply filtering and grouping after fetching
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

  // Group players by game name
  groupPlayersByGame(players: any[]) {
    const grouped = players.reduce((acc, player) => {
      if (!acc[player.gameName]) {
        acc[player.gameName] = [];
      }
      acc[player.gameName].push(player);
      return acc;
    }, {});
    return grouped;
  }

  // Filter players based on the search term and group them by game
  filterPlayers() {
    let filtered = this.playerList;
    if (this.searchTerm) {
      filtered = this.playerList.filter(
        (player) =>
          player.gameName
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()) ||
          player.plUname.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Group filtered players by game
    this.groupedPlayers = this.groupPlayersByGame(filtered);

    // Update the data source for pagination
    this.dataSource.data = filtered;

    // Refresh the paginator and sorters
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // Helper function to get object keys (for iteration in *ngFor)
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
