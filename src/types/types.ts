export interface GoogleOAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  id_token : string
}

 export type Userdetails = {
  username : string,
  email : string,
  password : string
}