export interface ISupplier {
  id: number;
  name: string;
  email: string | null;
  secondaryEmail: string | null;
  active: boolean;
}
