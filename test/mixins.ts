import { DormintPillowsTraits } from "../typechain-types";

type Output = {
  mouth: number
  eyes: number
  pattern: number
  rarity: number
  shape: number
  pompom: number
  animal: number
}

export const reverseMap = {
  mouth: [ 'Happy', 'Confused', 'Sleepy', 'ExtremelyHappy', 'Neutral', 'Yawning', 'Satisfied', 'Surprised' ],
  eyes: [ 'Happy', 'Confused', 'Sleepy', 'Closed', 'HalfAwake', 'Suspicious', 'Reflective', 'Winking' ],
  pattern: [ 'XmasTrees', 'Leaves', 'Fishes', 'Cats', 'Owls', 'GeometricShapes', 'Giraffes', 'Bears' ],
  rarity: [ 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary' ],
  shape: [ 'Square', 'Circle', 'Triangle' ],
  pompom: [ 'None', 'Type1', 'Type2', 'Type3' ],
  animal: [ 'None', 'Cat', 'Dog', 'Bird', 'Panda', 'Zebra' ]
}

export const getTokensRangeTraitsMap = async (
  traitsInstance: DormintPillowsTraits,
  fromTokenId: number,
  toTokenId: number
) => {
  if (toTokenId < fromTokenId) {
    throw new Error("'toTokenId' can't be less than 'fromTokenId'")
  }

  const testTrait = await traitsInstance.getTraits(0)
  if (!testTrait.available) {
    throw new Error("Traits are not available yet")
  }

  const traits = await Promise.all(
    Array
      .from({ length: toTokenId - fromTokenId + 1 }, (_, i) => i)
      .map(async tokenId => ({
        tokenId,
        data: (await traitsInstance.getTraits(tokenId)).traits as Output
      }))
  )

  return traits
}
