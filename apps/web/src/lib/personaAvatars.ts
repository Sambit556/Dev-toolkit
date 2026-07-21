// Preset "pick a character" avatars — procedurally generated with DiceBear
// (MIT-licensed, https://www.dicebear.com), never any copyrighted/trademarked
// character art. Each persona is a fixed set of style options (not a random
// seed roll) so the result is deterministic and actually matches its label.
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { bottts } from '@dicebear/collection';

export interface PersonaAvatar {
  key: string;
  label: string;
  dataUri: string;
}

// DiceBear's avataaars style gates facial hair and accessories behind their own
// *Probability rolls (10% by default) *in addition* to the allowed-options array —
// listing e.g. facialHair: ['beardMedium'] only means "if it shows, use this one,"
// not "always show it." Every persona below pins every randomizable slot (eyes,
// eyebrows, mouth, facial hair, accessories) to an explicit value AND sets its
// probability to 0 or 100 so nothing is left to the seed's luck of the draw.
const AVATAAARS_PERSONAS: { key: string; label: string; seed: string; options: Record<string, unknown> }[] = [
  {
    key: 'man', label: 'A Man', seed: 'persona-man',
    options: {
      top: ['shortWaved'], topProbability: 100,
      facialHair: ['beardMedium'], facialHairProbability: 100, facialHairColor: ['2c1b18'],
      accessories: [], accessoriesProbability: 0,
      clothing: ['shirtCrewNeck'], clothesColor: ['3c4f5c'],
      hairColor: ['2c1b18'], skinColor: ['edb98a'],
      eyes: ['default'], eyebrows: ['defaultNatural'], mouth: ['smile'],
      backgroundColor: ['93c5fd', '3b82f6'], backgroundType: ['gradientLinear'],
    },
  },
  {
    key: 'woman', label: 'A Woman', seed: 'persona-woman',
    options: {
      top: ['bigHair'], topProbability: 100,
      facialHair: [], facialHairProbability: 0,
      accessories: [], accessoriesProbability: 0,
      clothing: ['blazerAndShirt'], clothesColor: ['ff488e'],
      hairColor: ['a55728'], skinColor: ['ffdbb4'],
      eyebrows: ['defaultNatural'], eyes: ['default'], mouth: ['smile'],
      backgroundColor: ['fbcfe8', 'f472b6'], backgroundType: ['gradientLinear'],
    },
  },
  {
    key: 'old-guy', label: 'An Old Guy', seed: 'persona-old-guy',
    options: {
      top: ['theCaesar'], topProbability: 100,
      facialHair: ['beardMedium'], facialHairProbability: 100, facialHairColor: ['e8e1e1'],
      accessories: ['prescription02'], accessoriesProbability: 100,
      clothing: ['collarAndSweater'], clothesColor: ['929598'],
      hairColor: ['e8e1e1'], skinColor: ['d08b5b'],
      eyes: ['default'], eyebrows: ['defaultNatural'], mouth: ['smile'],
      backgroundColor: ['e2e8f0', '94a3b8'], backgroundType: ['gradientLinear'],
    },
  },
  {
    key: 'child', label: 'A Child', seed: 'persona-child',
    options: {
      top: ['shortWaved'], topProbability: 100,
      facialHair: [], facialHairProbability: 0,
      accessories: [], accessoriesProbability: 0,
      clothing: ['graphicShirt'], clothingGraphic: ['bear'], clothesColor: ['ffffb1'],
      hairColor: ['4a312c'], skinColor: ['ffdbb4'],
      eyes: ['happy'], eyebrows: ['defaultNatural'], mouth: ['smile'],
      backgroundColor: ['fef3c7', 'fbbf24'], backgroundType: ['gradientLinear'],
    },
  },
  {
    key: 'cool-boy', label: 'A Cool Boy', seed: 'persona-cool-boy',
    options: {
      top: ['shaggyMullet'], topProbability: 100,
      facialHair: [], facialHairProbability: 0,
      accessories: ['sunglasses'], accessoriesProbability: 100,
      clothing: ['hoodie'], clothesColor: ['262e33'],
      hairColor: ['2c1b18'], skinColor: ['edb98a'],
      eyes: ['default'], eyebrows: ['raisedExcitedNatural'], mouth: ['twinkle'],
      backgroundColor: ['6ee7b7', '10b981'], backgroundType: ['gradientLinear'],
    },
  },
  {
    key: 'spy', label: 'A Spy', seed: 'persona-spy',
    options: {
      top: ['theCaesarAndSidePart'], topProbability: 100,
      facialHair: [], facialHairProbability: 0,
      accessories: ['wayfarers'], accessoriesProbability: 100,
      clothing: ['blazerAndShirt'], clothesColor: ['262e33'],
      hairColor: ['2c1b18'], skinColor: ['614335'],
      eyes: ['default'], eyebrows: ['defaultNatural'], mouth: ['serious'],
      backgroundColor: ['64748b', '334155'], backgroundType: ['gradientLinear'],
    },
  },
  {
    key: 'girl', label: 'A Girl', seed: 'persona-girl',
    options: {
      top: ['curly'], topProbability: 100,
      facialHair: [], facialHairProbability: 0,
      accessories: [], accessoriesProbability: 0,
      clothing: ['shirtVNeck'], clothesColor: ['ff5c5c'],
      hairColor: ['b58143'], skinColor: ['ffdbb4'],
      eyebrows: ['defaultNatural'], eyes: ['happy'], mouth: ['smile'],
      backgroundColor: ['e9d5ff', 'c084fc'], backgroundType: ['gradientLinear'],
    },
  },
];

const PERSONA_SIZE = 256;

function buildAvataaarsPersonas(): PersonaAvatar[] {
  return AVATAAARS_PERSONAS.map(({ key, label, seed, options }) => ({
    key,
    label,
    dataUri: createAvatar(avataaars, { seed, size: PERSONA_SIZE, ...options }).toDataUri(),
  }));
}

function buildAnimalPersona(): PersonaAvatar {
  return {
    key: 'animal',
    label: 'An Animal',
    dataUri: createAvatar(bottts, {
      seed: 'persona-animal', size: PERSONA_SIZE,
      backgroundColor: ['fef3c7', 'fde68a'], backgroundType: ['gradientLinear'],
    }).toDataUri(),
  };
}

// Computed once at module load — deterministic (fixed seeds), so no reason to
// regenerate per render.
const humanPersonas = buildAvataaarsPersonas();
export const PERSONA_AVATARS: PersonaAvatar[] = [
  ...humanPersonas.slice(0, 3), // man, woman, old guy
  buildAnimalPersona(),
  ...humanPersonas.slice(3), // child, cool boy, spy, girl
];
