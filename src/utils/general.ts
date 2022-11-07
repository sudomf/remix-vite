import path from 'path';
import { readConfig } from '@remix-run/dev/dist/config';
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

export const getRoutesByFile = async () => {
  const config = await getRemixConfig();
  const appDir = getAppDirName(config);

  const resolveRouteFile = (route: Route) =>
    path.join(process.cwd(), appDir, route.file);

  const routesByFile: Map<string, Route> = Object.keys(config.routes).reduce(
    (map, key) => {
      const route = config.routes[key]!;
      const file = resolveRouteFile(route);
      map.set(file, route);
      return map;
    },
    new Map<string, Route>(),
  );

  return routesByFile;
};
