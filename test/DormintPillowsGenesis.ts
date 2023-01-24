import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

import { DormintPillowsGenesis } from './../typechain-types';

describe("DormintPillowsGenesis", function () {
  async function prepare() {
    // Define signers
    const [ owner, governor ] = await ethers.getSigners();

    // Deploy Mocks
    const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
    const mockToken = await MockLinkToken.deploy();
    await mockToken.deployed();

    const MockVRFV2Wrapper = await ethers.getContractFactory("MockVRFV2Wrapper");
    const mockVRFWrapper = await MockVRFV2Wrapper.deploy();
    await mockVRFWrapper.deployed();

    // Deploy NFT
    const DormintPillowsGenesis = await ethers.getContractFactory("DormintPillowsGenesis");
    const nft = <DormintPillowsGenesis>(await DormintPillowsGenesis.deploy(
      governor.address,
      mockToken.address,
      mockVRFWrapper.address
    ));
    await nft.deployed();

    // Fetch params
    const DEFAULT_ADMIN_ROLE = await nft.DEFAULT_ADMIN_ROLE();

    return {
      owner, governor,
      mockToken, mockVRFWrapper,
      nft,
      DEFAULT_ADMIN_ROLE
    };
  }

  describe("Deployment", function () {
    it("Should be correctly initialized", async function () {
      const {
        owner, governor,
        nft,
        DEFAULT_ADMIN_ROLE
      } = await loadFixture(prepare);

      expect(await nft.baseURI()).to.equal("https://api.dormint.io/genesis/");

      expect(await nft.owner()).to.equal(owner.address);
      expect(await nft.hasRole(DEFAULT_ADMIN_ROLE, governor.address)).to.equal(true);
      expect(await nft.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(false);
    });
  });
})

  // describe("Mint", function () {
  //   it("Should correctly mint", async function () {
  //     const {
  //       governor, buyerWhitelisted,
  //       mintPrice,
  //       nft
  //     } = await loadFixture(prepare);

  //     await nft.connect(governor).addWhitelisted([ buyerWhitelisted.address ]);

  //     const quantity = 2;
  //     await nft.connect(buyerWhitelisted).mint(buyerWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });

  //     expect(await nft.balanceOf(buyerWhitelisted.address)).to.equal(quantity);
  //     expect(await nft.ownerOf(1)).to.equal(buyerWhitelisted.address);
  //     expect(await nft.ownerOf(2)).to.equal(buyerWhitelisted.address);
  //     expect(await nft.tokenURI(1)).to.equal("https://api.dormint.io/genesis/1");
  //     expect(await nft.tokenURI(2)).to.equal("https://api.dormint.io/genesis/2");
  //   });
  // });

  // describe("Whitelists", function () {
  //   it("Should correctly work", async function () {
  //     const {
  //       owner, governor, buyerWhitelisted, buyerNotWhitelisted,
  //       mintPrice,
  //       nft,
  //       DEFAULT_ADMIN_ROLE
  //     } = await loadFixture(prepare);

  //     // Test access reverts on addition and removal by non-governor
  //     await expect(
  //       nft.connect(owner).addWhitelisted([ ethers.constants.AddressZero ])
  //     ).to.be.revertedWith(`AccessControl: account ${owner.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);

  //     await expect(
  //       nft.connect(owner).removeWhitelisted([ ethers.constants.AddressZero ])
  //     ).to.be.revertedWith(`AccessControl: account ${owner.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);

  //     // Test logic on addition and removal
  //     await nft.connect(governor).addWhitelisted([ buyerWhitelisted.address, buyerNotWhitelisted.address ])
      
  //     expect(await nft.isWhitelisted(buyerWhitelisted.address)).to.equal(true);
  //     expect(await nft.isWhitelisted(buyerNotWhitelisted.address)).to.equal(true);
  //     expect(await nft.isWhitelisted(governor.address)).to.equal(false);

  //     await nft.connect(governor).removeWhitelisted([ buyerNotWhitelisted.address ]);

  //     expect(await nft.isWhitelisted(buyerNotWhitelisted.address)).to.equal(false);

  //     // Test mint by whitelisted and revert buy not whitelisted
  //     const quantity = 2;
  //     await nft.connect(buyerWhitelisted).mint(buyerWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });
  //     expect(await nft.balanceOf(buyerWhitelisted.address)).to.equal(quantity);

  //     await expect(
  //       nft.connect(buyerNotWhitelisted).mint(buyerNotWhitelisted.address, quantity, { value: mintPrice.mul(quantity) })
  //     ).to.be.revertedWith("Only whitelisted mint allowed now");


  //     // Test removal of whitelists;
  //     await nft.connect(governor).setWhitelistOnly(false);
  //     expect(await nft.whitelistOnly()).to.be.equal(false);

  //     await nft.connect(buyerNotWhitelisted).mint(buyerNotWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });
  //     expect(await nft.balanceOf(buyerNotWhitelisted.address)).to.equal(quantity);
  //   });
  // });

//   describe("Reveal", function () {
//     it("Should correctly request and receive randomness", async function () {
//       const {
//         owner, governor,
//         mockToken, mockVRFWrapper,
//         nft
//       } = await loadFixture(prepare);

//       // Fund account with LINK token
//       const ONE_LINK = ethers.utils.parseEther("1");
//       await mockToken.mint(owner.address, ONE_LINK);
//       await mockToken.transfer(nft.address, ONE_LINK);

//       // Request randomness
//       await nft.connect(governor).requestRandomness();
//       expect(await mockToken.balanceOf(nft.address)).to.equal(0);

//       expect(await mockVRFWrapper.lastRequestId()).to.equal(1);
//       expect(await nft.randomnessRequestId()).to.equal(1);

//       // Provide randomness: Simulate Chainlink
//       await mockVRFWrapper.provide(nft.address, 1, [1337]);

//       expect(await nft.randomWord()).to.equal(1337);
//     });

//     it("Should correctly assign traits probability", async function () {
//       const {
//         owner, governor, buyerWhitelisted,
//         mintPrice,
//         mockToken, mockVRFWrapper,
//         nft
//       } = await loadFixture(prepare);

//       // Whitelist account
//       await nft.connect(governor).addWhitelisted([ buyerWhitelisted.address ]);

//       // Fund account with LINK token
//       const ONE_LINK = ethers.utils.parseEther("1");
//       await mockToken.mint(owner.address, ONE_LINK);
//       await mockToken.transfer(nft.address, ONE_LINK);
//       // Request randomness
//       await nft.connect(governor).requestRandomness();

//       // Provide randomness: Simulate Chainlink
//       const randomness = ethers.utils.randomBytes(32);
//       await mockVRFWrapper.provide(nft.address, 1, [randomness]);

//       // Mint 1000 NFTs
//       const totalQuantity = 1000;
//       const quantity = 200;
//       await nft.connect(buyerWhitelisted).mint(buyerWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });
//       await nft.connect(buyerWhitelisted).mint(buyerWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });
//       await nft.connect(buyerWhitelisted).mint(buyerWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });
//       await nft.connect(buyerWhitelisted).mint(buyerWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });
//       await nft.connect(buyerWhitelisted).mint(buyerWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });

//       const traits = await Promise.all(
//         Array
//           .from({ length: totalQuantity }, (_, i) => i + 1)
//           .map(tokenId => nft.getTraits(tokenId))
//       )

//       let availableCount = 0
//       const mouthCount: { [key: number]: number } = {}
//       const eyesCount: { [key: number]: number } = {}
//       const patternCount: { [key: number]: number } = {}
//       const rarityCount: { [key: number]: number } = {}
//       const shapeCount: { [key: number]: number } = {}
//       const pompomCount: { [key: number]: number } = {}
//       const animalCount: { [key: number]: number } = {}
//       for (const trait of traits) {
//         if (trait.available) {
//           availableCount++
//         }

//         if (!mouthCount[trait.traits.mouth]) {
//           mouthCount[trait.traits.mouth] = 1
//         } else {
//           mouthCount[trait.traits.mouth] += 1
//         }

//         if (!eyesCount[trait.traits.eyes]) {
//           eyesCount[trait.traits.eyes] = 1
//         } else {
//           eyesCount[trait.traits.eyes] += 1
//         }

//         if (!patternCount[trait.traits.pattern]) {
//           patternCount[trait.traits.pattern] = 1
//         } else {
//           patternCount[trait.traits.pattern] += 1
//         }

//         if (!rarityCount[trait.traits.rarity]) {
//           rarityCount[trait.traits.rarity] = 1
//         } else {
//           rarityCount[trait.traits.rarity] += 1
//         }

//         if (!shapeCount[trait.traits.shape]) {
//           shapeCount[trait.traits.shape] = 1
//         } else {
//           shapeCount[trait.traits.shape] += 1
//         }

//         if (!pompomCount[trait.traits.pompom]) {
//           pompomCount[trait.traits.pompom] = 1
//         } else {
//           pompomCount[trait.traits.pompom] += 1
//         }

//         // Pompom rules check
//         if (trait.traits.pompom != 0 && ![2, 3, 4].includes(trait.traits.rarity)) {
//           throw Error('Pompom not allowed')
//         }

//         if (!animalCount[trait.traits.animal]) {
//           animalCount[trait.traits.animal] = 1
//         } else {
//           animalCount[trait.traits.animal] += 1
//         }

//         // Animal rules check
//         if (trait.traits.animal != 0 && ![3, 4].includes(trait.traits.rarity)) {
//           throw Error('Animal not allowed')
//         }
//       }
      
//       console.log(`Total available: ${availableCount}`)
//       console.log()

//       /** Mouth */
//       const mouth_happy = mouthCount[0];
//       const mouth_confused = mouthCount[1];
//       const mouth_sleepy = mouthCount[2];
//       const mouth_extremely_happy = mouthCount[3];
//       const mouth_neutral = mouthCount[4];
//       const mouth_yawning = mouthCount[5];
//       const mouth_satisfied = mouthCount[6];
//       const mouth_surprised = mouthCount[7];
//       console.log(`Mouth -> Happy: ${mouth_happy} Confused: ${mouth_confused} Sleepy: ${mouth_sleepy} Extremely Sleepy: ${mouth_extremely_happy} Neutral: ${mouth_neutral} Yawning: ${mouth_yawning} Satisfied: ${mouth_satisfied} Surprised: ${mouth_surprised}`)
//       console.log(`Total: ${mouth_happy + mouth_confused + mouth_sleepy + mouth_extremely_happy + mouth_neutral + mouth_yawning + mouth_satisfied + mouth_surprised}`)
//       console.log()

//       /** Eyes */
//       const eyes_happy = eyesCount[0];
//       const eyes_confused = eyesCount[1];
//       const eyes_sleepy = eyesCount[2];
//       const eyes_closed = eyesCount[3];
//       const eyes_half_awake = eyesCount[4];
//       const eyes_suspicious = eyesCount[5];
//       const eyes_reflective = eyesCount[6];
//       const eyes_winking = eyesCount[7];
//       console.log(`Eyes -> Happy: ${eyes_happy} Confused: ${eyes_confused} Sleepy: ${eyes_sleepy} Closed: ${eyes_closed} Half-awake: ${eyes_half_awake} Suspicious: ${eyes_suspicious} Reflective: ${eyes_reflective} Winking: ${eyes_winking}`)
//       console.log(`Total: ${eyes_happy + eyes_confused + eyes_sleepy + eyes_closed + eyes_half_awake + eyes_suspicious + eyes_reflective + eyes_winking}`)
//       console.log()

//       /** Pattern */
//       const pattern_xmas_trees = patternCount[0];
//       const pattern_leaves = patternCount[1];
//       const pattern_fishes = patternCount[2];
//       const pattern_cats = patternCount[3];
//       const pattern_owls = patternCount[4];
//       const pattern_geometric_shapes = patternCount[5];
//       const pattern_giraffes = patternCount[6];
//       const pattern_bears = patternCount[7];
//       console.log(`Pattern -> X'mas Trees: ${pattern_xmas_trees} Leaves: ${pattern_leaves} Fishes: ${pattern_fishes} Cats: ${pattern_cats} Owls: ${pattern_owls} Geometric Shapes: ${pattern_geometric_shapes} Giraffes: ${pattern_giraffes} Bears: ${pattern_bears}`)
//       console.log(`Total: ${pattern_xmas_trees + pattern_leaves + pattern_fishes + pattern_cats + pattern_owls + pattern_geometric_shapes + pattern_giraffes + pattern_bears}`)
//       console.log()

//       /** Rarity */
//       const rarity_common = rarityCount[0];
//       const rarity_uncommon = rarityCount[1];
//       const rarity_rare = rarityCount[2];
//       const rarity_epic = rarityCount[3];
//       const rarity_legendary = rarityCount[4];
//       console.log(`Rarity -> Common: ${rarity_common} Uncommon: ${rarity_uncommon} Rare: ${rarity_rare} Epic: ${rarity_epic} Legendary: ${rarity_legendary}`)
//       console.log(`Total: ${rarity_common + rarity_uncommon + rarity_rare + rarity_epic + rarity_legendary}`)
//       console.log()

//       /** Shapes */
//       const shapes_square = shapeCount[0];
//       const shapes_circle = shapeCount[1];
//       const shapes_triangle = shapeCount[2];
//       console.log(`Shape -> Square: ${shapes_square} Circle: ${shapes_circle} Triangle: ${shapes_triangle}`)
//       console.log(`Total: ${shapes_square + shapes_circle + shapes_triangle}`)
//       console.log()

//       /** PomPom */
//       const pompom_none = pompomCount[0];
//       const pompom_1 = pompomCount[1];
//       const pompom_2 = pompomCount[2];
//       const pompom_3 = pompomCount[3];
//       console.log(`Pompom -> None: ${pompom_none} Type 1: ${pompom_1} Type 2: ${pompom_2} Type 3: ${pompom_3}`)
//       console.log(`Total: ${pompom_none + pompom_1 + pompom_2 + pompom_3}`)
//       console.log()
//       expect(pompom_none).to.equal(totalQuantity - (rarity_rare + rarity_epic + rarity_legendary))

//       /** Animal */
//       const animal_none = animalCount[0];
//       const animal_cat = animalCount[1];
//       const animal_dog = animalCount[2];
//       const animal_bird = animalCount[3];
//       const animal_panda = animalCount[4];
//       const animal_zebra = animalCount[5];
//       console.log(`Animal -> None: ${animal_none} Cat: ${animal_cat} Dog: ${animal_dog} Bird: ${animal_bird} Panda: ${animal_panda} Zebra: ${animal_zebra}`)
//       console.log(`Total: ${animal_none + animal_cat + animal_dog + animal_bird + animal_panda + animal_zebra}`)
//       console.log()
//       expect(animal_none).to.equal(totalQuantity - (rarity_epic + rarity_legendary))
//     });
//   });
// });
// 
