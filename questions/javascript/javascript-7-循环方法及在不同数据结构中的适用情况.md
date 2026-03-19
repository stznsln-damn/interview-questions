# JavaScript 中循环的常见方法与在不同数据结构中的适用情况

## 核心要点

- **语句类**：for（下标与控制）、for...of（可迭代对象的值）、for...in（对象可枚举键）、while/do...while；for 与 for...of 支持 break/continue，适合需要提前退出的场景。
- **数组方法**：forEach、map、filter、reduce、some、every、find 等，适合数组的顺序遍历与转换；不能 break，提前结束可用 some/every/find 或 for/for...of。
- **按结构选**：数组用 for/for...of/forEach/map 等；对象用 Object.keys/entries + for 或 for...of，for...in 需注意原型；Map/Set 用 for...of 或 forEach；字符串、类数组按需 for/for...of 或先转数组。

## 详细解释

### 常见循环方式

- **for**：按索引循环，可控制起止与步长，需要下标或提前退出时使用。
- **for...of**：遍历可迭代对象的“值”（数组、Set、Map、字符串等），支持 break/continue。
- **for...in**：遍历对象可枚举属性名（含原型链），数组不推荐；只处理自身属性时配合 Object.hasOwn 或 Object.keys。
- **while / do...while**：条件循环，与数据结构形式无关。
- **forEach、map、filter、reduce、some、every、find**：数组（及部分类数组）上的方法，回调风格；map/filter/reduce 返回新值或新数组，some/every/find 可提前结束。

### 按数据结构适用情况

| 数据结构        | 推荐方式                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------- |
| 数组            | for、for...of、forEach、map、filter、reduce、some、every、find；要下标或退出用 for/for...of。 |
| 对象            | Object.keys/values/entries + for 或 for...of；for...in 需 hasOwn。                            |
| Map/Set         | for...of、forEach；Map 默认迭代 entries。                                                     |
| 字符串          | for、for...of（按字符）。                                                                     |
| NodeList/类数组 | for、for...of，或 Array.from 后用数组方法。                                                   |

### 注意点

- 需要 break/continue 或从外层 return 时用 for 或 for...of，不用 forEach。
- 对象遍历要区分自身与继承，用 Object.keys 或 for...in + hasOwn。
- forEach/map 中 async 不会按顺序等待，顺序异步用 for/for...of + await。

## 总结

1. 语句：for、for...of、for...in、while/do...while；数组方法：forEach、map、filter、reduce、some、every、find。
2. 按结构选：数组全面支持语句+方法；对象用 keys/entries + for 或 for...of；Map/Set 用 for...of 或 forEach；字符串、类数组按需选择或先转数组。
3. 选型看是否需要下标、提前退出、转换/归并、是否遍历对象键。
