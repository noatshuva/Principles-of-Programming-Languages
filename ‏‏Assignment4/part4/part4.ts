
const f = (x: number) : Promise<number> => {
    return new Promise<number>(
        function (resolve, reject) {
            if (x != 0)
                resolve(1/x);
            else
                reject("Division by 0 is illegal");
    })
}

const g = (x: number) : Promise<number> => {
    return new Promise<number>(
        function (resolve, reject) {
            resolve(x*x);
    })
}

const h = (x: number) : Promise<number> => {
    return new Promise<number>(
        function (resolve, reject) {
            g(x).then((power) => f(power).then((div) => resolve(div))).catch((err) => reject(err)).catch((err) => reject(err));
    })
}


const slower = (promises: Promise<any>[]) : Promise<any[]> => {
    let isResolved : boolean = false;
    return new Promise<any>(
        function (resolve, reject) {
            promises[0].then((res) => isResolved? resolve([0,res]) : isResolved = true).catch((err) => reject(console.error(err)));
            promises[1].then((res) => isResolved? resolve([1,res]) : isResolved = true).catch((err) => reject(console.error(err)));
    })
}


// ------------------Test---------------------

// const promise1 = new Promise((resolve, reject) => {
//     setTimeout(resolve, 500, 'one');
//   });
  
// const promise2 = new Promise((resolve, reject) => {
//     setTimeout(resolve, 10000, 'two');
//   });

// const slP = slower([promise1, promise2]).then(x => {console.log(x[0] + " --- " + x[1])}).catch(x => {});