import serializePropTypes from '@drupal-jsx/serialize-prop-types';

export async function exportPropTypes(componentsFileOrFileMap, outDir) {
  const propTypes = await serializePropTypes(componentsFileOrFileMap);

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
