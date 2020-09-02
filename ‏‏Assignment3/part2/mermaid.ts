import { Graph, isAtomicGraph, GraphContent, isCompoundGraph, Edge, Node, isNodeDecl, isNodeRef, makeEdge, makeNodeDecl, makeCompoundGraph, makeNodeRef, makeGraph, AtomicGraph, makeAtomicGraph, makeHeader, CompoundGraph, NodeRef, NodeDecl } from "./mermaid-ast";
import { Result, makeOk, mapResult, safe2, makeFailure, bind, isOk } from "../shared/result";
import { map, is } from "ramda";
import { AtomicExp, isNumExp, Parsed, isExp, isProgram, Exp,  isCExp, isDefineExp, CExp, isAtomicExp, isCompoundExp, isVarRef, isPrimOp, isBoolExp, isStrExp, isLetrecExp, LetrecExp, SetExp, CompoundExp, isAppExp, isIfExp, isProcExp, isLetExp, isLitExp, AppExp, IfExp, ProcExp, LetExp, LitExp, Program, Binding, parseL4, parseL4Exp,  } from "./L4-ast";
import { isNumber, isBoolean, isString, isSymbol } from "util";
import { CompoundSExp, isSymbolSExp, isEmptySExp, isCompoundSExp, isClosure, SExpValue } from "./L4-value";
import { Sexp } from "s-expression";
import { parse } from "../shared/parser";

const makeVarGen = (): (v: string) => string => {
    let count: number = 0;
    return (v: string) => {
        count++;
        return `${v}_${count}`;
    };
};

const uniqueExps = makeVarGen();
const uniqueProgram = makeVarGen();
const uniqueDefine = makeVarGen();
const uniqueVarDecl = makeVarGen();
const uniqueNumExp = makeVarGen();
const uniqueStringExp = makeVarGen();
const uniqueBoolExp = makeVarGen();
const uniqueVarRef = makeVarGen();
const uniquePrimOp = makeVarGen();
const uniqueAppExp = makeVarGen();
const uniqueRands = makeVarGen();
const uniqueIfExp = makeVarGen();
const uniqueProcExp = makeVarGen();
const uniqueParams = makeVarGen();
const uniqueBody = makeVarGen();
const uniqueLetExp = makeVarGen();
const uniqueBinding = makeVarGen();
const uniqueCompoundSExp = makeVarGen();
const uniqueNumber = makeVarGen();
const uniqueBoolean = makeVarGen();
const uniqueString = makeVarGen();
const uniqueSymbol = makeVarGen();
const uniqueEmptySExp = makeVarGen();
const uniqueLitExp = makeVarGen();
const uniqueSetExp = makeVarGen();

const converstNodeToDecl = (graph: GraphContent): GraphContent =>{
    if(isCompoundGraph(graph)){
        if(graph.edges.length > 0){
            const newEdge = makeEdge(convertRefToDecl(graph.edges[0].from), graph.edges[0].to, graph.edges[0].label);
            return makeCompoundGraph([newEdge].concat(graph.edges.slice(1, graph.edges.length)));
        }
    }
   return graph;
}

export const mapL4toMermaid = (exp: Parsed): Result<Graph> =>
    isExp(exp) ? makeOk(makeGraph(makeHeader("TD"),converstNodeToDecl(expToMermaid(exp)))) :
    isProgram(exp) ? makeOk(makeGraph(makeHeader("TD"), programToMermaid(exp))) : 
    exp;

const connectSubGraph = (graph: GraphContent, colonNodeName: string) : Edge[] =>
    isAtomicGraph(graph)? [makeEdge(makeNodeRef(colonNodeName), graph.var)]:
    [makeEdge(makeNodeRef(colonNodeName), convertRefToDecl(graph.edges[0].from))].concat(graph.edges);

const makeGraphsArray = (arr: Exp[]) : GraphContent[] => 
    arr.map((ex: Exp) => expToMermaid(ex));

