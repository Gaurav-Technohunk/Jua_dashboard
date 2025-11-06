import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RedeemService } from '../../services/redeem.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { creditLoad } from '../../services/interface';
import { SnackbarService } from 'src/services/snackbar.service';

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
  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.myForm = this.fb.group({
      userName: ['', Validators.required],
      amount: ['', Validators.required],
      selectGameName: ['', Validators.required],
    });

    this.getGameName();
  }

  getGameName() {
    this.redeemService.getGameName().subscribe((response: any) => {
      this.gameList = response;
    });
  }

  selectedGameName(gameName: string) {
    this.redeemService.searchPlayers(gameName).subscribe((response: any) => {
      this.playerList = response;
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
