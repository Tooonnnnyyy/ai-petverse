// Dog poses (spec §8.2): floppy ears, muzzle, brow dots, short upright tail, sphinx rest.
import { Blob, Head, HeldPose, Part, Paw, SitPose, StretchPose, TailPart, WalkPose, ell, rr, type Face, type PoseSet, type TailSpec } from "./parts";

const tail = (d: string, o: [number, number], w = 24): TailSpec => ({ d, o, w });
const T = {
  talk: tail("M332 430C376 430 398 402 400 364", [334, 430], 28),
  rest: tail("M362 432C398 436 422 430 438 414", [362, 432]),
  walk: tail("M156 318C122 298 114 268 124 242", [156, 318]),
  held: tail("M276 398C292 412 296 422 294 430", [276, 398], 22),
  stretch: tail("M174 306C142 284 132 252 140 226", [174, 306]),
};

/** Rest A: sphinx, front paws forward, tail flat on the floor. */
function Sphinx({ eyes, mouth, headDy = 0 }: Face) {
  return <>
    <TailPart t={T.rest} />
    <Part name="paw-bl" />
    <Part name="paw-br" />
    <Part name="body">
      <Blob d="M160 450C116 450 116 330 256 320C396 330 396 450 352 450Z">
        <path d={ell(370, 410, 70, 110)} className="s" />
        <path d={ell(256, 410, 66, 62)} className="b" />
      </Blob>
    </Part>
    <Part name="paw-fl"><Blob d={rr(208, 372, 40, 74, 20)} /><Paw x={228} y={436} rx={30} ry={14} /></Part>
    <Part name="paw-fr"><Blob d={rr(264, 372, 40, 74, 20)} /><Paw x={284} y={436} rx={30} ry={14} /></Part>
    <Head sp="dog" x={256} y={284 + headDy} eyes={eyes} mouth={mouth} />
    <Part name="accessory" />
  </>;
}

export const DOG_POSES: PoseSet = {
  talk: (f) => <SitPose sp="dog" tail={T.talk} {...f} />,
  rest: Sphinx,
  walk: [
    (f) => <WalkPose sp="dog" tail={T.walk} frame={0} {...f} />,
    (f) => <WalkPose sp="dog" tail={T.walk} frame={1} {...f} />,
  ],
  held: (f) => <HeldPose sp="dog" tail={T.held} {...f} />,
  stretch: (f) => <StretchPose sp="dog" tail={T.stretch} {...f} />,
};
