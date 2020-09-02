function* braid(generator1:() => Generator<any>, generator2:() => Generator<any>){

    let it1: Iterator<any> = generator1(); //check any
    let it2: Iterator<any> = generator2();
    let val1: IteratorResult<any> = it1.next();
    let val2: IteratorResult<any> = it2.next();
    
   
    while (!val1.done || !val2.done){
        if(!val1.done){
            yield val1.value;
            val1 = it1.next();
        }
        if(!val2.done){
            yield val2.value;
            val2 = it2.next();
        }
    }
}

function* biased(generator1:() => Generator<any>, generator2:() => Generator<any>){

    let it1: Iterator<any> = generator1(); //check any
    let it2: Iterator<any> = generator2();
    let val1: IteratorResult<any> = it1.next();
    let val2: IteratorResult<any> = it2.next();
    
   
    while (!val1.done || !val2.done){
        if(!val1.done){
            yield val1.value;
            if(!val1.done){
                val1 = it1.next();
                if(!val1.done){
                    yield val1.value;
                    val1 = it1.next();
                }
            }
        }
        if(!val2.done){
            yield val2.value;
            if(!val2.done){
                val2 = it2.next();
                if(!val2.done){
                    yield val2.value;
                    val2 = it2.next();
                }
            }
        }
    }
}

//-----delete later-----//


function* gen1(){
    yield 3;
    yield 6;
    yield 9;
}

function* gen2() {
    yield 8;
    yield 10;
    yield 12;
    yield 9;
    yield null;
}

let b = biased(gen1, gen2);
let x = b.next();
while(!x.done) {
    console.log(x.value);
    x = b.next();
}
//-----delete later-----//

