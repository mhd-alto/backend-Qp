export class QrToken {
  static normalize(value: string): string {
    return value.trim().toLowerCase();
  }
}
