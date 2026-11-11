// Cat poses (spec §8.2): pointed ears, whiskers, long curling tail, loaf rest.
import { Blob, Head, HeldPose, Part, Paw, SitPose, StretchPose, TailPart, WalkPose, ell, type Face, type PoseSet, type TailSpec } from "./parts";

const tail = (d: string, o: [number, number], w = 26): TailSpec => ({ d, o, w });
const T = {
  talk: tail("M318 432C374 446 406 420 404 378C402 348 384 336 370 346", [330, 432], 30),
  rest: tail("M362 398C386 424 370 430 318 430", [362, 400], 28),
  walk: tail("M164 322C112 306 104 248 128 214C138 200 156 204 150 220", [164, 322]),
  held: tail("M278 396C300 410 302 420 298 430", [278, 396]),
  stretch: tail("M174 306C134 278 122 214 142 172C150 158 166 162 162 176", [174, 306]),
};

/** Rest A: loaf, paws tucked, tail wrapped round the front. */
function Loaf({ eyes, mouth, headDy = 0 }: Face) {
  return <>
    <Part name="paw-bl" />
    <Part name="paw-br" />
    <Part name="body">
      <Blob d="M164 450C120 450 120 338 256 328C392 338 392 450 348 450Z">
        <path d={ell(366, 410, 70, 110)} className="s" />
        <path d={ell(256, 424, 64, 52)} className="b" />
      </Blob>
    </Part>
    <Part name="paw-fl"><Paw x={226} y={439} rx={22} ry={11} /></Part>
    <Part name="paw-fr"><Paw x={286} y={439} rx={22} ry={11} /></Part>
    <TailPart t={T.rest} />
    <Head sp="cat" x={256} y={294 + headDy} eyes={eyes} mouth={mouth} />
    <Part name="accessory" />
  </>;
}

export const CAT_POSES: PoseSet = {
  talk: (f) => <SitPose sp="cat" tail={T.talk} {...f} />,
  rest: Loaf,
  walk: [
    (f) => <WalkPose sp="cat" tail={T.walk} frame={0} {...f} />,
    (f) => <WalkPose sp="cat" tail={T.walk} frame={1} {...f} />,
  ],
  held: (f) => <HeldPose sp="cat" tail={T.held} {...f} />,
  stretch: (f) => <StretchPose sp="cat" tail={T.stretch} {...f} />,
};
