import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RedeemService } from '../../services/redeem.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { creditLoad } from '../../services/interface';
import { SnackbarService } from 'src/services/snackbar.service';
import { AuthService } from 'src/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  myForm: any = FormGroup;
  gameList: string[] = [];
  playerList: any = [];
  filterPlayers: any = [];
  PlayerName: any = [];
  searchText: string =''
  private spinnerTimeout: any;

  labelName = [
    {
      name: 'Amount in Dollars',
      field: 'amount',
      placeholder: '$0.00',
      type: 'number',
    },
  ];
  organizationsList: any[] = [];
  currentUserEmail: string | null = null;
  currentUserOrgId: string | null = null;
  currentUserOrgName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    private spinner: NgxSpinnerService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.myForm = this.fb.group({
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
    
    // If email not in token, try to get username and fetch admin user details
    if (!this.currentUserEmail || !this.currentUserOrgId) {
      const username = this.authService.getUsername();
      if (username) {
        console.warn('Email or orgId not found in token. Username:', username);
        // Fetch admin user details to get email and orgId if not in token
        this.fetchAdminUserEmail(username);
      } else {
        // If we can't get username, try fetching games directly
        this.initializeGames();
      }
    } else {
      // If we have orgId, fetch organizations and games
      this.fetchOrganizations();
      this.initializeGames();
    }
  }
  
  initializeGames(): void {
    // For admin users, always fetch from game list directly
    if (this.authService.isOrgAdmin() || this.authService.isSuperAdmin()) {
      // If orgId is available, fetch immediately
      if (this.currentUserOrgId || this.currentUserOrgName) {
        this.fetchGamesFromGameList();
      } else {
        // Wait a bit for orgId to load, then fetch
        setTimeout(() => {
          this.fetchGamesFromGameList();
        }, 800);
      }
    } else {
      // For other users, use regular endpoint
      this.getGameName();
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
            // Now fetch organizations and games
            this.fetchOrganizations();
          }
        }
        
        // Initialize games after user info is loaded
        this.initializeGames();
      },
      error: (error) => {
        console.error('Error fetching admin user email:', error);
        // Still try to fetch games even if user info fetch fails
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

  getGameName() {
    // For admin users (both Org Admin and Super Admin), always fetch from game list
    if (this.authService.isOrgAdmin() || this.authService.isSuperAdmin()) {
      this.fetchGamesFromGameList();
      return;
    }
    
    // For other users, use the regular endpoint
    this.redeemService.getGameName().subscribe({
      next: (response: any) => {
        console.log('Game names response:', response);
        
        // Handle different response structures
        if (Array.isArray(response)) {
          this.gameList = response;
        } else if (response && Array.isArray(response.data)) {
          this.gameList = response.data;
        } else if (response && Array.isArray(response.games)) {
          this.gameList = response.games;
        } else if (response && typeof response === 'object') {
          // Try to extract game names from object
          const gameNames = Object.values(response).filter((item: any) => 
            typeof item === 'string' || (item && typeof item === 'object' && item.gameName)
          );
          if (gameNames.length > 0) {
            this.gameList = gameNames.map((item: any) => 
              typeof item === 'string' ? item : item.gameName
            );
          } else {
            this.gameList = [];
            console.warn('Could not parse game names from response:', response);
          }
        } else {
          this.gameList = [];
          console.warn('Unexpected response format:', response);
        }
        
        // If still no games, try game list as fallback
        if (this.gameList.length === 0) {
          this.fetchGamesFromGameList();
        }
      },
      error: (error) => {
        console.error('Error fetching game names:', error);
        // Always fallback to game list on error
        this.fetchGamesFromGameList();
      }
    });
  }

  fetchGamesFromGameList(): void {
    // Fetch games from game list filtered by organization
    this.redeemService.fetchGameList().subscribe({
      next: (response: any) => {
        console.log('Game list response:', response);
        let games: any[] = [];
        
        if (Array.isArray(response)) {
          games = response;
        } else if (response && Array.isArray(response.data)) {
          games = response.data;
        }
        
        console.log('Total games fetched:', games.length);
        
        // Filter only active games first
        games = games.filter((game: any) => game.status !== false);
        console.log('Active games:', games.length);
        
        // Store original games before filtering (for fallback)
        const originalGames = [...games];
        
        // Filter games by organization if org admin
        if (this.authService.isOrgAdmin()) {
          console.log('User is Org Admin. orgId:', this.currentUserOrgId, 'orgName:', this.currentUserOrgName);
          console.log('All games before org filter:', games.map(g => ({ gameName: g.gameName, orgId: g.orgId, orgName: g.orgName })));
          
          // Try to filter by organization - check both orgId and orgName
          if (this.currentUserOrgId || this.currentUserOrgName) {
            const filteredGames = games.filter((game: any) => {
              // Match by orgId if available
              const matchesOrgId = this.currentUserOrgId && (
                game.orgId === this.currentUserOrgId || 
                game.organizationId === this.currentUserOrgId
              );
              
              // Match by orgName if available (case-insensitive, flexible matching)
              let matchesOrgName = false;
              if (this.currentUserOrgName && game.orgName) {
                const userOrgName = this.currentUserOrgName.trim().toLowerCase();
                const gameOrgName = game.orgName.trim().toLowerCase();
                matchesOrgName = userOrgName === gameOrgName || 
                                 userOrgName.includes(gameOrgName) || 
                                 gameOrgName.includes(userOrgName);
              }
              
              return matchesOrgId || matchesOrgName;
            });
            
            console.log('Games after org filter:', filteredGames.length);
            console.log('Filtered games:', filteredGames.map(g => ({ gameName: g.gameName, orgId: g.orgId, orgName: g.orgName })));
            
            // If filtering resulted in empty list, show all active games as fallback
            if (filteredGames.length === 0) {
              console.warn('Organization filter resulted in 0 games. Showing all active games as fallback.');
              games = originalGames; // Show all active games
            } else {
              games = filteredGames;
            }
          } else {
            // If no org info available yet, show all active games
            console.log('No org info available yet, showing all active games');
          }
        }
        // Super admin sees all active games (no filtering needed)
        
        // Extract unique game names and sort them (trim + case-insensitive)
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
        const uniqueGameNames = Array.from(uniqueGameNameMap.values()).sort((a, b) =>
          a.localeCompare(b)
        );
        
        // Clear and set gameList to ensure Angular detects the change
        this.gameList = [];
        this.gameList = uniqueGameNames.sort();
        
        console.log('Final game list for dropdown:', this.gameList);
        console.log('Number of unique game names:', this.gameList.length);
        console.log('Game names array:', JSON.stringify(this.gameList));
        
        // If still no games found, show helpful message
        if (this.gameList.length === 0) {
          console.warn('No games found after all processing');
          
          // If org admin and we have org info but no games, show specific message
          if (this.authService.isOrgAdmin() && (this.currentUserOrgId || this.currentUserOrgName)) {
            this.snackbarService.openSnackbar(
              `No games available for organization: ${this.currentUserOrgName || 'your organization'}`,
              'failed'
            );
          } else if (this.authService.isOrgAdmin() && !this.currentUserOrgId && !this.currentUserOrgName) {
            // If org admin but no org info yet, wait and retry
            setTimeout(() => {
              if (this.currentUserOrgId || this.currentUserOrgName) {
                this.fetchGamesFromGameList();
              }
            }, 1500);
          } else {
            this.snackbarService.openSnackbar(
              'No games available.',
              'failed'
            );
          }
        }
      },
      error: (error) => {
        console.error('Error fetching games from game list:', error);
        this.gameList = [];
        
        // Show detailed error message
        let errorMessage = 'Failed to load games.';
        if (error.status === 401) {
          errorMessage = 'You are not authorized to view games. Please log in again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to view games.';
        }
        
        this.snackbarService.openSnackbar(errorMessage, 'failed');
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
    this.myForm.reset();
    Object.keys(this.myForm.controls).forEach((key) => {
      this.myForm.get(key)?.setErrors(null);
      this.myForm.get(key)?.markAsPristine();
      this.myForm.get(key)?.markAsUntouched();
    });
    this.PlayerName = [];
    this.filterPlayers = [];
    this.searchText = '';
  }

  onSubmit() {
    // Mark all fields as touched to show validation errors
    this.myForm.markAllAsTouched();
    
    // Check if form is valid
    if (!this.myForm.valid) {
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
    let formData = this.myForm.value;
    let userData: creditLoad = {
      gameName: formData.selectGameName.trim(),
      username: formData.userName.trim(),
      coin: formData.amount.trim(),
    };
    
    // Add essential fields from current logged-in user
    if (this.currentUserEmail) {
      userData.adminEmail = this.currentUserEmail;
    }
    
    if (this.currentUserOrgId) {
      userData.orgId = this.currentUserOrgId;
    }
    
    if (this.currentUserOrgName) {
      userData.orgName = this.currentUserOrgName;
    }
    
    // Debug: Log the payload being sent
    console.log('Recharge payload:', userData);
    
    // Debounced spinner to avoid flicker on very fast responses
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);

    this.redeemService
      .manualCreditLoad(userData)
      .subscribe({
        next: (result: any) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
          if (result) {
            if (result.status == 'failed') {
              this.snackbarService.openSnackbar(
                'Add credit failed. Please try again',
                'failed'
              );
            } else {
              this.snackbarService.openSnackbar(
                'You have been successfully add credit Load',
                'success'
              );
              this.redeemService.reloadComponent1();
            }
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
            'Add credit failed. Please try again',
            'failed'
          );
        },
      });
  }
}
