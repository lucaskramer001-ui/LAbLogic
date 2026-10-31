import {Composition, Still} from 'remotion';
import {SunThumbA, SunThumbB, SunThumbC} from './thumb/SunThumbs';
import {WoodpeckerThumb} from './thumb/WoodpeckerThumb';
import {IcebergThumbA, IcebergThumbB} from './thumb/IcebergThumbs';
import {IcebergShort, DURATION_FRAMES} from './iceberg/Main';
import {FPS} from './iceberg/timing';
import {TrashSun, DURATION_FRAMES as SUN_FRAMES} from './sun/Main';

export const Root = () => (
  <>
    <Composition id="Iceberg" component={IcebergShort} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} />
    <Still id="SunThumbA" component={SunThumbA} width={1280} height={720} />
    <Still id="SunThumbB" component={SunThumbB} width={1280} height={720} />
    <Still id="SunThumbC" component={SunThumbC} width={1280} height={720} />
    <Still id="WoodpeckerThumb" component={WoodpeckerThumb} width={1280} height={720} />
    <Still id="IcebergThumbA" component={IcebergThumbA} width={1280} height={720} />
    <Still id="IcebergThumbB" component={IcebergThumbB} width={1280} height={720} />
    <Composition id="TrashSun" component={TrashSun} durationInFrames={SUN_FRAMES} fps={60} width={1920} height={1080} />
  </>
);
