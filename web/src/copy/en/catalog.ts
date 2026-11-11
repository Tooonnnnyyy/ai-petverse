// English copy for catalog content (places, souvenirs, stories, snacks).
// {name} is replaced with the pet's name. No guilt, no guesses about the user's feelings.
import type { PlaceId, SnackId, SouvenirId, StoryId } from "../../shared/types";

export const catalogCopy = {
  places: {
    garden: { name: "Garden", blurb: "Flower beds, a bench and a lot of sniffing." },
    riverside: { name: "Riverside", blurb: "Slow water, tall reeds and flat stones." },
    market: { name: "Market", blurb: "Stalls, awnings and interesting smells." },
    hills: { name: "Hills", blurb: "Wind, wide sky and a long view." },
  } satisfies Record<PlaceId, { name: string; blurb: string }>,

  souvenirs: {
    ladybugSticker: { name: "Ladybug sticker", note: "Slightly bent at one corner." },
    cloverSprig: { name: "Clover sprig", note: "Three leaves. Still lucky." },
    gardenTwine: { name: "Garden twine", note: "A short green loop, very chewable." },
    seedPacket: { name: "Seed packet", note: "Says 'sunflower' in faded ink." },
    wateringCanCharm: { name: "Watering-can charm", note: "Tiny, tin and a bit dented." },
    goldenAcorn: { name: "Golden acorn", note: "Found under the oldest tree in the garden." },
    skippingStone: { name: "Skipping stone", note: "Flat, smooth and good for three hops." },
    reedFlute: { name: "Reed flute", note: "It almost makes a sound." },
    paperBoat: { name: "Paper boat", note: "It sailed a little way first." },
    riverGlass: { name: "River glass", note: "Frosted green, worn soft by the water." },
    cattailFluff: { name: "Cattail fluff", note: "A soft puff that floats off if you sneeze." },
    moonstone: { name: "Moonstone", note: "Pale and glowing faintly at the edges." },
    paperLantern: { name: "Paper lantern", note: "Folded flat for the walk home." },
    spiceTin: { name: "Spice tin", note: "Empty, but it still smells of cinnamon." },
    priceTag: { name: "Price tag", note: "It just says '2'. Two what, nobody knows." },
    orangePeelCurl: { name: "Orange-peel curl", note: "One long spiral, carefully carried." },
    beadString: { name: "Bead string", note: "Five beads, all a different blue." },
    brassKey: { name: "Brass key", note: "It opens something, somewhere." },
    thymeBundle: { name: "Thyme bundle", note: "A small bunch that smells of summer." },
    pressedFern: { name: "Pressed fern", note: "Flattened neatly, as if on purpose." },
    cloudStone: { name: "Cloud stone", note: "White and speckled, from the top of the hill." },
    kiteTail: { name: "Kite tail", note: "A strip of red cloth, still fluttery." },
    mapScrap: { name: "Map scrap", note: "Shows half a path and a little X." },
    cometShard: { name: "Comet shard", note: "A dark glassy chip that catches the light." },
  } satisfies Record<SouvenirId, { name: string; note: string }>,

  stories: {
    "garden.1": "{name} followed a bee from flower to flower, very politely.",
    "garden.2": "{name} sat under the bench and watched the sprinkler for a long time.",
    "garden.3": "{name} found the softest patch of grass and tested it thoroughly.",
    "garden.4": "{name} said hello to a snail. The snail took its time answering.",
    "riverside.1": "{name} watched the ducks paddle past and counted them twice.",
    "riverside.2": "{name} dipped one paw in the water and decided that was enough.",
    "riverside.3": "{name} sat on a warm rock while the reeds swayed.",
    "riverside.4": "{name} chased a leaf all the way along the bank.",
    "market.1": "{name} sniffed every stall and was given a friendly wave at the bakery.",
    "market.2": "{name} sat by the flower stand and watched people choose tulips.",
    "market.3": "{name} heard a street musician and stayed for two whole songs.",
    "market.4": "{name} napped in the shade of a striped awning.",
    "hills.1": "{name} climbed to the top and let the wind ruffle everything.",
    "hills.2": "{name} watched a kite loop and dive above the grass.",
    "hills.3": "{name} rolled down a gentle slope, then walked back up to do it again.",
    "hills.4": "{name} sat very still and watched the clouds go by.",
  } satisfies Record<StoryId, string>,

  snacks: {
    crunchy: "Crunchy bites",
    soft: "Soft treat",
    fishy: "Fishy flakes",
    chewy: "Chewy stick",
  } satisfies Record<SnackId, string>,

  gift: {
    newStamp: "NEW",
    postcard: "A postcard from the {place}",
    souvenir: "{name} brought back a {item}",
    backOnLoad: "{name} is back from the {place} and brought something.",
    longerTripHint: "Something special might turn up on a longer trip.",
    albumComplete: "Album complete",
  },

  durations: {
    quick: "Quick look",
    minutes: "{n} min",
  },
};
