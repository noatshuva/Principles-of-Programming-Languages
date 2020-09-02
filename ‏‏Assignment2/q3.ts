import { ForExp, AppExp, Exp, Program, CExp, isCExp, isDefineExp, makeDefineExp, isAtomicExp, isIfExp, makeIfExp, isAppExp, isProcExp, isForExp, makeForExp} from "./L21-ast";
import { Result, makeOk } from "../imp/result";
import { makeAppExp, makeProcExp, isExp, isProgram, makeProgram, makePrimOp, VarDecl, NumExp } from "./L21-ast";
import { map, reduce } from "ramda";
import { makeNumExp } from "../imp/L2-ast";

/*
Purpose: applies a syntactic transformation from a ForExp to an equivalent AppExp
Signature: for2app (exp: ForExp)
Type: (exp: ForExp) -> AppExp
*/
export const for2app = (exp: ForExp): AppExp => 
    makeAppExp(makeProcExp([],counter(exp.start, exp.end).reduce((acc: AppExp[], curr: NumExp) => acc.concat([makeAppExp(makeProcExp([exp.var], [exp.body]),[curr])]), [])),[]);
/*
Purpose: count how many times the for loop needs to be done
Signature: counter(start: NumExp, end: NumExp)
Type: (start: NumExp, end: NumExp) -> NumExp[]
*/
const counter = (start: NumExp, end: NumExp) : NumExp[] => 
        (start.val === end.val) ?  
        [end] : counter(start, makeNumExp(end.val - 1)).concat([end])

/*
Purpose: gets an L21 AST and returns an equivalent L2 AST
Signature: L21ToL2(exp: Exp | Program)
Type: (exp: Exp | Program) -> Result<Exp | Program>
*/
export const L21ToL2 = (exp: Exp | Program): Result<Exp | Program> =>
    isExp(exp)? makeOk(rewriteAllExp(exp)) :
    isProgram(exp)? makeOk(makeProgram(map(rewriteAllExp, exp.exps))) :
    makeOk(exp);

/*
Purpose: gets an L21 Exp and returns an equivalent L2 Exp
Signature: rewriteAllExp(exp: Exp)
Type: (exp: Exp) -> Exp
*/
const rewriteAllExp = (exp: Exp): Exp =>
    isCExp(exp) ? rewriteAllCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllCExp(exp.val)) :
    exp;

/*
Purpose: gets an L21 CExp and returns an equivalent L2 CExp
Signature: rewriteAllCExp(exp: CExp)
Type: (exp: CExp) -> CExp
*/
const rewriteAllCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllCExp(exp.test), rewriteAllCExp(exp.then), rewriteAllCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteAllCExp(exp.rator), map(rewriteAllCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllCExp, exp.body)) :
    isForExp(exp) ? rewriteAllCExp(for2app(exp)) :
    exp;
