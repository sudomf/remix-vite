/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { types as BabelTypes } from '@babel/core';

export const filterExports = (
  id: string,
  source: string,
  exports: string[],
) => {
  const document = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  traverse(document, {
    ExportNamedDeclaration: (path) => {
      removeExports(path, exports);
    },
  });

  return {
    code: generate(document).code,
    map: null,
  };
};

function removeExports(
  path: NodePath<BabelTypes.ExportNamedDeclaration>,
  exports: string[],
) {
  const shouldRemoveExport = (exportName: string) =>
    !exports.includes(exportName);

  const specifiers = path.get(
    'specifiers',
  ) as NodePath<BabelTypes.ExportSpecifier>[];

  if (specifiers.length) {
    specifiers.forEach((specifier) => {
      const name = t.isIdentifier(specifier.node.exported)
        ? specifier.node.exported.name
        : specifier.node.exported.value;
      if (shouldRemoveExport(name)) {
        specifier.remove();
      }
    });

    if (path.node.specifiers.length < 1) {
      path.remove();
    }
    return;
  }

  const declaration = path.get('declaration') as NodePath<
    BabelTypes.FunctionDeclaration | BabelTypes.VariableDeclaration
  >;
  if (!declaration.node) {
    return;
  }

  switch (declaration.node.type) {
    case 'FunctionDeclaration': {
      const name = declaration.node.id!.name;
      if (shouldRemoveExport(name)) {
        path.remove();
      }
      break;
    }
    case 'VariableDeclaration': {
      const inner = declaration.get(
        'declarations',
      ) as NodePath<BabelTypes.VariableDeclarator>[];
      inner.forEach((d) => {
        if (d.node.id.type !== 'Identifier') {
          return;
        }
        const name = d.node.id.name;
        if (shouldRemoveExport(name)) {
          d.remove();
        }
      });
      break;
    }
    default: {
      break;
    }
  }
}

/* The original injected code from react-refresh checks if all exports are likely
 components. AS we can have more than just components in a route file, we will
 replace the injected code with a patched version that only checks id it has at least
 one component.
*/
export const fixHmrCode = (_id: string, source: string) => {
  const document = parse(source, {
    sourceType: 'module',
  });

  const newAst = parse(hmrCodePatch, {
    sourceType: 'module',
  }).program.body;

  traverse(document, {
    IfStatement(path) {
      const { node } = path;
      const code = generate(node).code;

      if (
        code.includes('import.meta.hot') &&
        code.includes('window.$RefreshReg$ = prevRefreshReg;')
      ) {
        const consequent = node.consequent as BabelTypes.BlockStatement;
        consequent.body = newAst;
      }
    },
  });

  return {
    code: generate(document).code,
  };
};

const hmrCodePatch = `
  let isReactRefreshBoundary = function(mod) {
    if (mod == null || typeof mod !== "object") {
      return false;
    }
    let hasExports = false;
    let hasAtLeastOneComponent = true;
    for (const exportName in mod) {
      hasExports = true;
      if (exportName === "__esModule") {
        continue;
      }
      const desc = Object.getOwnPropertyDescriptor(mod, exportName);
      if (desc && desc.get) {
        return false;
      }
      const exportValue = mod[exportName];
      if (RefreshRuntime.isLikelyComponentType(exportValue)) {
        hasAtLeastOneComponent = true;
      }
    }
    return hasExports && hasAtLeastOneComponent;
  };
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
  import.meta.hot.accept((mod) => {
    if (isReactRefreshBoundary(mod)) {
      if (!window.__vite_plugin_react_timeout) {
        window.__vite_plugin_react_timeout = setTimeout(() => {
          window.__vite_plugin_react_timeout = 0;
          RefreshRuntime.performReactRefresh();
        }, 30);
      }
    } else {
      import.meta.hot.invalidate();
    }
  });`;
