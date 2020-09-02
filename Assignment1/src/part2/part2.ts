import { Pred, prepend, curry, concat, filter } from "ramda";
import { stringify } from "querystring";

/* Question 1 */
export const partition : <T>(pred: ((x: T) => boolean), arr: T[]) => T[][] = 
<T>(pred: ((x: T) => boolean), arr: T[]): T[][] => [arr.filter(x => pred(x)), arr.filter(x => !pred(x))]; 

/* Question 2 */
export const mapMat : <T1, T2>(func: ((x: T1) => T2), mat: T1[][]) => T2[][] = 
<T1, T2>(func: ((x: T1) => T2), mat: T1[][]): T2[][] => (mat.map(x => x.map(y => func(y))));

/* Question 3 */
export const composeMany : <T>(funcarr: ((x: T) => T)[]) => ((x: T) => T) = 
<T>(funcarr: ((x: T) => T)[]): (x: T) => T => funcarr.reduce((acc, cur) => 
(x) => acc(cur(x)), (x) => x);

/* Question 4 */
interface Languages {
    english: string;
    japanese: string;
    chinese: string;
    french: string;
}

interface Stats {
    HP: number;
    Attack: number;
    Defense: number;
    "Sp. Attack": number;
    "Sp. Defense": number;
    Speed: number;
}

interface Pokemon {
    id: number;
    name: Languages;
    type: string[];
    base: Stats;
}

export const maxSpeed : (pokedex: Pokemon[]) => Pokemon[] = (pokedex: Pokemon[]) => {
    const speed : number = pokedex.reduce((acc: number , cur: Pokemon) => (((cur.base.Speed)>acc)? cur.base.Speed: acc), 0);
    const maxSpeedArr: Pokemon[] = pokedex.filter(x => (x.base.Speed === speed));
    return maxSpeedArr;
}

export const grassTypes : (pokedex: Pokemon[]) => string[] = (pokedex: Pokemon[]) => 
(pokedex.filter(pokemon => ((pokemon.type).reduce((acc: boolean, cur: string) =>
(cur==="Grass")||acc, false) === true))).map((pokemon: Pokemon) : string => (pokemon.name.english)).sort();

export const uniqueTypes : (pokedex: Pokemon[]) => string[] = (pokedex: Pokemon[]) => 
((pokedex.map(pokemon => pokemon.type)).reduce((acc: string[], cur: string[]) =>
acc.concat(cur) ,[])).reduce((acc: string[], cur: string) =>
acc.indexOf(cur)===-1? acc.concat([cur]): acc , []).sort();