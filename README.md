# Sample for analyzer and code fix for TypeScript

This project shows how to change the TypeScript code using Visual Editors such
as Visual Studio Code and the TypeScript compiler.

## Building and Running

Run `npm run build`, cd to an TypeScript project,
and add to the `tsconfig.json` file:

```json5
{
  "compilerOptions": {
    "plugins": [{
      "name": "<path to this project>"
    }],
    // other config
```

Then, on any TypeScript file, add a const that is later changed, like so:

```typescript
const n = 1;
n = 2;
```

The compiler will complain. You will then see a refactoring to fix the code when
you position your cursor on top of the `n` variable, changing the `const` to a `let`.

### Unit Testing

`npm test` will run the unit tests, using Jest as a runner and test framework.

### Publishing

To publish, simply do:

```bash
npm run build
npm publish
```

## Author

[Giovanni Bassi](https://github.com/giggio)

## License

Licensed under the Apache License, Version 2.0.