const programToMermaid = (program: Program) : GraphContent =>{
    const colonsUniqueName = uniqueExps("Exps");
    return makeCompoundGraph([makeEdge(makeNodeDecl(uniqueProgram(program.tag),program.tag), makeNodeDecl(colonsUniqueName, ":"), "exps")].concat(
        makeGraphsArray(program.exps).map((graphContent) => connectSubGraph(graphContent, colonsUniqueName)).reduce((acc: Edge[], cur: Edge[])=> acc.concat(cur), [])))};

const convertRefToDecl = (exp: Node) : NodeDecl => {
    const  x = exp.id.indexOf('_');
    const label = exp.id.substring(0, x);
    return makeNodeDecl(exp.id, label);
}

const expToMermaid = (exp: Exp) : GraphContent =>{
    if(isCExp(exp)) 
        return cexpToMermaid(exp) 
    else{
        const defineExp = uniqueDefine(exp.tag);
        const g : GraphContent = cexpToMermaid(exp.val);
        return makeCompoundGraph(
        [makeEdge(makeNodeDecl(defineExp, exp.tag), makeNodeDecl(uniqueVarDecl(exp.var.tag), `${exp.var.tag}(${exp.var.var})`), "var"), 
        makeEdge(makeNodeRef(defineExp), isCompoundGraph(g)? convertRefToDecl(g.edges[0].from) : g.var , "val")].concat(isCompoundGraph(g)? g.edges : []))
    };
}

const cexpToMermaid = (exp: CExp) : GraphContent =>
    isAtomicExp(exp) ? atomicExpToMermaid(exp) :
    compoundToMermaid(exp);

const atomicExpToMermaid = (exp: AtomicExp) : GraphContent =>
    isNumExp (exp) ? 
        makeAtomicGraph(makeNodeDecl(uniqueNumExp(exp.tag), `${exp.tag}(${exp.val})`)) :
    isStrExp (exp) ? 
        makeAtomicGraph(makeNodeDecl(uniqueStringExp(exp.tag), `${exp.tag}(${exp.val})`)) :
    isBoolExp (exp)? exp.val?  makeAtomicGraph(makeNodeDecl(uniqueBoolExp(exp.tag), `${exp.tag}(#t)`)) :
                                makeAtomicGraph(makeNodeDecl(uniqueBoolExp(exp.tag), `${exp.tag}(#f)`)) :
    isVarRef (exp) ? makeAtomicGraph(makeNodeDecl(uniqueVarRef(exp.tag), `${exp.tag}(${exp.var})`)) :
    makeAtomicGraph(makeNodeDecl(uniquePrimOp(exp.tag), `${exp.tag}(${exp.op})`)) ;

const compoundToMermaid = (exp: CompoundExp) : GraphContent =>
    isAppExp(exp) ? appToMermaid(exp) :
    isIfExp(exp) ? ifToMermaid(exp) :
    isProcExp(exp) ? procToMermaid(exp) :
    isLetExp(exp) || isLetrecExp(exp) ? letToMermaid(exp) :
    isLitExp(exp) ? litToMermaid(exp) : 
    setToMermaid(exp);

const appToMermaid = (exp: AppExp) : GraphContent =>{
    const appId = uniqueAppExp(exp.tag);
    const colonsUniqueName = uniqueRands("Rands");
    const g2 : GraphContent = cexpToMermaid(exp.rator);
    return makeCompoundGraph([makeEdge(makeNodeRef(appId), isCompoundGraph(g2)? convertRefToDecl(g2.edges[0].from) : g2.var, "rator"),
                                makeEdge(makeNodeRef(appId), makeNodeDecl(colonsUniqueName, ":") , "rands")].concat(isCompoundGraph(g2)? g2.edges : [])
                                .concat(makeGraphsArray(exp.rands).map((graphContent) => connectSubGraph(graphContent, colonsUniqueName)).reduce((acc: Edge[], cur: Edge[])=> acc.concat(cur), [])));}


const ifToMermaid = (exp: IfExp) : GraphContent =>{
    const ifId = uniqueIfExp(exp.tag);
    const g : GraphContent[] = [exp.test, exp.then, exp.alt].map((exp) => cexpToMermaid(exp)); 
    return makeCompoundGraph([makeEdge(makeNodeRef(ifId), isCompoundGraph(g[0])? convertRefToDecl(g[0].edges[0].from): g[0].var, "test"),
            makeEdge(makeNodeRef(ifId), isCompoundGraph(g[1])? convertRefToDecl(g[1].edges[0].from): g[1].var, "then"),
            makeEdge(makeNodeRef(ifId), isCompoundGraph(g[2])? convertRefToDecl(g[2].edges[0].from): g[2].var, "alt")].concat(getEdgesArr(g)));
}

