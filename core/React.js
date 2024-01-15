// 创建文本节点
function createTextNode(nodeValue) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue,
      children: [],
    },
  };
}

// 创建元素节点
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        const isTextNode = typeof child === "string" || typeof child === "number";
        return isTextNode ? createTextNode(child) : child;
      }),
    },
  };
}

let nextWorkObj = {};
let root = null;

// 渲染函数
function render(el, container) {
  nextWorkObj = {
    dom: container,
    props: {
      children: [el],
    },
  };
  root = nextWorkObj;
}

// 工作循环函数
function workLoop(deadline) {
  let shouldDeadline = false;
  while (!shouldDeadline && nextWorkObj) {
    nextWorkObj = sunWorkFun(nextWorkObj);
    shouldDeadline = deadline.timeRemaining() < 1;
  }
  if (!nextWorkObj && root) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

// 提交根节点
function commitRoot() {
  commitWork(root.child);
}

// 提交节点
function commitWork(fiber) {
  if (!fiber) return;
  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }
  if (fiber.dom) {
    fiberParent.dom.append(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// 创建DOM元素
function createDom(type) {
  return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

// 更新属性
function updateProps(dom, props) {
  Object.keys(props).forEach((key) => {
    if (key !== "children") {
      dom[key] = props[key];
    }
  });
}

// 初始化子节点
function initChildren(fiber, children) {
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

/**
 * 函数：sunWorkFun
 * 描述：用于渲染节点的函数
 * 参数：
 * - fiber：fiber对象，包含节点的信息
 */
function sunWorkFun(fiber) {
  /**
   * 变量：isFunctionComponent
   * 类型：boolean
   * 描述：判断fiber.type是否为函数节点
   */
  const isFunctionComponent = typeof fiber.type === 'function';
  /**
   * 判断不是函数节点且fiber.dom不存在时，创建dom节点并更新属性
   */
  if (!isFunctionComponent) {
    if (!fiber.dom) {
      const dom = (fiber.dom = createDom(fiber.type));
      updateProps(dom, fiber.props);
    }
  }

  /**
   * 变量：children
   * 类型：数组或undefined
   * 描述：节点的子节点列表
   */
  const children = isFunctionComponent ? [fiber.type(fiber.props)] : fiber.props.children;
  /**
   * 初始化子节点列表
   */
  initChildren(fiber, children);
  /**
   * 判断fiber是否有子节点，返回子节点
   */
  if (fiber.child) {
    return fiber.child;
  }
  /**
   * 变量：nextFiber
   * 类型：fiber对象
   * 描述：遍历fiber对象的父级节点
   */
  let nextFiber = fiber;
  while (nextFiber) {
    /**
     * 判断nextFiber是否有兄弟节点，返回兄弟节点
     */
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}

const React = {
  render,
  createElement,
};
export default React;