#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main.ts
var import_express = __toESM(require("express"));
var import_vite = require("vite");
var import_express2 = require("@remix-run/express");
var import_dotenv = require("dotenv");
var import_plugin_react = __toESM(require("@vitejs/plugin-react"));
var import_vite_tsconfig_paths = __toESM(require("vite-tsconfig-paths"));

// src/plugins/remix.ts
var import_config = require("@remix-run/dev/dist/config");
var import_jsesc = __toESM(require("jsesc"));
var import_routeExports = require("@remix-run/dev/dist/compiler/routeExports");

// src/utils.ts
var import_path = __toESM(require("path"));
var getVirtualModuleUrl = (id) => `/@id/__x00__virtual:${id}`;
var createVirtualModule = (name, code) => {
  const virtualModuleId = `virtual:${name}`;
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  return {
    virtualModuleId,
    resolvedVirtualModuleId,
    code
  };
};
var getAppDirName = (config2) => {
  return import_path.default.relative(process.cwd(), config2.appDirectory);
};

// src/constants.ts
var SERVER_ENTRY_ID = "server-entry";
var SERVER_ASSETS_MANIFEST_ID = "server-assets-manifest";
var BROWSER_ASSETS_MANIFEST_ID = "browser-assets-manifest";

// src/plugins/remix.ts
var getRemixPlugin = async () => {
  const config2 = await (0, import_config.readConfig)();
  const manifest = await getAssetManifest(config2);
  const serverEntryJs = getServerEntry(config2);
  const serverEntryVirtualModule = createVirtualModule(
    SERVER_ENTRY_ID,
    serverEntryJs
  );
  const serverManifestVirtualModule = createVirtualModule(
    SERVER_ASSETS_MANIFEST_ID,
    `export default ${(0, import_jsesc.default)(manifest, { es6: true })};`
  );
  const browserManifestVirtualModule = createVirtualModule(
    BROWSER_ASSETS_MANIFEST_ID,
    `window.__remixManifest=${(0, import_jsesc.default)(manifest, { es6: true })};`
  );
  const virtualModules = [
    serverEntryVirtualModule,
    serverManifestVirtualModule,
    browserManifestVirtualModule
  ];
  return {
    name: "vite-plugin-remix",
    enforce: "pre",
    resolveId(id) {
      for (const virtualModule of virtualModules) {
        if (id === virtualModule.virtualModuleId) {
          return virtualModule.resolvedVirtualModuleId;
        }
      }
    },
    load(id) {
      for (const virtualModule of virtualModules) {
        if (id === virtualModule.resolvedVirtualModuleId) {
          return virtualModule.code;
        }
      }
    }
  };
};
var getServerEntry = (config2) => {
  const appDirName = getAppDirName(config2);
  return `
  import * as entryServer from ${JSON.stringify(
    `./${appDirName}/${config2.entryServerFile}`
  )};
  ${Object.keys(config2.routes).map((key, index) => {
    const route = config2.routes[key];
    return `import * as route${index} from ${JSON.stringify(
      `./${appDirName}/${route.file}`
    )};`;
  }).join("\n")}
    export { default as assets } from ${JSON.stringify(
    "virtual:server-assets-manifest"
  )};
    export const assetsBuildDirectory = ${JSON.stringify(
    config2.relativeAssetsBuildDirectory
  )};
    export const publicPath = ${JSON.stringify(config2.publicPath)};
    export const entry = { module: entryServer };
    export const routes = {
      ${Object.keys(config2.routes).map((key, index) => {
    const route = config2.routes[key];
    return `${JSON.stringify(key)}: {
        id: ${JSON.stringify(route.id)},
        parentId: ${JSON.stringify(route.parentId)},
        path: ${JSON.stringify(route.path)},
        index: ${JSON.stringify(route.index)},
        caseSensitive: ${JSON.stringify(route.caseSensitive)},
        module: route${index}
      }`;
  }).join(",\n  ")}
    };`;
};
var getAssetManifest = async (config2) => {
  const routes = {};
  const appDirName = getAppDirName(config2);
  for (const entry of Object.entries(config2.routes)) {
    const [key, route] = entry;
    const sourceExports = await (0, import_routeExports.getRouteModuleExports)(config2, route.id);
    routes[key] = {
      id: route.id,
      parentId: route.parentId,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive,
      module: `/${appDirName}/${route.file}`,
      hasAction: sourceExports.includes("action"),
      hasLoader: sourceExports.includes("loader"),
      hasCatchBoundary: sourceExports.includes("CatchBoundary"),
      hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
      imports: []
    };
  }
  return {
    url: getVirtualModuleUrl(BROWSER_ASSETS_MANIFEST_ID),
    version: Math.random(),
    entry: {
      module: `/${appDirName}/${config2.entryClientFile}`,
      imports: []
    },
    routes
  };
};

