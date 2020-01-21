const fs = require('fs');
const semver = require('semver');
const svgTransformer = require('react-native-svg-transformer');

const getUpstreamTransformer = () => {
  const reactNativeVersionString = require('react-native/package.json').version;
  const reactNativeMinorVersion = semver(reactNativeVersionString).minor;

  if (reactNativeMinorVersion >= 59) {
    return require('metro-react-native-babel-transformer');
  } else if (reactNativeMinorVersion >= 56) {
    return require('metro/src/reactNativeTransformer');
  } else if (reactNativeMinorVersion >= 52) {
    return require('metro/src/transformer');
  } else if (reactNativeMinorVersion >= 47) {
    return require('metro-bundler/src/transformer');
  } else if (reactNativeMinorVersion === 46) {
    return require('metro-bundler/build/transformer');
  } else {
    // handle RN <= 0.45
    var oldUpstreamTransformer = require('react-native/packager/transformer');
    return {
      transform({ src, filename, options }) {
        return oldUpstreamTransformer.transform(src, filename, options);
      },
    };
  }
};

module.exports.transform = function(src, filename, options) {
  if (typeof src === 'object') {
    // handle RN >= 0.46
    ({ src, filename, options } = src);
  }

  if (filename.endsWith('.svg') || filename.endsWith('.svgx')) {
    return svgTransformer.transform(src, filename, options);
  }

  const upstreamTransformer = getUpstreamTransformer();

  if (filename.endsWith('png') || filename.endsWith('jpg')) {
    const mimeType = `image/${filename.split('.')[1]}`;
    const imageContent = fs.readFileSync(filename);
    const imageContentBase64 = new Buffer(imageContent).toString('base64');
    const imageJSModuleSource =
      'module.exports = ' +
      JSON.stringify({ uri: `data:${mimeType};base64,${imageContentBase64}` }) +
      ';';

    return upstreamTransformer.transform({ src: imageJSModuleSource, filename, options });
  }

  return upstreamTransformer.transform({ src, filename, options });
};
