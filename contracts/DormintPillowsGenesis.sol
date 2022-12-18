// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

/// @custom:security-contact info@domint.io
contract DormintPillowsGenesis is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721RoyaltyUpgradeable, OwnableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    /** CONSTANTS */
    uint256 public constant ROYALTY_FEE_BASE = 10000;
    uint256 public constant ROYALTY_FEE_MAX = 1000;
    uint256 public constant TOTAL_TO_MINT = 1000;

    /** --- BEGIN: V1 Storage Layout --- */
    // NFT Logic
    CountersUpgradeable.Counter private _tokenIdCounter;
    string public baseURI;
    // Governance
    address public governor;
    // Purchasing
    uint256 public mintPrice;
    // Whitelists
    // TODO: bool public whitelistOnly;
    // TODO: Whitelist 
    /** --- END: V1 Storage Layout --- */

    modifier onlyGovernor() {
        require(governor == _msgSender(), "Caller is not a governor");
        _;
    }

    /** INITIALIZATION */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        uint256 mintPrice_
    ) initializer public {
        __ERC721_init("Dormint Pillows Genesis", "DPG");
        __ERC721Enumerable_init();
        __Ownable_init();

        governor = owner();

        setMintPrice(mintPrice_);
        setBaseURI("https://api.dormint.io/genesis/");
    }

    /** PUBLIC / EXTERNAL GETTERS */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721RoyaltyUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function contractURI() external view returns (string memory) {
        return string(abi.encodePacked(_baseURI(), "contract"));
    }

    /** PUBLIC / EXTERNAL SETTERS */
    function setMintPrice(uint256 mintPrice_) public onlyGovernor {
        mintPrice = mintPrice_;
    }

    function setOwner(address newOwner_) public onlyGovernor {
        require(newOwner_ != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner_);
    }

    function setGovernor(address governor_) public onlyGovernor {
        require(governor_ != address(0), "New governor is the zero address");
        governor = governor_;
    }

    function setBaseURI(string memory baseURI_) public onlyGovernor {
        baseURI = baseURI_;
    }

    function setRoyaltyInfo(address receiver_, uint96 feeNumerator_) public onlyGovernor {
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

    function withdraw() public onlyGovernor {
        uint256 balance = address(this).balance;
        payable(governor).transfer(balance);
    }

    function rescueFunds(address token_) public onlyGovernor {
        // TODO: Implement
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