const getEdgesArr = (graphs: GraphContent[]) : Edge[] => {
    return graphs.reduce((acc: Edge[], cur: GraphContent) => isCompoundGraph(cur)? acc.concat(cur.edges): acc, []);
}

const procToMermaid = (exp: ProcExp) : GraphContent =>{
    const procId = uniqueProcExp(exp.tag);
    const colonArgs = uniqueParams("Params");
    const colonBody = uniqueBody("Body");
    const args : Edge[] = exp.args.map((x) => makeEdge(makeNodeRef(colonArgs), makeNodeDecl(uniqueVarDecl(x.tag), `${x.tag}(${x.var})`)));
    return makeCompoundGraph([makeEdge(makeNodeRef(procId), makeNodeDecl(colonArgs, ":") , "args"), makeEdge(makeNodeRef(procId), makeNodeDecl(colonBody, ":"), "body")]
    .concat(args).concat(makeGraphsArray(exp.body).map((graphContent) => connectSubGraph(graphContent, colonBody)).reduce((acc: Edge[], cur: Edge[])=> acc.concat(cur), [])));
}

const letToMermaid = (exp: LetExp | LetrecExp) : GraphContent =>{
    const letId = uniqueLetExp(exp.tag);
    const bodyId = uniqueBody("Body");
    const bindingsId = uniqueBinding("Binding");
    return makeCompoundGraph([makeEdge(makeNodeRef(letId), makeNodeDecl(bodyId, ":") , "body"),
    makeEdge(makeNodeRef(letId), makeNodeDecl(bindingsId, ":") , "bindings"),]
    .concat(makeArrayForBindings(exp.bindings).map((graphContent) => connectSubGraph(graphContent, bindingsId)).reduce((acc: Edge[], cur: Edge[])=> acc.concat(cur), [])
    .concat(makeGraphsArray(exp.body).map((graphContent) => connectSubGraph(graphContent, bodyId)).reduce((acc: Edge[], cur: Edge[])=> acc.concat(cur), [])
    )));}

const makeArrayForBindings = (bindings : Binding[]) : GraphContent[] =>{
    return bindings.map((b) => bindingToMermaid(b))
}

const bindingToMermaid = (binding: Binding) : GraphContent =>{
    const bindingId = uniqueBinding(binding.tag);
    const g : GraphContent = cexpToMermaid(binding.val);
    return makeCompoundGraph([makeEdge(makeNodeRef(bindingId), makeNodeDecl(uniqueVarDecl(binding.var.tag), `${binding.var.tag}(${binding.var.var})`), "var"),
    makeEdge(makeNodeRef(bindingId), isCompoundGraph(g)? convertRefToDecl(g.edges[0].from) : g.var , "val")].concat(isCompoundGraph(g)? g.edges : []))};

const compundSExpToMermaid = (exp : CompoundSExp) : GraphContent => {
    const compId = uniqueCompoundSExp(exp.tag);
    return makeCompoundGraph(makeCompoundEdges(exp.val1, compId, "1").concat(makeCompoundEdges(exp.val2, compId, "2")));
}

