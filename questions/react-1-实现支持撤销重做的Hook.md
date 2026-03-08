# 实现一个支持撤销/重做功能的 React Hook，并说明设计思路

## 设计思路

撤销/重做的本质是状态的时间旅行。核心数据结构是 past/present/future 三段式，配合指针控制当前位置。

```text
history:  [S0, S1, S2, S3, S4]
                        ↑
                      present

undo → 回退到 S2
redo → 前进到 S4
set  → 截断 future，追加新状态
```

| 操作          | 行为                                 | 指针变化  |
| ------------- | ------------------------------------ | --------- |
| set(newState) | 丢弃当前指针之后所有状态，追加新状态 | 指向末尾  |
| undo          | 指针后退一步                         | index - 1 |
| redo          | 指针前进一步                         | index + 1 |

## 实现

```tsx
import { useReducer, useCallback } from "react";

function reducer(state, action) {
  const { past, present, future } = state;

  switch (action.type) {
    case "SET":
      return {
        past: [...past, present],
        present: action.newPresent,
        future: [],
      };
    case "UNDO":
      if (past.length === 0) return state;
      return {
        past: past.slice(0, -1),
        present: past[past.length - 1],
        future: [present, ...future],
      };
    case "REDO":
      if (future.length === 0) return state;
      return {
        past: [...past, present],
        present: future[0],
        future: future.slice(1),
      };
    case "RESET":
      return { past: [], present: action.newPresent, future: [] };
    default:
      return state;
  }
}

export function useUndoRedo(initialState) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: initialState,
    future: [],
  });

  const set = useCallback((newPresent) => dispatch({ type: "SET", newPresent }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);
  const reset = useCallback((newPresent) => dispatch({ type: "RESET", newPresent }), []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
```

## 关键设计决策

### 为什么用 useReducer

- past/present/future 三个值联动更新，必须保证原子性
- reducer 是纯函数，便于单独测试
- 避免多个 setState 导致中间状态不一致

### 数据结构选择

三段式 `{ past, present, future }` vs 数组+指针 `{ history, index }`，前者语义更清晰，方便对 past 单独限制长度。

### useCallback 包裹

保证函数引用稳定，避免消费组件不必要的重渲染。

## 生产级增强：Command 模式 + 操作合并

### 快照模式 vs Command 模式

| 特性       | 快照模式         | Command 模式            |
| ---------- | ---------------- | ----------------------- |
| 调用者负担 | 低，只传状态值   | 高，需定义 execute/undo |
| 内存占用   | 大，每步存全量   | 小，只存操作描述        |
| 适用场景   | 简单表单、小状态 | 编辑器、画布、复杂交互  |

Command 模式下调用者需传入 execute/undo 函数，每个操作自描述如何执行和撤销。

### 操作合并机制

合并依赖三个维度的判定：

- **type**：操作类型，只有同类操作才合并（如连续 INPUT 合并，INPUT + MOVE 不合并）
- **targetId**：操作目标，同一目标的同类操作才合并
- **timestamp**：时间窗口，间隔超过阈值则生成新记录（防抖思路）

```ts
function shouldMerge(prev: Command, next: Command, interval: number): boolean {
  if (prev.type !== next.type) return false;
  if (prev.targetId !== next.targetId) return false;
  if (next.timestamp - prev.timestamp > interval) return false;
  return true;
}
```

合并时 undo 取最早的，execute 取最新的——撤销回到最初状态，重做执行最终结果。

### Command 模式完整实现

```ts
import { useRef, useCallback, useState } from "react";

interface Command {
  execute: () => void;
  undo: () => void;
  type: string;
  timestamp: number;
  targetId?: string;
}

export function useCommandHistory(options: { maxHistory?: number; mergeInterval?: number } = {}) {
  const { maxHistory = 50, mergeInterval = 1000 } = options;
  const pastRef = useRef<Command[]>([]);
  const futureRef = useRef<Command[]>([]);
  const [, forceUpdate] = useState(0);

  const push = useCallback(
    (cmd: Command) => {
      const past = pastRef.current;
      const last = past[past.length - 1];
      cmd.timestamp = Date.now();
      cmd.execute();

      if (last && shouldMerge(last, cmd, mergeInterval)) {
        past[past.length - 1] = { ...cmd, undo: last.undo };
      } else {
        past.push(cmd);
        if (past.length > maxHistory) past.shift();
      }
      futureRef.current = [];
      forceUpdate((n) => n + 1);
    },
    [maxHistory, mergeInterval],
  );

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) return;
    const cmd = past.pop()!;
    cmd.undo();
    futureRef.current.unshift(cmd);
    forceUpdate((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) return;
    const cmd = future.shift()!;
    cmd.execute();
    pastRef.current.push(cmd);
    forceUpdate((n) => n + 1);
  }, []);

  return {
    push,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
```

## 总结

1. **核心模型**：past/present/future 三段式，set 时截断 future，undo/redo 在三者间转移状态
2. **选用 useReducer**（快照模式）：保证三者联动更新的原子性，逻辑集中可测试
3. **Command 模式**：调用者传入 execute/undo，适合大状态场景，内存占用小
4. **操作合并**：通过 type + targetId + timestamp 三维判定，实现同类操作在时间窗口内自动合并
5. **useCallback 稳定引用**：避免消费组件不必要的重渲染
