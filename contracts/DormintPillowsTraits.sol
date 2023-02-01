// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFV2WrapperInterface.sol";

contract DormintPillowsTraits is Initializable, OwnableUpgradeable {
    /** ENUMs & STRUCTs */
    enum PillowMouth { Happy, Confused, Sleepy, ExtremelyHappy, Neutral, Yawning, Satisfied, Surprised }
    enum PillowEyes { Happy, Confused, Sleepy, Closed, HalfAwake, Suspicious, Reflective, Winking }
    enum PillowPattern { XmasTrees, Leaves, Fishes, Cats, Owls, GeometricShapes, Giraffes, Bears }
    enum PillowRarity { Common, Uncommon, Rare, Epic, Legendary }
    enum PillowShape { Square, Circle, Triangle }
    enum PillowPompom { None, Type1, Type2, Type3 }
    enum PillowAnimal { None, Cat, Dog, Bird, Panda, Zebra }

    struct PillowTraits {
        PillowMouth mouth;
        PillowEyes eyes;
        PillowPattern pattern;
        PillowRarity rarity;
        PillowShape shape;
        PillowPompom pompom;
        PillowAnimal animal;
    }

    /** --- BEGIN: V1 Storage Layout --- */
    // Chainlink VRF
    LinkTokenInterface public LINK;
    VRFV2WrapperInterface public VRF_V2_WRAPPER;
    uint256 public randomnessRequestId;
    uint256 public randomWord;
    /** --- END: V1 Storage Layout --- */

    /** INITIALIZATION */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address link_, address vrfV2Wrapper_) public initializer {
        __Ownable_init();

        LINK = LinkTokenInterface(link_);
        VRF_V2_WRAPPER = VRFV2WrapperInterface(vrfV2Wrapper_);
    }

    /** PUBLIC SETTERS */
    function requestRandomness() external onlyOwner {
        require(randomWord == 0, "Randomness was already persisted");
        uint32 callbackGasLimit = 300000;
        uint16 requestConfirmations = 5;
        uint32 numWords = 1;
        LINK.transferAndCall(
            address(VRF_V2_WRAPPER),
            VRF_V2_WRAPPER.calculateRequestPrice(callbackGasLimit),
            abi.encode(callbackGasLimit, requestConfirmations, numWords)
        );
        randomnessRequestId = VRF_V2_WRAPPER.lastRequestId();
    }

    function rawFulfillRandomWords(uint256 requestId_, uint256[] memory randomWords_) external {
        require(_msgSender() == address(VRF_V2_WRAPPER), "Only VRF V2 wrapper can fulfill");
        require(requestId_ == randomnessRequestId, "Wrong requestId");
        randomWord = randomWords_[0];
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(_msgSender()).transfer(balance);
    }

    function rescueFunds(address token_) external onlyOwner {
        IERC20Upgradeable token = IERC20Upgradeable(token_);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(_msgSender(), balance);
    }

    /** PUBLIC GETTERS */
    function getTraits(uint256 tokenId_) external view returns (bool available, PillowTraits memory traits) {
        traits = PillowTraits(
            PillowMouth(0),
            PillowEyes(0),
            PillowPattern(0),
            PillowRarity(0),
            PillowShape(0),
            PillowPompom(0),
            PillowAnimal(0)
        );

        // If there is no provided randomness, return unavailable traits
        if (randomWord == 0) {
            return (false, traits);
        }

        available = true;

        uint256 probabilityBase = 100;

        /** RARITY */
        // Rarity probability: 60%, 20%, 10%, 7%, 3%
        uint8[5] memory rarityProbability = [0, 60, 80, 90, 97];

        uint256 randomWordByTokenId = uint256(keccak256(abi.encodePacked(randomWord, tokenId_)));

        uint256 rarityRandom = randomWordByTokenId % probabilityBase;
        {
            // Default rarity: Legendary
            uint256 rarityIndex = uint256(PillowRarity.Legendary);
            // Check rarityRandom against probability and assign rarity index
            for (uint256 i = 0; i < rarityProbability.length - 1; i++) {
                if (rarityProbability[i] <= rarityRandom && rarityRandom < rarityProbability[i + 1]) {
                    rarityIndex = i;
                    break;
                }
            }

            traits.rarity = PillowRarity(rarityIndex);
        }

        /** MOUTH */
        // Offset random word
        randomWordByTokenId = randomWordByTokenId / probabilityBase;
        probabilityBase = uint8(PillowMouth.Surprised) + 1;
        {
            uint256 mouthIndex = randomWordByTokenId % probabilityBase;
            traits.mouth = PillowMouth(mouthIndex);
        }

        /** EYES */
        // Offset random word
        randomWordByTokenId = randomWordByTokenId / probabilityBase;
        probabilityBase = uint8(PillowEyes.Winking) + 1;
        {
            uint256 eyesIndex = randomWordByTokenId % probabilityBase;
            traits.eyes = PillowEyes(eyesIndex);
        }

        /** PATTERN */
        // Offset random word
        randomWordByTokenId = randomWordByTokenId / probabilityBase;
        probabilityBase = uint8(PillowPattern.Bears) + 1;
        {
            uint256 patternIndex = randomWordByTokenId % probabilityBase;
            traits.pattern = PillowPattern(patternIndex);
        }

        /** SHAPE */
        // Offset random word
        randomWordByTokenId = randomWordByTokenId / probabilityBase;
        probabilityBase = uint8(PillowShape.Triangle) + 1;
        {
            uint256 shapeIndex = randomWordByTokenId % probabilityBase;
            traits.shape = PillowShape(shapeIndex);
        }

        /** POMPOM */
        // Offset random word
        randomWordByTokenId = randomWordByTokenId / probabilityBase;
        probabilityBase = uint8(PillowPompom.Type3);
        if (
            traits.rarity == PillowRarity.Rare ||
            traits.rarity == PillowRarity.Epic ||
            traits.rarity == PillowRarity.Legendary
        ) {
            uint256 pompomIndex = randomWordByTokenId % probabilityBase;
            traits.pompom = PillowPompom(pompomIndex + 1);
        }

        /** ANIMAL */
        // Offset random word
        randomWordByTokenId = randomWordByTokenId / probabilityBase;
        probabilityBase = uint8(PillowAnimal.Zebra);
        if (
            traits.rarity == PillowRarity.Epic ||
            traits.rarity == PillowRarity.Legendary
        ) {
            uint256 animalIndex = randomWordByTokenId % probabilityBase;
            traits.animal = PillowAnimal(animalIndex + 1);
        }
    }
}
