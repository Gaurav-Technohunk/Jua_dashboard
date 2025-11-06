import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { creditLoad, gameList, redeemForm, settingForm } from './interface';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RedeemService {
  apiUrl = environment.baseUrl;

  private reloadComponent1Subject = new Subject<void>();
  reloadComponent1$ = this.reloadComponent1Subject.asObservable();

  reloadComponent1() {
    this.reloadComponent1Subject.next();
  }

  constructor(private http: HttpClient) {}

  manualCreditLoad(formData: creditLoad) {
    return this.http.post(this.apiUrl + '/api/customer/updateCoin', formData);
  }

  manualRedeem(formData: redeemForm) {
    return this.http.post(this.apiUrl + '/api/customer/redeem', formData);
  }

  addNewGame(formData: settingForm) {
    return this.http.post(this.apiUrl + '/api/customer/settings', formData);
  }

  updateGame(formData: any) {
    return this.http.put<gameList>(
      this.apiUrl + '/api/customer/updateGame',
      formData
    );
  }

  getGameName() {
    return this.http.get(this.apiUrl + '/api/customer/games');
  }

  getHistoryDetails() {
    return this.http.get(this.apiUrl + '/api/customer/history');
  }

  fetchGameList() {
    return this.http.get<gameList[]>(this.apiUrl + '/api/customer/gameList');
  }

  searchPlayers(gameName: string){
    return this.http.get(this.apiUrl + `/players/${gameName}`)
  }

  registerPlayer(data: { plUname: string; gameName: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/players/register`, data);
  }

  fetchPlayersList(): Observable<any> {
    return this.http.get(`${this.apiUrl}/players`);
  }

  uploadCsv(formData: FormData) {
    return this.http.post<any>(`${this.apiUrl}/api/customer/csv/upload`, formData);
  }

  uploadJson(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/customer/json/upload`, formData);
  }
}
