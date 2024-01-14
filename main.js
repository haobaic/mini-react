const app = document.createElement('div');
app.innerText = 'Hello hahaha!';
document.body.appendChild(app);

// let i=0;
// while(i<10000000000000){
//     console.log('i: ', i);
//     i++
// }
let i = 0;
function workLoop(deadline) {
    i++
    let shouldDeadline = false
    // if (deadline.timeRemaining() > 0) {
    //     console.log('deadline: ' + i + '----', deadline.timeRemaining());
    // }
    while (!shouldDeadline) {
        console.log('deadline: ' + i + '----', deadline.timeRemaining());
        shouldDeadline=deadline.timeRemaining() < 1
    }
    requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)
