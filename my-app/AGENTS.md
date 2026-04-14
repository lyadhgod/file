# lyag guidelines

## lyag bash guidelines

- Start scripts with set -euo pipefail when appropriate.
- Quote variables and use "$@" to forward arguments.
- Prefer $(...) over backticks for command substitution.
- Check exit codes for critical commands.
- Avoid eval and unbounded word splitting.


## lyag c guidelines

- Use const and size_t where appropriate for intent and safety.
- Initialize variables; avoid uninitialized reads.
- Check return values for I/O and allocation calls.
- Prefer bounded functions like snprintf to avoid overflow.
- Free resources on all paths to prevent leaks.


## lyag cpp guidelines

- Prefer RAII and smart pointers; avoid raw new/delete.
- Follow the rule of zero and default special members.
- Use const/constexpr to express intent.
- Prefer STL containers and algorithms over manual loops.
- Avoid ownership ambiguity; use references or std::unique_ptr.


## lyag doc-common guidelines

- Always create/edit comments/docstrings based on the programming language to be dealt with be it a file, function or top level variable.
- Use descriptive variable and function names as per the convention of the programming language in use.
- Make sure to modularise the implementation into small enough functions with clear seperated concerns. Do not modularise with sectioned comments but separated functions instead.
- Before making any change see if the functionality asked to do already exists or not from the functions in the same file or not. If there is none only then implement a new function.
- Validate inputs at boundaries and fail fast with clear errors.
- Handle errors explicitly; do not swallow exceptions.
- Prefer pure functions and minimize hidden side effects.
- Avoid duplication; reuse existing helpers and patterns.
- Write tests for new behavior and regressions when feasible.
- Prefer immutable data unless mutability is required.
- Keep dependencies minimal and remove unused ones.
- Optimize only after correctness; avoid premature optimization.


## lyag java guidelines

- Use try-with-resources for closeable resources.
- Avoid null in APIs; use Optional for absence.
- Prefer interfaces over concrete types in signatures.
- Use immutable collections where possible.
- Implement equals, hashCode, and toString consistently.


## lyag javscript guidelines

- Use const/let; avoid var.
- Prefer strict equality (===) over ==.
- Handle promise rejections; use async/await.
- Avoid implicit globals; use modules.
- Validate external data before use.


## lyag kotlin guidelines

- Prefer val over var.
- Avoid !!; use safe calls and let instead.
- Use data classes for immutable data.
- Keep coroutines structured; avoid GlobalScope.
- Use sealed classes for exhaustive when.


## lyag matlab guidelines

- Preallocate arrays before loops.
- Prefer vectorized operations over explicit loops when clear.
- Avoid eval; use function handles instead.
- Use functions instead of scripts for reuse.
- Use clearvars instead of clear all.


## lyag python guidelines

- Avoid mutable default arguments.
- Use type hints for public APIs.
- Prefer context managers for resources.
- Use pathlib for filesystem paths.
- Catch specific exceptions; avoid bare except.


## lyag react guidelines

- If a react component to be worked on is a functional component:
    - All React components must use useReducer hook for state management and not useState.
    - For useReducer hook, the initial state must be a const at the root of the file and not inside the component.
    - Any constant or function that will perform correctly outside a React component must be declared outside a React component.
    - Keep effects minimal; include complete dependency arrays.
    - Avoid derived state; compute from props or reducer state.
    - Use stable keys when rendering lists.


## lyag ruby guidelines

- Prefer each/map over for loops.
- Use safe navigation (&.) for nil handling.
- Avoid monkey patching core classes in shared code.
- Use Bundler and a Gemfile for dependencies.
- Freeze constants and strings when appropriate.


## lyag swift guidelines

- Prefer let and value types like struct.
- Avoid force unwraps; use guard and optional binding.
- Use Codable for serialization where possible.
- Use Result for error propagation.
- Keep UI updates on the main thread.


## lyag typescript guidelines

- Enable strict mode in tsconfig.
- Avoid any; use unknown for untrusted data.
- Use type guards and narrowing for safety.
- Prefer as const for literal inference.
- Keep types aligned with runtime validation.


