import React from './core/React.js'
import ReactDOM from './core/ReactDOM.js'
const App = React.createElement("div", { id: "app" }, "Hello mini react!", 'Hi React');


ReactDOM.createRoot(document.querySelector("#root")).render(App)