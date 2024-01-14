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
function render(el, container) {
  nextWorkObj = {
    dom: container,
    props: {
      children: [el],
    },
  };
}

function workLoop(deadline) {
  let shouldDeadline = false;
  while (!shouldDeadline && nextWorkObj) {
    nextWorkObj = sunWorkFun(nextWorkObj);
    shouldDeadline = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

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
    fiber.parent.dom.append(dom);
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
