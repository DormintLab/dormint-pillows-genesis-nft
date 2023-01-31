import { DormintPillowsTraits } from "./../typechain-types/contracts/DormintPillowsTraits";
import { MockVRFV2Wrapper } from "./../typechain-types/contracts/mocks/MockVRFV2Wrapper.sol/MockVRFV2Wrapper";
import { MockLinkToken } from "./../typechain-types/contracts/mocks/MockLinkToken.sol/MockLinkToken";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployments } from "hardhat";
import { getTokensRangeTraitsMap } from "./mixins";

const prepare = deployments.createFixture(async () => {
  await deployments.fixture(undefined, { keepExistingDeployments: true });
  return {
    mockToken: await ethers.getContract<MockLinkToken>("MockLinkToken"),
    mockVRFWrapper: await ethers.getContract<MockVRFV2Wrapper>(
      "MockVRFV2Wrapper"
    ),
    traitsContract: await ethers.getContract<DormintPillowsTraits>(
      "DormintPillowsTraits"
    ),
  };
});

describe("Dormint Pillows Traits hardhat-deploy", function () {
  it("Should be correctly initialized", async function () {
    const [owner] = await ethers.getSigners();
    const { mockToken, mockVRFWrapper, traitsContract } = await prepare();

    expect(await traitsContract.owner()).to.equal(owner.address);
    expect(await traitsContract.LINK()).to.equal(mockToken.address);
    expect(await traitsContract.VRF_V2_WRAPPER()).to.equal(
      mockVRFWrapper.address
    );
    expect(await traitsContract.randomnessRequestId()).to.equal(0);
    expect(await traitsContract.randomWord()).to.equal(0);
  });
});
describe("Reveal", function () {
  it("Should correctly request and receive randomness", async function () {
    const [owner] = await ethers.getSigners();

    const { mockToken, mockVRFWrapper, traitsContract } = await prepare();

    // Fund account with LINK token
    const ONE_LINK = ethers.utils.parseEther("1");
    await mockToken.mint(owner.address, ONE_LINK);
    await mockToken.transfer(traitsContract.address, ONE_LINK);

    // Request randomness
    await traitsContract.requestRandomness();
    expect(await mockToken.balanceOf(traitsContract.address)).to.equal(0);

    expect(await mockVRFWrapper.lastRequestId()).to.equal(1);
    expect(await traitsContract.randomnessRequestId()).to.equal(1);

    // Provide randomness: Simulate Chainlink
    await mockVRFWrapper.provide(traitsContract.address, 1, [1337]);

    expect(await traitsContract.randomWord()).to.equal(1337);
  });

  it("Should correctly assign traits probability", async function () {
    const [owner] = await ethers.getSigners();

    const { mockToken, mockVRFWrapper, traitsContract } = await prepare();

    // Fund account with LINK token
    const ONE_LINK = ethers.utils.parseEther("1");
    await mockToken.mint(owner.address, ONE_LINK);
    await mockToken.transfer(traitsContract.address, ONE_LINK);
    // Request randomness
    await traitsContract.requestRandomness();

    // Provide randomness: Simulate Chainlink
    const randomness = ethers.utils.randomBytes(32);
    await mockVRFWrapper.provide(traitsContract.address, 1, [randomness]);

    const totalQuantity = 1000;

    const traitsMap = await getTokensRangeTraitsMap(traitsContract, 0, 999);

    const mouthCount: { [key: number]: number } = {};
    const eyesCount: { [key: number]: number } = {};
    const patternCount: { [key: number]: number } = {};
    const rarityCount: { [key: number]: number } = {};
    const shapeCount: { [key: number]: number } = {};
    const pompomCount: { [key: number]: number } = {};
    const animalCount: { [key: number]: number } = {};
    for (const trait of traitsMap) {
      if (!mouthCount[trait.data.mouth]) {
        mouthCount[trait.data.mouth] = 1;
      } else {
        mouthCount[trait.data.mouth] += 1;
      }

      if (!eyesCount[trait.data.eyes]) {
        eyesCount[trait.data.eyes] = 1;
      } else {
        eyesCount[trait.data.eyes] += 1;
      }

      if (!patternCount[trait.data.pattern]) {
        patternCount[trait.data.pattern] = 1;
      } else {
        patternCount[trait.data.pattern] += 1;
      }

      if (!rarityCount[trait.data.rarity]) {
        rarityCount[trait.data.rarity] = 1;
      } else {
        rarityCount[trait.data.rarity] += 1;
      }

      if (!shapeCount[trait.data.shape]) {
        shapeCount[trait.data.shape] = 1;
      } else {
        shapeCount[trait.data.shape] += 1;
      }

      if (!pompomCount[trait.data.pompom]) {
        pompomCount[trait.data.pompom] = 1;
      } else {
        pompomCount[trait.data.pompom] += 1;
      }

      // Pompom rules check
      if (trait.data.pompom != 0 && ![2, 3, 4].includes(trait.data.rarity)) {
        throw Error("Pompom not allowed");
      }

      if (!animalCount[trait.data.animal]) {
        animalCount[trait.data.animal] = 1;
      } else {
        animalCount[trait.data.animal] += 1;
      }

      // Animal rules check
      if (trait.data.animal != 0 && ![3, 4].includes(trait.data.rarity)) {
        throw Error("Animal not allowed");
      }
    }

    /** Mouth */
    const mouth_happy = mouthCount[0];
    const mouth_confused = mouthCount[1];
    const mouth_sleepy = mouthCount[2];
    const mouth_extremely_happy = mouthCount[3];
    const mouth_neutral = mouthCount[4];
    const mouth_yawning = mouthCount[5];
    const mouth_satisfied = mouthCount[6];
    const mouth_surprised = mouthCount[7];
    console.log(
      `Mouth -> Happy: ${mouth_happy} Confused: ${mouth_confused} Sleepy: ${mouth_sleepy} Extremely Sleepy: ${mouth_extremely_happy} Neutral: ${mouth_neutral} Yawning: ${mouth_yawning} Satisfied: ${mouth_satisfied} Surprised: ${mouth_surprised}`
    );
    console.log(
      `Total: ${
        mouth_happy +
        mouth_confused +
        mouth_sleepy +
        mouth_extremely_happy +
        mouth_neutral +
        mouth_yawning +
        mouth_satisfied +
        mouth_surprised
      }`
    );
    console.log();

    /** Eyes */
    const eyes_happy = eyesCount[0];
    const eyes_confused = eyesCount[1];
    const eyes_sleepy = eyesCount[2];
    const eyes_closed = eyesCount[3];
    const eyes_half_awake = eyesCount[4];
    const eyes_suspicious = eyesCount[5];
    const eyes_reflective = eyesCount[6];
    const eyes_winking = eyesCount[7];
    console.log(
      `Eyes -> Happy: ${eyes_happy} Confused: ${eyes_confused} Sleepy: ${eyes_sleepy} Closed: ${eyes_closed} Half-awake: ${eyes_half_awake} Suspicious: ${eyes_suspicious} Reflective: ${eyes_reflective} Winking: ${eyes_winking}`
    );
    console.log(
      `Total: ${
        eyes_happy +
        eyes_confused +
        eyes_sleepy +
        eyes_closed +
        eyes_half_awake +
        eyes_suspicious +
        eyes_reflective +
        eyes_winking
      }`
    );
    console.log();

    /** Pattern */
    const pattern_xmas_trees = patternCount[0];
    const pattern_leaves = patternCount[1];
    const pattern_fishes = patternCount[2];
    const pattern_cats = patternCount[3];
    const pattern_owls = patternCount[4];
    const pattern_geometric_shapes = patternCount[5];
    const pattern_giraffes = patternCount[6];
    const pattern_bears = patternCount[7];
    console.log(
      `Pattern -> X'mas Trees: ${pattern_xmas_trees} Leaves: ${pattern_leaves} Fishes: ${pattern_fishes} Cats: ${pattern_cats} Owls: ${pattern_owls} Geometric Shapes: ${pattern_geometric_shapes} Giraffes: ${pattern_giraffes} Bears: ${pattern_bears}`
    );
    console.log(
      `Total: ${
        pattern_xmas_trees +
        pattern_leaves +
        pattern_fishes +
        pattern_cats +
        pattern_owls +
        pattern_geometric_shapes +
        pattern_giraffes +
        pattern_bears
      }`
    );
    console.log();

    /** Rarity */
    const rarity_common = rarityCount[0];
    const rarity_uncommon = rarityCount[1];
    const rarity_rare = rarityCount[2];
    const rarity_epic = rarityCount[3];
    const rarity_legendary = rarityCount[4];
    console.log(
      `Rarity -> Common: ${rarity_common} Uncommon: ${rarity_uncommon} Rare: ${rarity_rare} Epic: ${rarity_epic} Legendary: ${rarity_legendary}`
    );
    console.log(
      `Total: ${
        rarity_common +
        rarity_uncommon +
        rarity_rare +
        rarity_epic +
        rarity_legendary
      }`
    );
    console.log();

    /** Shapes */
    const shapes_square = shapeCount[0];
    const shapes_circle = shapeCount[1];
    const shapes_triangle = shapeCount[2];
    console.log(
      `Shape -> Square: ${shapes_square} Circle: ${shapes_circle} Triangle: ${shapes_triangle}`
    );
    console.log(`Total: ${shapes_square + shapes_circle + shapes_triangle}`);
    console.log();

    /** PomPom */
    const pompom_none = pompomCount[0];
    const pompom_1 = pompomCount[1];
    const pompom_2 = pompomCount[2];
    const pompom_3 = pompomCount[3];
    console.log(
      `Pompom -> None: ${pompom_none} Type 1: ${pompom_1} Type 2: ${pompom_2} Type 3: ${pompom_3}`
    );
    console.log(`Total: ${pompom_none + pompom_1 + pompom_2 + pompom_3}`);
    console.log();
    expect(pompom_none).to.equal(
      totalQuantity - (rarity_rare + rarity_epic + rarity_legendary)
    );

    /** Animal */
    const animal_none = animalCount[0];
    const animal_cat = animalCount[1];
    const animal_dog = animalCount[2];
    const animal_bird = animalCount[3];
    const animal_panda = animalCount[4];
    const animal_zebra = animalCount[5];
    console.log(
      `Animal -> None: ${animal_none} Cat: ${animal_cat} Dog: ${animal_dog} Bird: ${animal_bird} Panda: ${animal_panda} Zebra: ${animal_zebra}`
    );
    console.log(
      `Total: ${
        animal_none +
        animal_cat +
        animal_dog +
        animal_bird +
        animal_panda +
        animal_zebra
      }`
    );
    console.log();
    expect(animal_none).to.equal(
      totalQuantity - (rarity_epic + rarity_legendary)
    );
  });
});
