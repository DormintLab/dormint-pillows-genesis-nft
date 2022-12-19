// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFV2WrapperInterface.sol";

/// @custom:security-contact info@domint.io
contract DormintPillowsGenesis is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721RoyaltyUpgradeable, OwnableUpgradeable, AccessControlUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    /** CONSTANTS */
    uint256 public constant ROYALTY_FEE_BASE = 10000;
    uint256 public constant ROYALTY_FEE_MAX = 1000;
    uint256 public constant TOTAL_TO_MINT = 1000;

    /** --- BEGIN: V1 Storage Layout --- */
    // NFT Logic
    CountersUpgradeable.Counter private _tokenIdCounter;
    string public baseURI;
    // Purchasing
    uint256 public mintPrice;
    // Whitelists
    // TODO: bool public whitelistOnly;
    // TODO: Whitelist 
    // Chainlink VRF
    LinkTokenInterface internal LINK;
    VRFV2WrapperInterface internal VRF_V2_WRAPPER;
    uint256 public randomnessRequestId;
    uint256 public randomWord;
    /** --- END: V1 Storage Layout --- */

    /** INITIALIZATION */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address governor_,
        uint256 mintPrice_,
        address link_,
        address vrfV2Wrapper_
    ) initializer public {
        __ERC721_init("Dormint Pillows Genesis", "DPG");
        __ERC721Enumerable_init();
        __ERC721Royalty_init();
        __AccessControl_init();
        __Ownable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, governor_);

        mintPrice = mintPrice_;
        baseURI = "https://api.dormint.io/genesis/";

        LINK = LinkTokenInterface(link_);
        VRF_V2_WRAPPER = VRFV2WrapperInterface(vrfV2Wrapper_);
    }

    /** PUBLIC / EXTERNAL GETTERS */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721RoyaltyUpgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function contractURI() external view returns (string memory) {
        return string(abi.encodePacked(_baseURI(), "contract"));
    }

    /** PUBLIC / EXTERNAL SETTERS */
    function setMintPrice(uint256 mintPrice_) public onlyRole(DEFAULT_ADMIN_ROLE) {
        mintPrice = mintPrice_;
    }

    function setOwner(address newOwner_) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newOwner_ != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner_);
    }

    function setBaseURI(string memory baseURI_) public onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = baseURI_;
    }

    function setRoyaltyInfo(address receiver_, uint96 feeNumerator_) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _setDefaultRoyalty(receiver_, feeNumerator_);
    }

    receive() external payable {}

    function mint(address receiver_, uint256 quantity_) public payable {
        uint256 totalToPay = quantity_ * mintPrice;

        require(totalSupply() + quantity_ <= TOTAL_TO_MINT, "Quantity exceeds allowed");
        require(msg.value >= totalToPay, "Not enough tokens for purchase");

        // TODO: Check whitelists

        for (uint256 index = 0; index < quantity_; index++) {
            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();
            _safeMint(receiver_, tokenId);
        }
    }

    function withdraw() public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        payable(_msgSender()).transfer(balance);
    }

    function rescueFunds(address token_) public onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20Upgradeable token = IERC20Upgradeable(token_);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(_msgSender(), balance);
    }

    function requestRandomness() public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(randomWord == 0, "Randomness was already persisted");
        uint32 callbackGasLimit = 100000;
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

    /** PRIVATE / INTERNAL GETTERS */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721Upgradeable, ERC721RoyaltyUpgradeable) {
        super._burn(tokenId);
    }

    /** PRIVATE / INTERNAL SETTERS */
}
