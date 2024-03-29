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

let nextWorkOfUnit = {};
let wipRoot = null;
let currentRoot = null;
let deletions = [];
let wipFiber = null;
// 渲染函数
function render(el, container) {
  // 将 el 元素作为子元素，将 container 元素作为容器，创建 nextWorkOfUnit 对象
  wipRoot = {
    dom: container,
    props: {
      children: [el],
    },
  };
  nextWorkOfUnit = wipRoot;
}

// 工作循环函数
function workLoop(deadline) {
  // 工作循环函数，用于不断执行任务直至满足条件
  let shouldDeadline = false; // 初始化一个变量用于判断是否需要满足截止时间
  while (!shouldDeadline && nextWorkOfUnit) {
    // 循环执行任务，直到满足截止时间条件或者没有任务可执行
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit); // 使用任务处理函数处理当前任务对象
    if (wipRoot?.sibling?.type === nextWorkOfUnit?.type) {
      nextWorkOfUnit = undefined;
    }
    shouldDeadline = deadline.timeRemaining() < 1; // 判断当前任务的截止时间是否小于1
  }
  if (!nextWorkOfUnit && wipRoot) {
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
  deletions.forEach(commitDeletions);
  commitWork(wipRoot.child);
  commitEffectHooks();
  currentRoot = wipRoot;
  wipRoot = null;
  deletions = [];
}

function commitEffectHooks() {
  // 开始执行effectHooks的回调函数
  function run(fiber) {
    if (!fiber) return;

    if (!fiber.alternate) {
      // 初始化effectHooks的cleanup方法
      fiber.effectHooks?.forEach((hook) => {
        hook.cleanup = hook.callback();
      });
    } else {
      // 更新effectHooks的cleanup方法
      fiber.effectHooks?.forEach((newHooks, index) => {
        if (newHooks.deps.length > 0) {
          const oldHooks = fiber.alternate?.effectHooks[index];
          const needUpdate = oldHooks.deps.some((olDep, idx) => {
            return olDep !== newHooks.deps[idx];
          });
          needUpdate && (newHooks.cleanup = newHooks.callback());
        }
      });
    }
    // 递归执行run函数
    run(fiber.child);
    run(fiber.sibling);
  }

  // 执行effectHooks的cleanup方法
  function runCleanup(fiber){
    // 如果fiber为空，直接返回
    if (!fiber) return;
    // 如果fiber的alternate属性存在，且effectHooks属性存在
    fiber.alternate?.effectHooks?.forEach(hook=>{
      // 如果hook的deps数组长度大于0
      if (hook.deps.length > 0) {
        // 如果hook有cleanup方法，则执行cleanup方法
        hook.cleanup && hook.cleanup();
      }
    })
    // 递归执行runCleanup方法，传入fiber的child属性作为参数
    runCleanup(fiber.child);
    // 递归执行runCleanup方法，传入fiber的sibling属性作为参数
    runCleanup(fiber.sibling);
  }

  // 开始执行effectHooks的回调函数
  runCleanup(wipRoot);
  run(wipRoot);
}

