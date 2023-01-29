import { DormintPillowsTraits } from "../typechain-types";

type Traits = {
  mouth: number
  eyes: number
  pattern: number
  rarity: number
  shape: number
  pompom: number
  animal: number
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
      .map(async tokenId => {
        const { traits } = await traitsInstance.getTraits(tokenId)
        return {
          tokenId,
          data: {
            mouth: traits.mouth,
            eyes: traits.eyes,
            pattern: traits.pattern,
            rarity: traits.rarity,
            shape: traits.shape,
            pompom: traits.pompom,
            animal: traits.animal,
          } as Traits
        }
      })
  )

  return traits
}
