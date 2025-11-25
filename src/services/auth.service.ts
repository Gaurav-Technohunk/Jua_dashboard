import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { login } from './interface';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiUrl = environment.baseUrl;
  constructor(private http: HttpClient, private router: Router) {}

  login(userData: login) {
    return this.http.post(this.apiUrl + '/auth/login', userData);
  }

  addAccessToken(accessToken: string) {
    return localStorage.setItem('token', accessToken);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  autoLogout() {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000 - Date.now();
      setTimeout(() => this.logout(), expiry);
    }
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || payload.roles || null;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  getUserPayload(): any {
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  isSuperAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'SUPER_ADMIN';
  }

  isOrgAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'ORG_ADMIN';
  }

  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    if (!userRole || !role) {
      return false;
    }
    return userRole.toUpperCase() === role.toUpperCase();
  }

  hasAnyRole(roles: string[]): boolean {
    if (!roles || roles.length === 0) {
      return true;
    }
    const userRole = this.getUserRole();
    if (!userRole) {
      return false;
    }
    const normalizedUserRole = userRole.toUpperCase();
    return roles.some((role) => normalizedUserRole === role.toUpperCase());
  }

  getUsername(): string | null {
    const payload = this.getUserPayload();
    if (payload) {
      // Try different common fields for username in JWT
      return payload.username || payload.sub || payload.preferred_username || payload.userName || null;
    }
    return null;
  }

  getUserEmail(): string | null {
    const payload = this.getUserPayload();
    if (payload) {
      return payload.email || payload.userEmail || null;
    }
    return null;
  }

  getOrgId(): string | null {
    const payload = this.getUserPayload();
    if (payload) {
      return payload.orgId || payload.organizationId || payload.org_id || null;
    }
    return null;
  }
}
