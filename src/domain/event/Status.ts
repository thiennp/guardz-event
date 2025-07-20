export enum Status {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type EventResult<T> =
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string }; 