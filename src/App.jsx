import React from "../core/React.js";
// const app = React.createElement("div", { id: "app" }, "Hello Mini React");


function Foo() {
  console.log("🚀 ~ Foo ~ Foo:")
  const [count,setCount] = React.useState(1)
  const [Bar,setBar] = React.useState('bar')
  function handleClick(){
    setCount((c)=>c+1)
    setBar('bar11')
  }
  
  return <div>
    <h1>Foo</h1>
    {count}
    <p>{Bar}</p>
    <button onClick={handleClick}>click</button>
  </div>;
}

let countBar = 1;
function Bar() {
  console.log("🚀 ~ Bar ~ Bar:")
  const update =  React.update()
  function handleClick(){
    countBar++;
    update()
  }
  
  return <div>
    <h1>Foo</h1>
    {countBar}
    <button onClick={handleClick}>click</button>
  </div>;
}
let countRoot = 1;
function App() {
  console.log("🚀 ~ App ~ App:")
  // const update =  React.update()
  // function handleClick(){
  //   countRoot++;
  //   update()
  // }
  
  return (
    <div>
      {/* Hello Mini React count:{countRoot} */}
      {/* <button onClick={handleClick}>click</button> */}
      <Foo />
      {/* <Bar /> */}
    </div>
  );
}
export default App;
