import React from "../core/React.js";

function Counter({num}) {
  return <div>Hi React-{num}</div>;
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
