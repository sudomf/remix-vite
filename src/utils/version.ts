import fetch from 'cross-fetch';
import pkg from '../../package.json';

export const checkVersion = async () => {
  const res = await fetch(`https://registry.npmjs.org/${pkg.name}`);
  const data = await res.json();
  const latestVersion = data['dist-tags'].latest as string;

  if (latestVersion !== pkg.version) {
    // eslint-disable-next-line no-console
    console.warn(
      '\x1b[33m%s\x1b[0m', // yellow
      `
Your version of ${pkg.name} is out of date.
Latest version is ${latestVersion}, but you have ${pkg.version}.

Please upgrade by running:

npm install -D ${pkg.name}@latest 
  or 
yarn add -D ${pkg.name}@latest

`,
    );
  }
};
