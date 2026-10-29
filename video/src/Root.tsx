import {Composition} from 'remotion';
import {IcebergShort, DURATION_FRAMES} from './iceberg/Main';
import {FPS} from './iceberg/timing';

export const Root = () => (
  <Composition id="Iceberg" component={IcebergShort} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} />
);
