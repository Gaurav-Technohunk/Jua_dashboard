export interface redeemForm {
  gameName: string;
  username: string;
  amount: string;
}

export interface creditLoad {
  gameName: string;
  username: string;
  coin: string;
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
  gameName: string;
  gameUrl: string;
  status: boolean;
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
}
