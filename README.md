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
  // plugins: [
  //   'react',
  // ],
  parser: '/Users/tinhtran/.nvm/versions/node/v16.13.2/lib/node_modules/@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
    },
    sourceType: 'module',
    requireConfigFile: false,
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
    'no-unused-vars': 'warn',
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
  code 
  code /home/itrvn/.eslintrc.js 
  which node
  npx  install-peerdeps -g eslint-config-airbnb
  npm i -g babel-eslint // npm i -g @babel/eslint-parser
  which node
  npm ls -g eslint-config-airbnb
  ls
  ls ~
  ls
  ls ~
  ls ~ -la
  which node
  ln -s **/home/itrvn/.nvm/versions/node/v14.16.1/lib/node_modules/** ~/
  ls ~ -la
  history
  ```
