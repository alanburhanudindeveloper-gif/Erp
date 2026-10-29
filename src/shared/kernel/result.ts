/**
 * Functional Result pattern implementation for clean error handling
 * without throwing unchecked exceptions across domain boundaries.
 */

export type Result<T, E = Error> = Success<T, E> | Failure<T, E>;

export class Success<T, E> {
  readonly isSuccess = true as const;
  readonly isFailure = false as const;

  constructor(readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Success<U, E>(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  getOrElse(_defaultVal: T): T {
    return this.value;
  }
}

export class Failure<T, E> {
  readonly isSuccess = false as const;
  readonly isFailure = true as const;

  constructor(readonly error: E) {}

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Failure<U, E>(this.error);
  }

  flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Failure<U, E>(this.error);
  }

  getOrElse(defaultVal: T): T {
    return defaultVal;
  }
}

export const ok = <T, E = Error>(value: T): Result<T, E> => new Success<T, E>(value);

export const fail = <T = void, E = Error>(error: E): Result<T, E> => new Failure<T, E>(error);

export const isOk = <T, E>(result: Result<T, E>): result is Success<T, E> => result.isSuccess;

export const isFail = <T, E>(result: Result<T, E>): result is Failure<T, E> => result.isFailure;

export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.isSuccess) {
    return result.value;
  }
  throw result.error;
};
