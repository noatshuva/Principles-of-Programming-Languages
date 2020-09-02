// ========================================================
// L4 normal eval
import { Sexp } from "s-expression";
import { CExp, Exp, IfExp, Program, parseL4Exp, VarDecl, LetExp, Binding, isLetExp } from "./L4-ast";
import { isAppExp, isBoolExp, isCExp, isDefineExp, isIfExp, isLitExp, isNumExp,
         isPrimOp, isProcExp, isStrExp, isVarRef } from "./L4-ast";
import { applyEnv, makeEmptyEnv, Env, makeExtEnv } from './L4-env-normal';
import { applyPrimitive } from "./evalPrimitive";
import { isClosure, makeClosure, Value, Closure } from "./L4-value";
import { first, rest, isEmpty } from '../shared/list';
import { Result, makeOk, makeFailure, bind, mapResult } from "../shared/result";
import { parse as p } from "../shared/parser";
import { map } from "ramda";

const normalEval = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isVarRef(exp) ?  bind(applyEnv(env, exp.var), (exp: CExp) => normalEval(exp, env)) :
    isLitExp(exp) ? makeOk(exp.val) :
    isIfExp(exp) ? evalIf(exp, env) :
    isProcExp(exp) ? makeOk(makeClosure(exp.args, exp.body, env)) :
    isLetExp(exp) ? evalLet(exp, env) :
    isAppExp(exp) ?  bind(normalEval(exp.rator, env), proc => L4normalApplyProc(proc, exp.rands, env)) :
    makeFailure(`Bad L4 AST ${exp}`);

export const isTrueValue = (x: Value): boolean =>
    ! (x === false);

const evalCExps = (exp1: Exp, exps: Exp[], env: Env): Result<Value> =>
    isCExp(exp1) && isEmpty(exps) ? normalEval(exp1, env) :
    isCExp(exp1) ? evalExps(exps, env) :
    makeFailure("Never");

const evalDefineExps = (def: Exp, exps: Exp[], env: Env): Result<Value> =>
    isDefineExp(def) ? evalExps(exps, makeExtEnv([def.var.var], [def.val], env)) :
    makeFailure("Unexpected " + def);

// Evaluate a sequence of expressions (in a program)
export const evalExps = (exps: Exp[], env: Env): Result<Value> =>
    isEmpty(exps) ? makeFailure("Empty Exps") :
    isDefineExp(first(exps)) ? evalDefineExps(first(exps), rest(exps), env) :
    evalCExps(first(exps), rest(exps), env);

export const evalNormalProgram = (program: Program): Result<Value> =>
    evalExps(program.exps, makeEmptyEnv());

export const evalNormalParse = (s: string): Result<Value> =>
    bind(p(s),
         (parsed: Sexp) => bind(parseL4Exp(parsed),
                                (exp: Exp) => evalExps([exp], makeEmptyEnv())));

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(normalEval(exp.test, env),
        (test: Value) => isTrueValue(test) ? normalEval(exp.then, env) : normalEval(exp.alt, env));

const applyClosure = (proc: Closure, args: CExp[]): Result<Value> => {
    const vars = map((v: VarDecl) => v.var, proc.params);
    return evalExps(proc.body, makeExtEnv(vars, args, proc.env));
}

// LET: Direct evaluation rule without syntax expansion
// compute the values, extend the env, eval the body.
const evalLet = (exp: LetExp, env: Env): Result<Value> => {
    return evalExps(exp.body, makeExtEnv(map((b: Binding) => b.var.var, exp.bindings), map((b: Binding) => b.val, exp.bindings), env));}


const L4normalApplyProc = (proc: Value, args: CExp[], env: Env): Result<Value> => {
    if (isPrimOp(proc)) {
            const argVals: Result<Value[]> = mapResult((arg) => normalEval(arg, env), args);
            return bind(argVals, (args: Value[]) => applyPrimitive(proc, args));
        } else if (isClosure(proc)) {
            return applyClosure(proc, args);
        } else {
            return makeFailure(`Bad proc applied ${proc}`);
        }
    };
        