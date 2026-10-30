import {Composition} from 'remotion';
import {IcebergShort, DURATION_FRAMES} from './iceberg/Main';
import {FPS} from './iceberg/timing';
import {TrashSun, DURATION_FRAMES as SUN_FRAMES} from './sun/Main';

export const Root = () => (
  <>
    <Composition id="Iceberg" component={IcebergShort} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="TrashSun" component={TrashSun} durationInFrames={SUN_FRAMES} fps={60} width={1920} height={1080} />
  </>
);
