module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind's jsxImportSource + Reanimated/Worklets plugin are wired in
      // automatically by babel-preset-expo — no manual plugins needed.
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
