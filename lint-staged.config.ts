// Keep in sync with `ignorePatterns` in oxlint.config.ts.
const OXLINT_IGNORED = /(^|\/)(app\/components\/ui\/|[^/]+\.d\.ts$)/;

export default {
  '*.{ts,html,css,yaml,json,md}': 'oxfmt',
  '*.{ts,vue}': (files: string[]) => {
    const lintable = files.filter((file) => !OXLINT_IGNORED.test(file));

    return lintable.length > 0 ? [`oxlint ${lintable.join(' ')}`] : [];
  },
};