function commitDeletions(fiber) {
  if (fiber.dom) {
    // 初始化fiber的父级节点
    let fiberParent = fiber.parent;

    // 循环找到有dom节点的父级节点
    while (!fiberParent.dom) {
      fiberParent = fiberParent.parent;
    }
    fiberParent.dom.removeChild(fiber.dom);
  } else {
    commitDeletions(fiber.child);
  }
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

  // 如果fiber的effectTag为'update'，则更新fiber的dom节点的属性
  if (fiber.effectTag === "update") {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props);
  }
  // 如果fiber的effectTag为'placement'，则将fiber的dom节点添加到fiber的父级节点中
  else if (fiber.effectTag === "placement") {
    if (fiber.dom) {
      fiberParent.dom.append(fiber.dom);
    }
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
 * 更新属性
 * @param {Object} dom - DOM元素
 * @param {Object} nextProps - 新的属性
 * @param {Object} prvProps - 旧的属性
 */
function updateProps(dom, nextProps, prvProps) {
  Object.keys(prvProps).forEach((key) => {
    if (key !== "children") {
      // 排除children属性
      if (!(key in nextProps)) {
        // 如果新属性中不存在该键
        dom.removeAttribute(key); // 移除该属性
      }
    }
  });
  Object.keys(nextProps).forEach((key) => {
    if (key !== "children") {
      // 排除children属性
      if (nextProps[key] !== prvProps[key]) {
        // 如果新旧属性值不相同
        if (key.startsWith("on")) {
          // 如果属性名以"on"开头
          const eventType = key.slice(2).toLowerCase(); // 获取事件类型
          dom.removeEventListener(eventType, prvProps[key]); // 移除事件监听器
          dom.addEventListener(eventType, nextProps[key]); // 添加事件监听器
        } else {
          dom[key] = nextProps[key]; // 更新属性值
        }
      }
    }
  });
}

/**
 * 初始化子fiber对象
 * @param {Object} fiber - 当前fiber对象
 * @param {Array} children - 子子fiber对象数组
 */
function reconcileChildren(fiber, children) {
  let prvChild = null; // 上一个子fiber对象
  let oldFiber = fiber.alternate?.child; // 备用fiber对象

  children.forEach((child, index) => {
    // 遍历子fiber对象数组
    const isSameType = oldFiber && oldFiber.type === child.type; // 判断是否为相同类型
    let newFiber = null; // 创建新的fiber对象

    if (isSameType) {
      // 如果是相同类型
      newFiber = {
        type: child.type, // 设置fiber类型为子fiber类型
        props: child.props, // 设置fiber属性为子fiber属性
        parent: fiber, // 设置fiber父fiber为当前fiber
        child: null, // 设置fiber子fiber为null
        sibling: null, // 设置fiber兄弟fiber为null
        dom: oldFiber.dom, // 设置fiber的dom为备选fiber的dom
        effectTag: "update", // 设置fiber效果标签为"update"
        alternate: oldFiber, // 设置fiber备选fiber为备选fiber
      };
    } else {
      if (child) {
        // 如果不是相同类型
        newFiber = {
          type: child.type, // 设置fiber类型为子fiber类型
          props: child.props, // 设置fiber属性为子fiber属性
          parent: fiber, // 设置fiber父fiber为当前fiber
          child: null, // 设置fiber子fiber为null
          sibling: null, // 设置fiber兄弟fiber为null
          dom: null, // 设置fiber的dom为null
          effectTag: "placement", // 设置fiber效果标签为"placement"
        };
      }
      if (oldFiber) {
        deletions.push(oldFiber); // 将备选fiber添加到删除数组
      }
    }

    if (oldFiber) {
      // 如果备选fiber存在
      oldFiber = oldFiber.sibling; // 将备选fiber指向下一个fiber
    }
    if (index === 0) {
      // 如果是第一个子fiber
      fiber.child = newFiber; // 设置当前fiber的子fiber为新fiber
    } else {
      prvChild.sibling = newFiber; // 设置前一个子fiber的兄弟fiber为新fiber
    }
    if (newFiber) {
      prvChild = newFiber; // 更新前一个子fiber为新fiber
    }
  });

  while (oldFiber) {
    deletions.push(oldFiber); // 将备选fiber添加到删除数组
    oldFiber = oldFiber.sibling;
  }
}

/**
 * 更新函数组件
 *
 * @param {Object} fiber - Fiber对象
 */
function updateFunctionComponent(fiber) {
  stateHooks = [];
  stateHookIndex = 0;
  effectHooks = [];
  wipFiber = fiber;
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  // 如果fiber没有关联的dom节点
  if (!fiber.dom) {
    // 创建一个新的dom节点
    const dom = (fiber.dom = createDom(fiber.type));
    // 更新dom节点的属性
    updateProps(dom, fiber.props, {});
  }
  // 获取子元素
  const children = fiber.props.children;
  // 初始化子元素
  reconcileChildren(fiber, children);
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

function update() {
  const currentFiber = wipFiber;
  return () => {
    // 将 el 元素作为子元素，将 container 元素作为容器，创建 nextWorkOfUnit 对象
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
    nextWorkOfUnit = wipRoot;
  };
}

let stateHooks = [];
let stateHookIndex = 0;
/**
 * useState(initialState)函数用于在当前fiber中创建一个新的stateHook。
 * @param {any} initialState - 初始状态值
 * @returns {Array} - 返回包含当前状态和setState方法的数组
 */
function useState(initialState) {
  const currentFiber = wipFiber;
  const oldHooks = currentFiber.alternate?.stateHooks[stateHookIndex];
  const stateHook = {
    state: oldHooks ? oldHooks.state : initialState,
    queue: oldHooks ? oldHooks.queue : [],
  };
  // 执行stateHook.queue中的所有action，更新stateHook.state
  stateHook.queue.forEach((action) => {
    stateHook.state = action(stateHook.state);
  });
  stateHook.queue = [];
  stateHookIndex++;
  stateHooks.push(stateHook);
  currentFiber.stateHooks = stateHooks;

  /**
   * setState(actions)函数用于更新stateHook.state。
   * @param {Function|Object} actions - 更新状态的函数或要更新的状态对象
   */
  function setState(actions) {
    const isFunction = typeof actions === "function";
    const eagerState = isFunction ? actions(stateHook.state) : actions;
    if (eagerState === stateHook.state) return;
    // 将action添加到stateHook.queue中
    stateHook.queue.push(isFunction ? actions : () => actions);
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
    nextWorkOfUnit = wipRoot;
  }

  return [stateHook.state, setState];
}

let effectHooks = [];
function useEffect(callback, deps) {
  // 创建一个effectHook对象，包含callback、deps和cleanup属性
  const effectHook = {
    callback,
    deps,
    cleanup: undefined,
  };
  // 将effectHook添加到effectHooks数组中
  effectHooks.push(effectHook);
  // 将effectHooks赋值给wipFiber的effectHooks属性
  wipFiber.effectHooks = effectHooks;
}

const React = {
  render,
  createElement,
  update,
  useState,
  useEffect,
};
export default React;
