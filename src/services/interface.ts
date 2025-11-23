export interface redeemForm {
  gameName: string;
  username: string;
  amount: string;
  adminEmail?: string;
  orgId?: string;
  orgName?: string;
}

export interface creditLoad {
  gameName: string;
  username: string;
  coin: string;
  adminEmail?: string;
  orgId?: string;
  orgName?: string;
}

export interface login {
  username: string;
  password: string;
  // orgId: string;
}

export interface settingForm {
  userName: string;
  password: string;
  prefix: string;
  suffix: string;
  gameName: string;
  gameUrl: string;
  status: boolean;
  orgName: string;
  adminEmail: string;
}

export interface gameList {
  id: string;
  gameName: string;
  userName: string;
  password: string;
  gameUrl: string;
  status: boolean;
  suffix: string;
  prefix: string;
  orgName?: string;
  adminEmail?: string;
}

export interface organizationForm {
  name: string;
  username: string;
  password?: string; 
  active: boolean;
}

export interface adminUserForm {
  username: string;
  password: string;
  email: string;
  role: string; // ORG_ADMIN or SUPER_ADMIN
  orgId?: string; // Optional for SUPER_ADMIN
}