This is your **TypeScript Interview Cheat Sheet**. It is structured for high-speed revision, focusing on the "why" behind each feature and the specific syntax that interviewers look for.

---

# 🚀 TypeScript Interview Revision Guide

## 1. The Core Fundamentals
**Why TS?** Static typing catches bugs at compile-time rather than runtime.
* **Type Inference:** TS guesses the type if you don't provide one (e.g., `let x = 10` is inferred as `number`).
* **The `any` vs `unknown` rule:**
    * `any`: Turns off type checking (Avoid this!).
    * `unknown`: Safer than `any`. You must "type check" or narrow the variable before using it.

```typescript
let value: unknown = "Hello";
// value.toUpperCase(); // ❌ Error: Object is of type 'unknown'

if (typeof value === "string") {
  console.log(value.toUpperCase()); // ✅ Success: Narrowed to string
}
```

---

## 2. Functions & Void vs. Never
* **`void`:** The function finishes but returns nothing (e.g., a log).
* **`never`:** The function never reaches the end (throws an error or infinite loop).

```typescript
const logMessage = (msg: string): void => console.log(msg);

const throwFatal = (msg: string): never => {
  throw new Error(msg);
};
```

---

## 3. Interface vs. Type Alias (🔥 Top Interview Question)
| Feature | **Interface** | **Type Alias** |
| :--- | :--- | :--- |
| **Best For** | Defining object shapes/API contracts. | Unions, Primitives, Intersections. |
| **Extending** | `interface B extends A` | `type B = A & { ... }` (Intersection) |
| **Merging** | **Yes!** (Declaration Merging). | **No.** (Unique name required). |

> **Interview Tip:** Use **Interface** for public APIs (so others can extend/merge them) and **Type** for complex logic or unions.

---

## 4. Generics (`<T>`)
Generics allow you to create reusable "blueprints" where the type is passed in like a variable.

```typescript
interface ServerResponse<T> {
  data: T;
  status: number;
}

const userRes: ServerResponse<{ name: string }> = {
  data: { name: "Rahul" },
  status: 200
};
```

---

## 5. Type Narrowing (Defensive Coding)
Narrowing is how you handle Union types (e.g., `string | number`).
* **`typeof`**: For primitives (string, number, boolean).
* **`Array.isArray()`**: For arrays.
* **`in` operator**: Checking if a property exists in an object.

---

## 6. Utility Types (The "Cheat Codes")
Modify existing types without rewriting them.

| Utility | Result |
| :--- | :--- |
| `Partial<T>` | Makes all properties in T **optional**. |
| `Required<T>` | Makes all properties in T **mandatory**. |
| `Pick<T, 'k1' | 'k2'>` | Creates a type with **only** selected keys. |
| `Omit<T, 'k1'>` | Creates a type **without** the selected keys. |
| `Record<K, V>` | Creates a "Map/Dictionary" structure. |

---

## 7. React + TypeScript
* **Props:** Always define an interface for component props.
* **Events:** * Input change: `React.ChangeEvent<HTMLInputElement>`
    * Form Submit: `React.FormEvent`

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
}

const Button = ({ label, onClick }: ButtonProps) => (
  <button onClick={onClick}>{label}</button>
);
```

---

## ❓ Common Interview Questions (Flashcard Style)

**Q: What is "Exhaustive Checking"?**
**A:** Using the `never` type in the `default` case of a switch block to ensure every possible value of a Union type has been handled. If a new value is added to the union later, TS will throw a compile error.

**Q: What is a "Discriminated Union"?**
**A:** A pattern where every object in a union has a common property (usually called `kind` or `type`) with a literal value. This makes type narrowing very easy for the compiler.

**Q: Does TypeScript exist at runtime?**
**A:** No. TypeScript is "erased" during compilation. The browser only runs standard JavaScript.

**Q: What is the difference between `null` and `undefined` in TS?**
**A:** `undefined` means a variable has been declared but not yet assigned a value. `null` is an intentional assignment representing "no value." In TS, they are distinct types unless `strictNullChecks` is off.

---

## ✅ Pre-Interview Checklist
- [ ] Do I know when to use `interface` vs `type`?
- [ ] Can I explain `Generics` using a real API example?
- [ ] Do I know how to type a React `onChange` event?
- [ ] Can I use `Pick` and `Omit` to transform a type?
- [ ] Do I understand why `Array.isArray()` is used for narrowing instead of `typeof`?
