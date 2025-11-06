import { Component, Inject} from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-custom-snackbar',
  templateUrl: './custom-snackbar.component.html',
  styleUrls: ['./custom-snackbar.component.scss']
})
export class CustomSnackbarComponent  {

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data:any,
  private snackBar: MatSnackBarRef<CustomSnackbarComponent>){}
  
  closeSnackbar(){
    this.snackBar.dismiss()
  }
  
  getSnackbarClass(): string {
    if (this.data?.type) {
      return this.data.type.toLowerCase();
    }
    // Default to success if no type is provided
    return 'success';
  }

}
