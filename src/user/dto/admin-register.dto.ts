export class AdminRegisterDto {
  name: string;
  email: string;
  password: string;
  adminSecretKey: string; // ← required to register as admin
}