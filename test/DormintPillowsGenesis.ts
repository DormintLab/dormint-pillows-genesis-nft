import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

import { DormintPillowsGenesis } from './../typechain-types';

describe("DormintPillowsGenesis", function () {
  async function prepare() {
    // Define signers
    const [ owner, governor, buyer ] = await ethers.getSigners();

    // Define params
    const mintPrice = ethers.utils.parseEther("0.1");

    // Deploy Mocks
    const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
    const mockToken = await MockLinkToken.deploy();
    await mockToken.deployed();

    const MockVRFV2Wrapper = await ethers.getContractFactory("MockVRFV2Wrapper");
    const mockVRFWrapper = await MockVRFV2Wrapper.deploy();
    await mockVRFWrapper.deployed();

    // Deploy NFT
    const DormintPillowsGenesis = await ethers.getContractFactory("DormintPillowsGenesis");
    const nft = <DormintPillowsGenesis>(await upgrades.deployProxy(DormintPillowsGenesis, [
      governor.address,
      mintPrice,
      mockToken.address,
      mockVRFWrapper.address
    ]));
    await nft.deployed();

    return {
      owner, governor, buyer,
      mintPrice,
      mockToken, mockVRFWrapper,
      nft
    };
  }

  describe("Deployment", function () {
    it("Should be correctly initialized", async function () {
      const {
        owner, governor,
        mintPrice,
        nft
      } = await loadFixture(prepare);

      const DEFAULT_ADMIN_ROLE = await nft.DEFAULT_ADMIN_ROLE();

      expect(await nft.name()).to.equal("Dormint Pillows Genesis");
      expect(await nft.symbol()).to.equal("DPG");
      expect(await nft.baseURI()).to.equal("https://api.dormint.io/genesis/");
      expect(await nft.contractURI()).to.equal("https://api.dormint.io/genesis/contract");

      expect(await nft.owner()).to.equal(owner.address);
      expect(await nft.hasRole(DEFAULT_ADMIN_ROLE, governor.address)).to.equal(true);
      expect(await nft.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(false);

      expect(await nft.mintPrice()).to.equal(mintPrice);
    });
  });

  describe("Mint", function () {
    it("Should correctly mint", async function () {
      const {
        buyer,
        mintPrice,
        nft
      } = await loadFixture(prepare);

      const quantity = 2;
      await nft.connect(buyer).mint(buyer.address, quantity, { value: mintPrice.mul(quantity) });

      expect(await nft.balanceOf(buyer.address)).to.equal(quantity);
      expect(await nft.ownerOf(1)).to.equal(buyer.address);
      expect(await nft.ownerOf(2)).to.equal(buyer.address);
    });
  });

  describe("Reveal", function () {
    it("Should correctly request and receive randomness", async function () {
      const {
        owner, governor,
        mockToken, mockVRFWrapper,
        nft
      } = await loadFixture(prepare);

      // Fund account with LINK token
      const ONE_LINK = ethers.utils.parseEther("1");
      await mockToken.mint(owner.address, ONE_LINK);
      await mockToken.transfer(nft.address, ONE_LINK);

      // Request randomness
      await nft.connect(governor).requestRandomness();
      expect(await mockToken.balanceOf(nft.address)).to.equal(0);

      expect(await mockVRFWrapper.lastRequestId()).to.equal(1);
      expect(await nft.randomnessRequestId()).to.equal(1);

      // Provide randomness: Simulate Chainlink
      await mockVRFWrapper.provide(nft.address, 1, [1337]);

      expect(await nft.randomWord()).to.equal(1337);
    });
  });
});
