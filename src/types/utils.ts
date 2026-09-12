export type Range<N extends number, Acc extends number[] = []> = Acc["length"] extends N
  ? Acc[number]
  : Range<N, [...Acc, Acc["length"]]>;

export type Tuple<T, N extends number, R extends T[] = []> = R["length"] extends N
  ? R
  : Tuple<T, N, [...R, T]>;
