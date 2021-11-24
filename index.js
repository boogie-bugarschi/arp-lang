//helpers
function isTruthy(x){
    return x !== false && x !== null && x !== undefined;
}

/** 
  * create new context from a list of names and list of values 
  */
function bind(names, values){
    let result = {};
    for(let i = 0; i < names.length; i++){
	result[names[i]] = values[i];
    }
    return result;
}

function lookup(x, ctx){
    if(ctx.hasOwnProperty(x)){
	return ctx[x];
    }else {
	throw new Error(x + " is not defined");
    }
}

function isNumber(x){
    return typeof x === "number";
}

function isNull(x){
    return x == null;
}

function isNativeFunction(x){
    return typeof x === "function";
}
function isFn(x){
    return x instanceof Fn;
}

function isBoolean(x){
    return typeof x === "boolean";
}

// form checks
function isSelfEvaluatingForm(x){
    return isNumber(x) || isBoolean(x) || isNull(x) || isNativeFunction(x) || isFn(x);
}

function isSymbol(x){
    return typeof x === "string";
}

function isIfForm(form){
    return form instanceof Array && form[0] === "if";
}

function isLetForm(form){
    return form instanceof Array && form[0] === "let";
}

function isLambdaForm(form){
    return form instanceof Array && form[0] === "fn";
}

function isApplyForm(form){
    return form instanceof Array;
}


class Fn{
    constructor(params, body, ctx){
	this.params = params;
	this.body = body;
	this.ctx = ctx;
    }
}

function meval(form, ctx) {
    // simple stuff
    if(isSelfEvaluatingForm(form)){
	return form;
    }
    if(isSymbol(form)){
	return lookup(form, ctx);
    }
    // special forms
    if(isIfForm(form)){
	let condition = meval(form[1], ctx);
	if(isTruthy(condition)){
	    let consequent = form[2];
	    return meval(consequent, ctx);
	}else {
	    let alternative = form[3];
	    return meval(alternative, ctx);
	}
    }
    if(isLambdaForm(form)){
	let [_, params, ...body] = form;
	return new Fn(params, body, ctx);
    }
    // syntax sugar
    if(isLetForm(form)){ // let is just a function call that captures it's bindings as local state
	let [_, bindings, ...body] = form;
	let names = bindings.map(x => x[0]);
	let values = bindings.map(x => x[1]);
	let newForm = [["fn", [...names], ...body], ...values];
	return meval(newForm, ctx);
    }
    //general application
    if(isApplyForm(form)){
	let [operator, ...operands] = form;
	let fn = meval(operator, ctx);
	let args = operands.map(a => meval(a, ctx));
	if(isNativeFunction(fn)){
	    return fn(...args);
	}else if(isFn(fn)){
	    let { params, body, ctx: function_ctx } = fn;
	    let newCtx = {
		...ctx,
		...function_ctx,
		...bind(params, args),
		"recur": fn
	    };
	    let results = body.map(b => meval(b, newCtx));
	    return results[results.length - 1];
	}else {
	    throw new Error(f + " can't be applied");
	}
    }
    // error
    throw new Error(form + " can't be evaluated");
}

// factorial and fibonacci example
let program1 = ["let", [["factorial", ["fn", ["n"],
				        ["if", ["<", "n", 2],
				          1,
				          ["*", "n", ["recur", ["-", "n", 1]]]]]],

		       ["fibonacci", ["fn", ["n"],
				      ["if", ["<","n", 3],
				       1,
				       ["+",
					["recur", ["-", "n", 1]],
					["recur", ["-", "n", 2]]]]]]],

	         ["println", ["factorial", 5]],
	         ["println", ["fibonacci", 10]]];


// the 'pair' data structure, which could be the base for lists and binary trees
// created just from closures
let program2 = ["let", [["cons", ["fn", ["a", "d"],
				  ["fn", ["message"],
				   ["if", ["=", "message", 0], "a", "d"]]]],
			["car", ["fn", ["pair"], ["pair", 0]]],
	 	        ["cdr", ["fn", ["pair"], ["pair", 1]]]],

		["let", [["x", ["cons", 1, 2]]],
		 ["println", ["car", "x"]],
		 ["println", ["cdr", "x"]]]];



// minimal global context for given examples
// in a more 'real world' case the global context would have a lot more stuff in it
let context = {
    "println": (...args) => console.log(...args),
    "+": (a, b) => a + b,
    "-": (a, b) => a - b,
    "*": (a, b) => a * b,
    "<": (a, b) => a < b,
    "=": (a, b) => a === b
};
console.log("Program1:");
meval(program1, context);
console.log("Program2:");
meval(program2, context);
