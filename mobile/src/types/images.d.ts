/**
 * Ambient types for static image imports. Metro turns `import x from './a.png'`
 * into an asset module reference (a number); expo/RN `Image` sources accept it.
 * `expo/types` only declares CSS modules, so we declare image assets ourselves.
 */
declare module '*.png' {
  const content: number;
  export default content;
}
declare module '*.jpg' {
  const content: number;
  export default content;
}
declare module '*.jpeg' {
  const content: number;
  export default content;
}
declare module '*.webp' {
  const content: number;
  export default content;
}
