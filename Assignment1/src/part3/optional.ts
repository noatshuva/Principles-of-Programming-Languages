/* Question 1 */

export type Optional<T> = Some<T>|None;

interface Some<T>{
    tag: "Some";
    value: T;
}

interface None{
    tag: "None";
}

export const makeSome = <T>(value: T): Optional<T> => ({tag: "Some", value: value});
export const makeNone = <T>(): Optional<T> => ({tag: "None"});

export const isSome = <T>(x: any): x is Some<T> => x.tag === "Some";
export const isNone = (x: any): x is None => x.tag === "None";

/* Question 2 */
export const bind = <T, U>(optional: Optional<T>, f: (x: T) => Optional<U>): Optional<U> => {
    return isSome(optional)? f(optional.value): optional;
  };
