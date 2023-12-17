import { Database } from 'bun:sqlite';
import serializePropTypes from '@drupal-jsx/serialize-prop-types';
import { kebabCasePreserveDoubleDash } from "@drupal-jsx/drupal-utils";
import path from 'node:path';
import pascalCase from 'just-pascal-case';

export async function exportPropTypes(componentFileNamesAsyncIterable, outDir) {
  const cwd = process.cwd();
  const modulePaths = {};
  for await (const file of componentFileNamesAsyncIterable) {
    const tagName = kebabCasePreserveDoubleDash(path.basename(file, '.jsx'));
    modulePaths[tagName] = `${cwd}/${file}`;
  }

  const propTypes = await serializePropTypes(modulePaths);

  console.log("Generating *.template-info.json files for Drupal...");
  for (const tagName in propTypes) {
    if (tagName.startsWith('drupal-') && propTypes[tagName]) {
      const drupalTemplateName = tagName.substring(7);
      const drupalTemplateFileName = `${outDir}/${drupalTemplateName}.template-info.json`;
      await Bun.write(drupalTemplateFileName, JSON.stringify({ props: propTypes[tagName] }));
      console.log(drupalTemplateFileName);
    }
  }
}

export function pascalCasePreserveDoubleDash(str) {
  return str.split('--').map(pascalCase).join('--');
}

export function componentFileNameFromTwigTemplateName(twigName) {
  return pascalCasePreserveDoubleDash('drupal-' + path.basename(twigName, '.html.twig')) + '.jsx';
}

export function invalidateThemeRegistry(themeName, options) {
  console.log(`Invalidating Drupal theme registry for ${themeName}`);
  if (options.sqlitePath) {
    const db = new Database(options.sqlitePath);
    db.query('DELETE FROM cache_default WHERE cid=:cid').run({':cid': `theme_registry:${themeName}`});
    db.query('DELETE FROM cache_bootstrap WHERE cid=:cid').run({':cid': `theme_registry:runtime:${themeName}`});
    db.query('INSERT INTO cachetags(tag, invalidations) VALUES("rendered", 1) ON CONFLICT(tag) DO UPDATE SET invalidations=invalidations+1').run();
  }
  else if (options.drushPath) {
    return Promise.all(['theme-registry', 'render'].map(
      (type) => Bun.spawn([options.drushPath, 'cache:clear', type]).exited
    ));
  }
}
