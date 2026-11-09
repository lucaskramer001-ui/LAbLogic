import {Composition, Still} from 'remotion';
import {SunThumbA, SunThumbB, SunThumbC} from './thumb/SunThumbs';
import {WoodpeckerThumb} from './thumb/WoodpeckerThumb';
import {IcebergThumbA, IcebergThumbB} from './thumb/IcebergThumbs';
import {MoneyThumbA, MoneyThumbB, MoneyThumbC} from './thumb/MoneyThumbs';
import {BlackBoxThumbA, BlackBoxThumbB, BlackBoxThumbC} from './thumb/BlackBoxThumbs';
import {IcebergShort, DURATION_FRAMES} from './iceberg/Main';
import {FPS} from './iceberg/timing';
import {TrashSun, DURATION_FRAMES as SUN_FRAMES} from './sun/Main';
import {IcebergLong, DURATION_FRAMES as ICEL_FRAMES} from './iceberglong/Main';
import {SeawaterShort, DURATION_FRAMES as SEA_FRAMES} from './seawater/Main';
import {MoneyShort, MoneyCover, DURATION_FRAMES as MONEY_FRAMES} from './money/Main';
import {MoneyLong, DURATION_FRAMES as MONEYL_FRAMES} from './moneylong/Main';
import {BlackBoxShort, BlackBoxCover, DURATION_FRAMES as BB_FRAMES} from './blackbox/Main';
import {BlackBoxLong, DURATION_FRAMES as BBL_FRAMES} from './blackboxlong/Main';

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
    <Composition id="IcebergLong" component={IcebergLong} durationInFrames={ICEL_FRAMES} fps={60} width={1920} height={1080} />
    <Composition id="Seawater" component={SeawaterShort} durationInFrames={SEA_FRAMES} fps={60} width={1080} height={1920} />
    <Composition id="Money" component={MoneyShort} durationInFrames={MONEY_FRAMES} fps={60} width={1080} height={1920} />
    <Still id="MoneyCover" component={MoneyCover} width={1080} height={1920} />
    <Composition id="MoneyLong" component={MoneyLong} durationInFrames={MONEYL_FRAMES} fps={60} width={1920} height={1080} />
    <Still id="MoneyThumbA" component={MoneyThumbA} width={1280} height={720} />
    <Still id="MoneyThumbB" component={MoneyThumbB} width={1280} height={720} />
    <Still id="MoneyThumbC" component={MoneyThumbC} width={1280} height={720} />
    <Composition id="BlackBox" component={BlackBoxShort} durationInFrames={BB_FRAMES} fps={60} width={1080} height={1920} />
    <Still id="BlackBoxCover" component={BlackBoxCover} width={1080} height={1920} />
    <Composition id="BlackBoxLong" component={BlackBoxLong} durationInFrames={BBL_FRAMES} fps={60} width={1920} height={1080} />
    <Still id="BlackBoxThumbA" component={BlackBoxThumbA} width={1280} height={720} />
    <Still id="BlackBoxThumbB" component={BlackBoxThumbB} width={1280} height={720} />
    <Still id="BlackBoxThumbC" component={BlackBoxThumbC} width={1280} height={720} />
  </>
);