const makeCompoundEdges = (exp: SExpValue, compId: string, label: string): Edge[] => {
    if(isNumber(exp))
        return [makeEdge(makeNodeRef(compId),makeNodeDecl(uniqueNumber("number"),`number(${exp})`), `val${label}`)];
    else if(isPrimOp(exp))
        return [makeEdge(makeNodeRef(compId),makeNodeDecl(uniquePrimOp("PrimOp"),`PrimOp(${exp.op})`), `val${label}`)];
    else if(isBoolean(exp))
        return [makeEdge(makeNodeRef(compId),makeNodeDecl(uniqueBoolean("boolean"),`boolean(${exp})`), `val${label}`)];
    else if(isString(exp))
        return [makeEdge(makeNodeRef(compId),makeNodeDecl(uniqueString("string"),`string(${exp})`), `val${label}`)];
    else if (isSymbolSExp(exp))
        return [makeEdge(makeNodeRef(compId), makeNodeDecl(uniqueSymbol("SymbolSExp"), "SymbolSExp"), `val${label}`)];
    else if (isEmptySExp(exp))
        return [makeEdge(makeNodeRef(compId), makeNodeDecl(uniqueEmptySExp("EmptySExp"), "EmptySExp"), `val${label}`)];
    else if (isCompoundSExp(exp)){
        const g : GraphContent = compundSExpToMermaid(exp);
        return [makeEdge(makeNodeRef(compId),isCompoundGraph(g)? convertRefToDecl(g.edges[0].from) : g.var , `val${label}`)].concat(isCompoundGraph(g)? g.edges : []);
    }
    else return [];
}

const litToMermaid = (exp: LitExp) : GraphContent =>{
    const litId = uniqueLitExp(exp.tag);
    if(isNumber(exp.val) || isBoolean(exp.val) || isString(exp.val) || isPrimOp(exp.val)) 
        return makeCompoundGraph([makeEdge(makeNodeRef(litId),makeNodeDecl(uniqueLitExp(exp.tag),`${exp.tag}(${exp.val})`), "val")]);
    else if (isSymbolSExp(exp.val))
        return makeCompoundGraph([makeEdge(makeNodeRef(litId), makeNodeDecl(uniqueSymbol("SymbolSExp"), "SymbolSExp"), "val")]);
    else if (isEmptySExp(exp.val))
        return makeCompoundGraph([makeEdge(makeNodeRef(litId), makeNodeDecl(uniqueEmptySExp("EmptySExp"), "EmptySExp"), "val")]);
    else if (isClosure(exp.val))
        return makeCompoundGraph([]) 
    else {
        const g : GraphContent = compundSExpToMermaid(exp.val);
        return makeCompoundGraph([makeEdge(makeNodeRef(litId),isCompoundGraph(g)? convertRefToDecl(g.edges[0].from) : g.var , "val")].concat(isCompoundGraph(g)? g.edges : []));
    }
}

const setToMermaid = (exp: SetExp) : GraphContent =>{
    const setExp = uniqueSetExp(exp.tag);
    const g : GraphContent = cexpToMermaid(exp.val);
    return makeCompoundGraph(
    [makeEdge(makeNodeDecl(setExp, exp.tag), makeNodeDecl(uniqueVarRef(exp.var.tag), `${exp.var.tag}(${exp.var.var})`), "var"), 
    makeEdge(makeNodeRef(setExp), isCompoundGraph(g)? convertRefToDecl(g.edges[0].from) : g.var , "val")].concat(isCompoundGraph(g)? g.edges : []))
}

// --------------- Task 2.3 ---------------

export const unparseMermaid = (exp: Graph): Result<string> =>
    makeOk(`graph ${exp.header.val}\n\t${unparseContent(exp.content)}`);

const unparseContent = (exp: GraphContent): string =>
    isAtomicGraph(exp) ? `${exp.var.id}["${exp.var.label}"]` :
    isCompoundGraph(exp) ? map(unparseEdge, exp.edges).join('\n\t') :
    exp;

const unparseEdge = (edge: Edge): string =>
    edge.label ? `${unparseNode(edge.from)} --> |${edge.label}| ${unparseNode(edge.to)}` :
                            `${unparseNode(edge.from)} --> ${unparseNode(edge.to)}`;

const unparseNode = (node: Node): string=>
    isNodeDecl(node) ? `${node.id}["${node.label}"]` :
    isNodeRef(node) ? `${node.id}`:
    node;

export const L4toMermaid = (concrete: string): Result<string>=>{
        const parsedProgram = parseL4(concrete);
        const pardedExp = isOk(parsedProgram)? mapL4toMermaid(parsedProgram.value):
                                 bind(parse(concrete),(sexp: Sexp)=> bind(parseL4Exp(sexp),(exp:Exp)=>mapL4toMermaid(exp)))   
        return bind(pardedExp,(graph: Graph)=> unparseMermaid(graph));
} 