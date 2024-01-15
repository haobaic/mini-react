function createTextNode(nodeValue) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue,
      children: [],
    },
  };
}
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        return typeof child === "string" ? createTextNode(child) : child;
      }),
    },
  };
}

let nextWorkObj = {};
let root = null
function render(el, container) {
  nextWorkObj = {
    dom: container,
    props: {
      children: [el],
    },
  };
  root=nextWorkObj
}

function workLoop(deadline) {
  let shouldDeadline = false;
  while (!shouldDeadline && nextWorkObj) {
    nextWorkObj = sunWorkFun(nextWorkObj);
    shouldDeadline = deadline.timeRemaining() < 1;
  }
  if(!nextWorkObj&&root){
    commitRoot()
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

function commitRoot(){
  commitWork(root.child)
}

function commitWork(fiber){
  if(!fiber) return;
  if(fiber.dom){
    fiber.parent.dom.append(fiber.dom);
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function createDom(type) {
  return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

function updateProps(dom,props){
    Object.keys(props).forEach((key) => {
        if (key !== "children") {
          dom[key] = props[key];
        }
      })
}

function initChildren(fiber){
    const children = fiber.props.children;
    let prvChild = null;
    children.forEach((child, index) => {
      const newFiber = {
        type: child.type,
        props: child.props,
        parent: fiber,
        child: null,
        sibling: null,
        dom: null,
      };
      if (index === 0) {
        fiber.child = newFiber;
      } else {
        prvChild.sibling = newFiber;
      }
      prvChild = newFiber;
    });
}

function sunWorkFun(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom =createDom(fiber.type));
    
    updateProps(dom,fiber.props)
  }
  initChildren(fiber)
  if (fiber.child) {
    return fiber.child;
  }
  if (fiber.sibling) {
    return fiber.sibling;
  }
  return fiber.parent?.sibling;
}

const React = {
  render,
  createElement,
};
export default React;
