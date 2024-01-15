/**
 * 创建一个文本节点
 *
 * @param {string} nodeValue 节点的值
 * @returns {object} 返回一个表示文本节点的对象
 */
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
/**
 * 创建一个元素
 * @param {string} type - 元素的类型
 * @param {Object} props - 元素的属性
 * @param {...any} children - 元素的子元素
 * @returns {Object} - 创建的元素对象
 */
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        /**
         * 判断子元素是否为文本节点
         * @type {boolean}
         */
        const isTextNode =
          typeof child === "string" || typeof child === "number";
        return isTextNode ? createTextNode(child) : child;
      }),
    },
  };
}

let nextWorkObj = {};
let root = null;

// 渲染函数
function render(el, container) {
  // 将 el 元素作为子元素，将 container 元素作为容器，创建 nextWorkObj 对象
  nextWorkObj = {
    dom: container,
    props: {
      children: [el],
    },
  };
  // 将 nextWorkObj 对象赋值给 root 变量
  root = nextWorkObj;
}

// 工作循环函数
function workLoop(deadline) {
  // 工作循环函数，用于不断执行任务直至满足条件
  let shouldDeadline = false; // 初始化一个变量用于判断是否需要满足截止时间
  while (!shouldDeadline && nextWorkObj) {
    // 循环执行任务，直到满足截止时间条件或者没有任务可执行
    nextWorkObj = performWorkOfUnit(nextWorkObj); // 使用任务处理函数处理当前任务对象
    shouldDeadline = deadline.timeRemaining() < 1; // 判断当前任务的截止时间是否小于1
  }
  if (!nextWorkObj && root) {
    // 如果没有任务可执行且存在根对象，则提交根对象
    commitRoot();
  }
  // 请求下一次执行该函数的时间间隔，并递归调用该函数
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

/**
 * 递归地提交根节点的子节点工作
 */
function commitRoot() {
  commitWork(root.child);
}

// 提交节点
function commitWork(fiber) {
  // 检查fiber是否存在
  if (!fiber) return;
  // 初始化fiber的父级节点
  let fiberParent = fiber.parent;
  // 循环找到有dom节点的父级节点
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }
  // 检查fiber是否已经存在dom节点
  if (fiber.dom) {
    // 将fiber的dom节点添加到fiber的父级节点中
    fiberParent.dom.append(fiber.dom);
  }
  // 递归调用commitWork函数处理fiber的子节点
  commitWork(fiber.child);
  // 递归调用commitWork函数处理fiber的兄弟节点
  commitWork(fiber.sibling);
}

// 创建DOM元素
/**
 * 创建一个指定类型的 DOM 元素
 * @param {string} type - 元素类型，仅支持 "TEXT_ELEMENT"
 * @returns {HTMLElement} - 创建的 DOM 元素
 */
function createDom(type) {
  return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

/**
 * 更新DOM元素的属性
 * @param {Object} dom - DOM元素对象
 * @param {Object} props - 待更新的属性对象
 */
function updateProps(dom, props) {
  Object.keys(props).forEach((key) => {
    if (key !== "children") {
      dom[key] = props[key];
    }
  });
}

// 初始化子节点
/**
 * 初始化子fiber对象
 * @param {Object} fiber - 父fiber对象
 * @param {Array} children - 子节点数组
 */
function initChildren(fiber, children) {
  let prvChild = null;
  children.forEach((child, index) => {
    /**
     * 创建新的fiber对象
     * @type {string} child.type - 类型
     * @type {Object} child.props - 属性对象
     * @property {string} 新fiber对象的父fiber
     * @property {Object} 新fiber对象的子fiber
     * @property {Object} 新fiber对象的兄弟fiber
     * @property {Object} 新fiber对象的DOM节点
     */
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
 * 更新函数组件
 * 
 * @param {Object} fiber - Fiber对象
 */
function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  initChildren(fiber, children);
}

function updateHostComponent(fiber) {
  // 如果fiber没有关联的dom节点
  if (!fiber.dom) {
    // 创建一个新的dom节点
    const dom = (fiber.dom = createDom(fiber.type));
    // 更新dom节点的属性
    updateProps(dom, fiber.props);
  }
  // 获取子元素
  const children = fiber.props.children;
  // 初始化子元素
  initChildren(fiber, children);
}
/**
 * 函数：performWorkOfUnit
 * 描述：用于渲染节点的函数
 * 参数：
 * - fiber：fiber对象，包含节点的信息
 */
function performWorkOfUnit(fiber) {
  /**
   * 变量：isFunctionComponent
   * 类型：boolean
   * 描述：判断fiber.type是否为函数节点
   */
  const isFunctionComponent = typeof fiber.type === "function";
  /**
   * 判断不是函数节点且fiber.dom不存在时，创建dom节点并更新属性
   */
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

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
