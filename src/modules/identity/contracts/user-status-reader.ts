export interface UserStatusReader {
  isActiveForAuthentication(status: string): boolean;
}
