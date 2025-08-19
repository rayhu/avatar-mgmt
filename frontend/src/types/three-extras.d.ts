declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { OrbitControls as OC } from 'three/examples/jsm/controls/OrbitControls';
  export const OrbitControls: typeof OC;
}

declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  import { GLTFLoader as GL } from 'three/examples/jsm/loaders/GLTFLoader';
  const GLTFLoader: typeof GL;
  export { GLTFLoader };
  export default GLTFLoader;
}
