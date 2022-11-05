import path from 'path';
import type { RemixConfig } from '@remix-run/dev/dist/config';

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
