## Install

- install oh-my-zsh
- install node.js 14 sử dụng nvm (node version manager)
- install vscode và các plugin:
- Markdown all in one
- Markdown lint
- ESlint
- Comment Anchors
- GitLens
- Git Graph
- install insomina
- install mongodb version 4.2
- install redis
- rename computer và user

## Configuration Eslint

- Path nodejs using nvm

  ```js
  which node
  # output example:
  # /usr/local/nvm/versions/node/v14.16.0/bin/node
  ```

- Add setting in vscode

  ```js
  "editor.codeActionsOnSave": {
   "source.fixAll.eslint": true
   },
  "eslint.nodePath": "/usr/local/nvm/versions/node/v14.16.0/lib",
  "eslint.runtime": "/usr/local/nvm/versions/node/v14.16.0/bin/node",
  "eslint.options": {
     "configFile": "/usr/local/.eslintrc.js"
   },
   "eslint.format.enable": true,
   "markdownlint.config": {
   "MD013": false,
   "MD007": false,
   "MD024": false,
   "MD033": false,
   "MD036": false
   },
  ```

  - Create file ~/.eslintrc.js

   ```js
  module.exports = {
      env: {
        browser: true,
        commonjs: true,
        es6: true,
        node: true,
        mocha: true,
        jest: true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          experimentalObjectRestSpread: true,
        },
        sourceType: 'module',
        ecmaVersion: 2020,
      },
      globals: {
        logger: true,
        io: true,
      },
      extends: ['airbnb', 'plugin:import/warnings'],
      rules: {
        'no-eval': 1,
        'no-const-assign': 'warn',
        'no-this-before-super': 'warn',
        'no-undef': 'warn',
        'no-unreachable': 'warn',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'constructor-super': 'warn',
        'valid-typeof': 'warn',
        'no-underscore-dangle': 'off',
        'no-nested-ternary': 'off',
        'no-implicit-globals': 'off',
        'prefer-destructuring': ['error', {
          VariableDeclarator: {
            array: false,
            object: true,
          },
          AssignmentExpression: {
            array: false,
            object: false,
          },
        }, {
          enforceForRenamedProperties: false,
        }],
        'no-param-reassign': ['error', { props: false }],
        'no-use-before-define': ['error', { functions: false }],
        'max-len': ['warn', { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true }],
        'object-curly-newline': ['error', { ExportDeclaration: { multiline: true, minProperties: 4 } }],
        'react/prop-types': 'off',
        'react/destructuring-assignment': 'off',
        'import/prefer-default-export': 'off',
        'no-console': ['error', { allow: ['time', 'timeEnd', 'timeLog'] }],
        'arrow-parens': ['error', 'as-needed'],
        // 'object-curly-newline': ['error',  {
        //   // ObjectExpression: { minProperties: 6, consistent: true },
        //   // ObjectPattern: { minProperties: 4, consistent: true },
        //   ImportDeclaration: { minProperties: 4, consistent: true, multiline: true },
        //   ExportDeclaration: { minProperties: 4, consistent: true, multiline: true },
        //   }],
      },
      settings: {
        'import/resolver': {
          node: {
            extensions: [
              '.js',
              '.jsx',
            ],
          },
        },
      },
    };
  ```
  ## Install eslint

  ```js
  npx install-peerdeps -g eslint-config-airbnb@18.2.1
  npm --global install eslint-config-airbnb@18.2.1 eslint@^7.2.0 eslint-plugin-import@^2.22.1 eslint-plugin-jsx-a11y@^6.4.1 eslint-plugin-react@^7.21.5 eslint-plugin-react-hooks@^1.7.0\
  ln -s .nvm/versions/node/v16.14.0/lib/node_modules .
  npm i -g babel-eslint
  ```

### Format .proto

```bash
brew install clang-format
```

- Add setting.json vscode

```js
"clang-format.style": "{ IndentWidth: 2, BasedOnStyle: google, ColumnLimit: 120 }",
"[proto3]": {
"editor.defaultFormatter": "zxh404.vscode-proto3"
}
```
