import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RedeemService } from 'src/services/redeem.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { SnackbarService } from 'src/services/snackbar.service';
import { PlayerEditModalComponent } from '../player-edit-modal/player-edit-modal.component';

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
  isSuperAdmin = false;
  isOrgAdmin = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator; // Reference to paginator
  @ViewChild(MatSort) sort!: MatSort; // Reference to sort
  private spinnerTimeout: any;

  constructor(
    private redeemService: RedeemService,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    // Determine if current user is SUPER_ADMIN to adjust columns/UI
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.isOrgAdmin = this.authService.isOrgAdmin();
    if (this.isSuperAdmin && !this.displayedColumns.includes('createdBy')) {
      this.displayedColumns = [...this.displayedColumns, 'createdBy'];
    }
    if (this.isOrgAdmin && !this.displayedColumns.includes('actions')) {
      this.displayedColumns = [...this.displayedColumns, 'actions'];
    }

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

    const isSuperAdmin = this.authService.isSuperAdmin();

    const request$ = isSuperAdmin
      ? this.redeemService.fetchPlayersList()         // SUPER_ADMIN: see all players
      : this.redeemService.fetchPlayersCreatedByMe(); // ORG_ADMIN: only their created players

    request$.subscribe({
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

  // Resolve "created by" username from possible backend fields
  getCreatedBy(player: any): string {
    if (!player) {
      return '-';
    }
    return (
      player.createdBy ||
      player.createdByUsername ||
      player.createdByUser ||
      player.createdByOrgAdmin ||
      player.created_by ||
      '-'
    );
  }

  // Resolve player id from any id-like field
  private resolvePlayerId(player: any): string | null {
    if (!player) {
      return null;
    }

    const directId =
      player.id ||
      player.playerId ||
      player._id ||
      player.plId ||
      player.player_id;

    if (directId) {
      return String(directId);
    }

    const idKey = Object.keys(player).find((key) =>
      key.toLowerCase().includes('id')
    );

    return idKey ? String(player[idKey]) : null;
  }

  // Helper function to get object keys (for iteration in *ngFor)
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  trackPlayerBy(index: number, player: any) {
    return player?.plUname ?? index;
  }

  openEditPlayerModal(_playerId: string, player: any): void {
    if (!this.isOrgAdmin) {
      return;
    }

    const playerId = this.resolvePlayerId(player);

    const dialogRef = this.dialog.open(PlayerEditModalComponent, {
      width: '450px',
      maxWidth: '90vw',
      data: { player, playerId },
      autoFocus: false,
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((updated: boolean) => {
      if (updated) {
        this.getPlayers();
      }
    });
  }

  confirmDeletePlayer(_playerId: string, playerName: string, player?: any): void {
    if (!this.isOrgAdmin) {
      return;
    }

    const playerId = player ? this.resolvePlayerId(player) : _playerId;

    if (!playerId) {
      this.snackbarService.openSnackbar(
        'Player identifier is missing. Cannot delete player.',
        'failed'
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete player "${playerName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.redeemService.deletePlayer(playerId).subscribe({
      next: () => {
        this.snackbarService.openSnackbar(
          'Player deleted successfully!',
          'success'
        );
        this.getPlayers();
      },
      error: () => {
        this.snackbarService.openSnackbar(
          'Failed to delete player. Please try again.',
          'failed'
        );
      },
    });
  }
}
