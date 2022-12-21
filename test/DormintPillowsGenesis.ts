import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

import { DormintPillowsGenesis } from './../typechain-types';

describe("DormintPillowsGenesis", function () {
  async function prepare() {
    // Define signers
    const [ owner, governor, buyerWhitelisted, buyerNotWhitelisted ] = await ethers.getSigners();

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

    // Fetch params
    const DEFAULT_ADMIN_ROLE = await nft.DEFAULT_ADMIN_ROLE();

    return {
      owner, governor, buyerWhitelisted, buyerNotWhitelisted,
      mintPrice,
      mockToken, mockVRFWrapper,
      nft,
      DEFAULT_ADMIN_ROLE
    };
  }

  describe("Deployment", function () {
    it("Should be correctly initialized", async function () {
      const {
        owner, governor,
        mintPrice,
        nft,
        DEFAULT_ADMIN_ROLE
      } = await loadFixture(prepare);

      expect(await nft.name()).to.equal("Dormint Pillows Genesis");
      expect(await nft.symbol()).to.equal("DPG");
      expect(await nft.baseURI()).to.equal("https://api.dormint.io/genesis/");
      expect(await nft.contractURI()).to.equal("https://api.dormint.io/genesis/contract");

      expect(await nft.owner()).to.equal(owner.address);
      expect(await nft.hasRole(DEFAULT_ADMIN_ROLE, governor.address)).to.equal(true);
      expect(await nft.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(false);

      expect(await nft.mintPrice()).to.equal(mintPrice);

      expect(await nft.whitelistOnly()).to.be.equal(true);
    });
  });

  describe("Mint", function () {
    it("Should correctly mint", async function () {
      const {
        governor, buyerWhitelisted,
        mintPrice,
        nft
      } = await loadFixture(prepare);

      await nft.connect(governor).addWhitelisted([ buyerWhitelisted.address ]);

      const quantity = 2;
      await nft.connect(buyerWhitelisted).mint(buyerWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });

      expect(await nft.balanceOf(buyerWhitelisted.address)).to.equal(quantity);
      expect(await nft.ownerOf(1)).to.equal(buyerWhitelisted.address);
      expect(await nft.ownerOf(2)).to.equal(buyerWhitelisted.address);
      expect(await nft.tokenURI(1)).to.equal("https://api.dormint.io/genesis/1");
      expect(await nft.tokenURI(2)).to.equal("https://api.dormint.io/genesis/2");
    });
  });

  describe("Whitelists", function () {
    it("Should correctly work", async function () {
      const {
        owner, governor, buyerWhitelisted, buyerNotWhitelisted,
        mintPrice,
        nft,
        DEFAULT_ADMIN_ROLE
      } = await loadFixture(prepare);

      // Test access reverts on addition and removal by non-governor
      await expect(
        nft.connect(owner).addWhitelisted([ ethers.constants.AddressZero ])
      ).to.be.revertedWith(`AccessControl: account ${owner.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);

      await expect(
        nft.connect(owner).removeWhitelisted([ ethers.constants.AddressZero ])
      ).to.be.revertedWith(`AccessControl: account ${owner.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);

      // Test logic on addition and removal
      await nft.connect(governor).addWhitelisted([ buyerWhitelisted.address, buyerNotWhitelisted.address ])
      
      expect(await nft.isWhitelisted(buyerWhitelisted.address)).to.equal(true);
      expect(await nft.isWhitelisted(buyerNotWhitelisted.address)).to.equal(true);
      expect(await nft.isWhitelisted(governor.address)).to.equal(false);

      await nft.connect(governor).removeWhitelisted([ buyerNotWhitelisted.address ]);

      expect(await nft.isWhitelisted(buyerNotWhitelisted.address)).to.equal(false);

      // Test mint by whitelisted and revert buy not whitelisted
      const quantity = 2;
      await nft.connect(buyerWhitelisted).mint(buyerWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });
      expect(await nft.balanceOf(buyerWhitelisted.address)).to.equal(quantity);

      await expect(
        nft.connect(buyerNotWhitelisted).mint(buyerNotWhitelisted.address, quantity, { value: mintPrice.mul(quantity) })
      ).to.be.revertedWith("Only whitelisted mint allowed now");


      // Test removal of whitelists;
      await nft.connect(governor).setWhitelistOnly(false);
      expect(await nft.whitelistOnly()).to.be.equal(false);

      await nft.connect(buyerNotWhitelisted).mint(buyerNotWhitelisted.address, quantity, { value: mintPrice.mul(quantity) });
      expect(await nft.balanceOf(buyerNotWhitelisted.address)).to.equal(quantity);
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
