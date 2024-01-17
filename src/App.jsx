import React from "../core/React.js";

let count = 10;
let props = {id:'container'}
function Counter({num}) {
  function handleClick(){
    count++;
    props = {}
    React.update()
  }
  return <div {...props}>Hi React-{num} <button onClick={handleClick}>count:{count}</button></div>;
}

function CounterComponent() {
    return <Counter></Counter>;
  }

// const App = (
//   <div>
//     Hello mini react!
//     <Counter />
//     <CounterComponent/>
//   </div>
// );
function App(){
    return <div>
    Hello mini react!
    <Counter num={10} />
    <Counter num={20} />
  </div>
}
export default App;