// src/plugins/transform.ts
var import_path2 = __toESM(require("path"));
var import_routeExports2 = require("@remix-run/dev/dist/compiler/routeExports");
var import_config2 = require("@remix-run/dev/dist/config");
var import_ts_morph = require("ts-morph");
var getTransformPlugin = async () => {
  const config2 = await (0, import_config2.readConfig)();
  const appDir = getAppDirName(config2);
  const project = new import_ts_morph.Project({
    skipAddingFilesFromTsConfig: true,
    skipLoadingLibFiles: true,
    useInMemoryFileSystem: true
  });
  const resolveRouteFile = (route) => import_path2.default.join(process.cwd(), appDir, route.file);
  const routesByFile = Object.keys(config2.routes).reduce(
    (map, key) => {
      const route = config2.routes[key];
      const file = resolveRouteFile(route);
      map.set(file, route);
      return map;
    },
    /* @__PURE__ */ new Map()
  );
  return {
    name: "vite-plugin-remix-sanitize",
    enforce: "pre",
    async transform(source, id, options) {
      let code = source;
      const route = routesByFile.get(id);
      if (!route)
        return code;
      if (route.id === "root") {
        code = patchRoot(code);
      }
      if (options == null ? void 0 : options.ssr) {
        return code;
      }
      const theExports = await (0, import_routeExports2.getRouteModuleExports)(config2, route.id);
      const serverExports = theExports.filter(
        (e) => !browserSafeRouteExports[e]
      );
      const frontendExports = theExports.filter(
        (name) => !serverExports.includes(name)
      );
      if (frontendExports.length > 0) {
        const sourceFile = project.createSourceFile(id, code, {
          overwrite: true
        });
        const exportMap = sourceFile.getExportedDeclarations();
        [...exportMap.keys()].forEach((name) => {
          var _a;
          if (!frontendExports.includes(name)) {
            (_a = exportMap.get(name)) == null ? void 0 : _a.forEach((declaration) => {
              declaration.replaceWithText("");
            });
          }
        });
        const sanitizedCode = sourceFile.getFullText();
        return sanitizedCode;
      }
      return code;
    }
  };
};
var browserSafeRouteExports = {
  CatchBoundary: true,
  ErrorBoundary: true,
  default: true,
  handle: true,
  links: true,
  meta: true,
  unstable_shouldReload: true
};
var patchRoot = (code) => {
  return code.replace(/<LiveReload.*?\/>/, "").replace(/<Scripts.*\/>/, viteScripts);
};
var viteScripts = `
<script type="module" src="/@vite/client" />
<script
  type="module"
  dangerouslySetInnerHTML={{
    __html: \`import RefreshRuntime from '/@react-refresh'
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true\`,
  }}
/>
<Scripts />
`;

// src/main.ts
(0, import_dotenv.config)();
var mode = "development";
async function createServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.static("public", { maxAge: "1h" }));
  const remixPlugin = await getRemixPlugin();
  const remixTransformPlugin = await getTransformPlugin();
  const vite = await (0, import_vite.createServer)({
    server: { middlewareMode: true },
    plugins: [
      (0, import_vite_tsconfig_paths.default)(),
      remixPlugin,
      remixTransformPlugin,
      (0, import_plugin_react.default)({
        include: "**/*.tsx"
      })
    ].filter(Boolean),
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.all("*", async (req, res, next) => {
    try {
      const build = await vite.ssrLoadModule(
        `virtual:${SERVER_ENTRY_ID}`
      );
      const handler = (0, import_express2.createRequestHandler)({
        build,
        mode
      });
      return handler(req, res, next);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  app.listen(3e3);
}
createServer().then(() => {
  console.log("\u{1F5B2} Remite started at http://localhost:3000");
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
