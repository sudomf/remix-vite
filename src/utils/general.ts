import path from 'path';
import { readConfig } from '@remix-run/dev/dist/config';
import { normalizePath as viteNormalizePath } from 'vite';
import { getRouteModuleExports } from '@remix-run/dev/dist/compiler/routeExports';
import type { RemixConfig } from '@remix-run/dev/dist/config';

type Route = RemixConfig['routes'][string];

export const getRemixConfig = async () => {
  const config = await readConfig();
  return config;
};

export const getRemixRouteModuleExports = async (routeId: string) => {
  const config = await getRemixConfig();
  return getRouteModuleExports(config, routeId);
};

export const getVirtualModuleUrl = (id: string) => `/@id/__x00__virtual:${id}`;

export const normalizePath = (p: string) => {
  return viteNormalizePath(toUnixPath(p));
};

export const createVirtualModule = (name: string, code: string) => {
  const virtualModuleId = `virtual:${name}`;
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  return {
    virtualModuleId,
    resolvedVirtualModuleId,
    code,
  };
};

export const getAppDirName = (config: RemixConfig) => {
  return path.relative(process.cwd(), config.appDirectory);
};

export const resolveAppRelativeFilePath = (
  file: string,
  config: RemixConfig,
) => {
  const appDir = getAppDirName(config);
  return path.resolve(process.cwd(), appDir, file);
};

export const resolveRelativeRouteFilePath = (
  route: Route,
  config: RemixConfig,
) => {
  const file = route.file;
  const fullPath = resolveAppRelativeFilePath(file, config);

  return normalizePath(fullPath);
};

export const resolveFSPath = (filePath: string) => {
  return `/@fs${normalizePath(filePath)}`;
};

export const getRouteByFilePath = async (filePath: string) => {
  const routesByFile = await getRoutesByFile();
  return routesByFile.get(normalizePath(filePath));
};

export const getRoutesByFile = async () => {
  const config = await getRemixConfig();

  const routesByFile: Map<string, Route> = Object.keys(config.routes).reduce(
    (map, key) => {
      const route = config.routes[key]!;
      const file = resolveRelativeRouteFilePath(route, config);
      map.set(file, route);
      return map;
    },
    new Map<string, Route>(),
  );

  return routesByFile;
};

const toUnixPath = (p: string) =>
  // eslint-disable-next-line prefer-named-capture-group
  p.replace(/[\\/]+/g, '/').replace(/^([a-zA-Z]+:|\.\/)/, '');
