import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { redeemForm } from 'src/services/interface';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';
import { AuthService } from 'src/services/auth.service';

@Component({
  selector: 'app-manual-redeem',
  templateUrl: './manual-redeem.component.html',
  styleUrls: ['./manual-redeem.component.scss'],
})
export class ManualRedeemComponent implements OnInit {
  manualRedeemForm: any = FormGroup;
  gameList: string[] = [];
  playerList: any = [];
  filterPlayers: any = [];
  searchText: string = '';
  PlayerName: any = [];
  private spinnerTimeout: any;
  
  // Organization and user info
  organizationsList: any[] = [];
  currentUserEmail: string | null = null;
  currentUserOrgId: string | null = null;
  currentUserOrgName: string | null = null;

  labelName = [
    {
      name: 'Amount in Dollars',
      field: 'amount',
      placeholder: '$0.00',
      type: 'number',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    private spinner: NgxSpinnerService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.manualRedeemForm = this.fb.group({
      userName: ['', Validators.required],
      amount: ['', Validators.required],
      selectGameName: ['', Validators.required],
    });
    
    // Load user info first, then fetch games
    this.loadCurrentUserInfo();
  }

  loadCurrentUserInfo(): void {
    // Get admin email from JWT token
    this.currentUserEmail = this.authService.getUserEmail();
    
    // Get orgId from JWT token
    this.currentUserOrgId = this.authService.getOrgId();
    
    // If email or orgId not in token, try to get username and fetch admin user details
    if (!this.currentUserEmail || !this.currentUserOrgId) {
      const username = this.authService.getUsername();
      if (username) {
        console.warn('Email or orgId not found in token. Username:', username);
        // Fetch admin user details to get email and orgId if not in token
        this.fetchAdminUserEmail(username);
      } else {
        this.initializeGames();
      }
    } else {
      // If we have orgId, fetch organizations
      this.fetchOrganizations();
      this.initializeGames();
    }
  }

  fetchAdminUserEmail(username: string): void {
    // Fetch admin user details to get email and orgId if not in token
    this.redeemService.getAdminUsers().subscribe({
      next: (response: any) => {
        let adminUsers: any[] = [];
        
        if (Array.isArray(response)) {
          adminUsers = response;
        } else if (response && Array.isArray(response.data)) {
          adminUsers = response.data;
        }
        
        const currentUser = adminUsers.find((admin: any) => admin.username === username);
        if (currentUser) {
          if (currentUser.email && !this.currentUserEmail) {
            this.currentUserEmail = currentUser.email;
          }
          if ((currentUser.orgId || currentUser.organizationId) && !this.currentUserOrgId) {
            this.currentUserOrgId = currentUser.orgId || currentUser.organizationId;
            // Now fetch organizations
            this.fetchOrganizations();
          }
        }
        this.initializeGames();
      },
      error: (error) => {
        console.error('Error fetching admin user email:', error);
        this.initializeGames();
      }
    });
  }

  fetchOrganizations(): void {
    // Only fetch if we have orgId to get orgName
    if (this.currentUserOrgId) {
      this.redeemService.getOrganizations().subscribe({
        next: (response: any) => {
          let organizations: any[] = [];
          
          if (Array.isArray(response)) {
            organizations = response;
          } else if (response && Array.isArray(response.data)) {
            organizations = response.data;
          } else if (response && Array.isArray(response.organizations)) {
            organizations = response.organizations;
          }
          
          // Find the current user's organization
          const userOrg = organizations.find((org: any) => 
            org.id === this.currentUserOrgId
          );
          
          if (userOrg) {
            this.currentUserOrgName = userOrg.name || null;
          }
        },
        error: (error) => {
          console.error('Error fetching organizations:', error);
        }
      });
    }
  }

  initializeGames(): void {
    if (this.authService.isOrgAdmin() || this.authService.isSuperAdmin()) {
      if (this.currentUserOrgId || this.currentUserOrgName) {
        this.fetchGamesFromGameList();
      } else {
        setTimeout(() => {
          this.fetchGamesFromGameList();
        }, 800);
      }
    } else {
      this.getGameName();
    }
  }

  getGameName() {
    if (this.authService.isOrgAdmin() || this.authService.isSuperAdmin()) {
      this.fetchGamesFromGameList();
      return;
    }

    this.redeemService.getGameName().subscribe({
      next: (response: any) => {
        let games: any[] = [];

        if (Array.isArray(response)) {
          games = response;
        } else if (response && Array.isArray(response.data)) {
          games = response.data;
        } else if (response && Array.isArray(response.games)) {
          games = response.games;
        } else if (response && typeof response === 'object') {
          games = Object.values(response);
        }

        const uniqueGameNameMap = new Map<string, string>();
        games.forEach((item: any) => {
          const rawName =
            typeof item === 'string'
              ? item
              : item && typeof item === 'object'
              ? item.gameName
              : null;

          if (!rawName) {
            return;
          }

          const trimmedName = String(rawName).trim();
          if (!trimmedName) {
            return;
          }

          const normalizedName = trimmedName.toLowerCase();
          if (!uniqueGameNameMap.has(normalizedName)) {
            uniqueGameNameMap.set(normalizedName, trimmedName);
          }
        });

        this.gameList = Array.from(uniqueGameNameMap.values()).sort((a, b) =>
          a.localeCompare(b)
        );

        if (this.gameList.length === 0) {
          this.fetchGamesFromGameList();
        }
      },
      error: () => {
        this.fetchGamesFromGameList();
      }
    });
  }

  fetchGamesFromGameList(): void {
    this.redeemService.fetchGameList().subscribe({
      next: (response: any) => {
        let games: any[] = [];

        if (Array.isArray(response)) {
          games = response;
        } else if (response && Array.isArray(response.data)) {
          games = response.data;
        }

        games = games.filter((game: any) => game.status !== false);
        const originalGames = [...games];

        if (this.authService.isOrgAdmin()) {
          if (this.currentUserOrgId || this.currentUserOrgName) {
            const filteredGames = games.filter((game: any) => {
              const matchesOrgId = this.currentUserOrgId && (
                game.orgId === this.currentUserOrgId ||
                game.organizationId === this.currentUserOrgId
              );

              let matchesOrgName = false;
              if (this.currentUserOrgName && game.orgName) {
                const userOrgName = this.currentUserOrgName.trim().toLowerCase();
                const gameOrgName = game.orgName.trim().toLowerCase();
                matchesOrgName =
                  userOrgName === gameOrgName ||
                  userOrgName.includes(gameOrgName) ||
                  gameOrgName.includes(userOrgName);
              }

              return matchesOrgId || matchesOrgName;
            });

            games = filteredGames.length === 0 ? originalGames : filteredGames;
          }
        }

        const uniqueGameNameMap = new Map<string, string>();
        games.forEach((game: any) => {
          if (!game || !game.gameName) {
            return;
          }
          const trimmedName = String(game.gameName).trim();
          if (!trimmedName) {
            return;
          }
          const normalizedName = trimmedName.toLowerCase();
          if (!uniqueGameNameMap.has(normalizedName)) {
            uniqueGameNameMap.set(normalizedName, trimmedName);
          }
        });

        this.gameList = Array.from(uniqueGameNameMap.values()).sort((a, b) =>
          a.localeCompare(b)
        );
      },
      error: (error) => {
        console.error('Error fetching games from game list:', error);
        this.gameList = [];
        this.snackbarService.openSnackbar('Failed to load games.', 'failed');
      }
    });
  }
  selectedGameName(gameName: string) {
    this.redeemService.searchPlayers(gameName).subscribe((response: any) => {
      let players: any[] = Array.isArray(response)
        ? response
        : response && Array.isArray(response.data)
        ? response.data
        : [];

      // For OrgAdmin, show only players they created (by username)
      if (this.authService.isOrgAdmin()) {
        const currentUsername = this.authService.getUsername();
        if (currentUsername) {
          players = players.filter(
            (player: any) =>
              (player.createdBy && player.createdBy === currentUsername) ||
              (player.createdByUsername &&
                player.createdByUsername === currentUsername) ||
              (player.created_by && player.created_by === currentUsername)
          );
        }
      }

      this.playerList = players;
      this.filterPlayers = [];
    });
  }

  filteredUsers(searchItem: any) {
    this.searchText = searchItem;
    this.filterPlayers = this.playerList.filter((player: any) =>
      player.plUname.toLowerCase().includes(this.searchText.toLowerCase())
    );
    this.PlayerName = this.filterPlayers.filter((player: any) =>
        player.plUname.toLowerCase() === this.searchText.toLowerCase()
    );
  }

  onOptionSelected(event: any) {
    this.filteredUsers(event.option.value);
  }

  resetForm() {
    this.manualRedeemForm.reset();
    Object.keys(this.manualRedeemForm.controls).forEach((key) => {
      this.manualRedeemForm.get(key)?.setErrors(null);
      this.manualRedeemForm.get(key)?.markAsPristine();
      this.manualRedeemForm.get(key)?.markAsUntouched();
    });
    this.PlayerName = [];
    this.filterPlayers = [];
    this.searchText = '';
  }

  onSubmit() {
    // Mark all fields as touched to show validation errors
    this.manualRedeemForm.markAllAsTouched();
    
    // Check if form is valid
    if (!this.manualRedeemForm.valid) {
      this.snackbarService.openSnackbar(
        'Please fill in all required fields',
        'failed'
      );
      return;
    }
    
    // Check if player name is selected
    if (this.PlayerName.length === 0) {
      this.snackbarService.openSnackbar(
        'Please select a valid customer username',
        'failed'
      );
      return;
    }
    
    // Submit form
    let formData = this.manualRedeemForm.value;
    const data: redeemForm = {
      gameName: formData.selectGameName.trim(),
      username: formData.userName.trim(),
      amount: formData.amount.trim(),
    };
    
    // Add essential fields from current logged-in user
    if (this.currentUserEmail) {
      data.adminEmail = this.currentUserEmail;
    }
    
    if (this.currentUserOrgId) {
      data.orgId = this.currentUserOrgId;
    }
    
    if (this.currentUserOrgName) {
      data.orgName = this.currentUserOrgName;
    }
    
    // Debug: Log the payload being sent
    console.log('Redeem payload:', data);
    
    // Debounced spinner to avoid flicker on very fast responses
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);

    this.redeemService
      .manualRedeem(data)
      .subscribe({
        next: (response) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
          if (response) {
            this.snackbarService.openSnackbar(
              'You have been successfully Redeem',
              'success'
            );
            this.redeemService.reloadComponent1();
            this.resetForm();
          }
        },
        error: (err) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
          this.snackbarService.openSnackbar(
            'Redeem failed. Please try again',
            'failed'
          );
        },
      });
  }
}
