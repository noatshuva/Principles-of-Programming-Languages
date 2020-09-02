import { Exp, Program, isExp, isProgram, isDefineExp, isCExp, CExp, isNumExp} from '../imp/L2-ast';
import { Result, makeOk, makeFailure, mapResult, bind, safe2 } from '../imp/result';
import { map } from 'ramda';
import { isBoolExp, isPrimOp, isVarRef, isAppExp, isIfExp, isProcExp } from '../imp/L2-ast';

/*
Purpose: transforms a given L2 program to a JavaScript program
Signature: l2ToJS (exp: Exp | Program)
Type: (exp: Exp | Program) -> Result<string>
*/
export const l2ToJS = (exp: Exp | Program): Result<string> => 
    isExp(exp)? makeOk(rewriteJSExp(exp)) :
    isProgram(exp)? 
        exp.exps.length === 1?
            bind(mapResult(l2ToJS, exp.exps), (exps: string[]) => makeOk(`console.log(${rewriteJSExp(exp.exps[0])});`)) : 
            safe2((test: string, then: string[]) => makeOk(`${then.join(";\n")};\nconsole.log(${test});`))(l2ToJS(exp.exps[exp.exps.length-1]), mapResult(l2ToJS, exp.exps.slice(0, exp.exps.length-1))) :
    makeFailure("Illegal argument");

/*
Purpose: transforms a given Exp to string
Signature: rewriteJSExp (exp: Exp)
Type: (exp: Exp) -> string
*/
const rewriteJSExp = (exp: Exp): string =>
    isCExp(exp) ? rewriteJSCExp(exp) :
    isDefineExp(exp) ? `const ${exp.var.var} = ${rewriteJSCExp(exp.val)}`  :
    exp;

/*
Purpose: transforms a given CExp to string
Signature: rewriteJSCExp (exp: CExp)
Type: (exp: CExp) -> string
*/
const rewriteJSCExp = (exp: CExp): string =>
    isNumExp(exp)? exp.val.toString() :
    isBoolExp(exp)? exp.val ? "true" : "false" :
    isPrimOp(exp)?
        exp.op === "number?" ? `((x)=>(typeof(x) === 'number'))` :
        exp.op === "boolean?" ? `((x)=>(typeof(x) === 'boolean'))` :
        exp.op === "not" ? `((x)=>!x)` :
        exp.op === "eq?" ? `===` :
        exp.op === "or" ? `||` :
        exp.op === "=" ? `===` :
        exp.op === "and" ? `&&` :
        exp.op :
    isVarRef(exp)? exp.var :
    isAppExp(exp)? 
        isPrimOp(exp.rator) ? 
            exp.rator.op === "=" ? `(${rewriteJSCExp(exp.rands[0])} === ${map(rewriteJSCExp, exp.rands.slice(1, exp.rands.length))})` :
            exp.rator.op === "not" ? `(!${rewriteJSCExp(exp.rands[0])}${map(rewriteJSCExp, exp.rands.slice(1, exp.rands.length))})` :
            exp.rator.op === "and" ? `(${map(rewriteJSCExp, exp.rands.slice(0, exp.rands.length)).join(" && ")})` :
            exp.rator.op === "or" ? `(${map(rewriteJSCExp, exp.rands.slice(0, exp.rands.length)).join(" || ")})` :
            exp.rator.op === "eq?" ? `(${map(rewriteJSCExp, exp.rands.slice(0, exp.rands.length)).join(" === ")})` :
            exp.rator.op === "number?" ? `(typeof ${rewriteJSCExp(exp.rands[0])} === 'number')` :
            exp.rator.op === "boolean?" ? `(typeof ${rewriteJSCExp(exp.rands[0])} === 'boolean')` :
            `(${map(rewriteJSCExp, exp.rands).join(" "+ exp.rator.op +" ")})` :
        `${rewriteJSCExp(exp.rator)}(${map(rewriteJSCExp, exp.rands).join(",")})` :
    isIfExp(exp)? `(${rewriteJSCExp(exp.test)} ? ${rewriteJSCExp(exp.then)} : ${rewriteJSCExp(exp.alt)})`:
    isProcExp(exp)? 
        exp.body.length === 1?
            `((${map(x => x.var, exp.args).join(",")}) => ${map(rewriteJSCExp, exp.body)})` :
            `((${map(x => x.var, exp.args).join(",")}) => {${map(rewriteJSCExp, exp.body.slice(0 , exp.body.length -1)).join("; ")}; return ${rewriteJSCExp(exp.body[exp.body.length-1])};})` :
    exp;

