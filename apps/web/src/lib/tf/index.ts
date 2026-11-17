export { TfTree } from './TfTree';
export { compose, interpolate, invert, rotate, yawOf, IDENTITY, type Transform } from './transform';
export { stampToSeconds } from './TfTree';
export { trajectoryFromTf, type TimedTf, type TrajectoryPoint } from './trajectory';

/** Tópicos padrão do ROS 2 com a árvore de transformações. */
export const TF_TOPICS = { dynamic: '/tf', static: '/tf_static' } as const;
