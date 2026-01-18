export interface RateRepository<R> {
  create(rate: R, newInfo?: boolean): Promise<number>;
  update(rate: R, oldRate: number): Promise<number>;
  load(id: string, author: string): Promise<R | null>;
}
export interface Reaction {
  id: string;
  author: string;
  userId: string;
  time: Date;
  reaction: number;
}
