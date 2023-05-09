// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

error RandomIpfsNft__NeedEnoughEth(uint256);
error RandomIpfsNft__WithdrawFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    enum Dog {
        Athena,
        Poseidon,
        Zeus
    }

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_VRFCoordinator;
    uint64 private immutable i_subscriptId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF Helpers
    mapping(uint256 => address) private s_requestIdToSender;

    // NFT Variables
    mapping(uint256 => Dog) private s_tokenIdToDog;
    uint256 private s_counter;
    uint256 public constant MAX_CHANCE_VALUE = 100;
    string[] internal s_dogTokenUris;
    uint256 internal immutable i_mintFee;

    // events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Dog dog, address minter);

    constructor(
        address _VRFCoordinator,
        uint64 _subscriptId,
        bytes32 _gasLane,
        uint32 _callbackGasLimit,
        string[3] memory _dogTokenUris,
        uint256 _mintFee
    ) VRFConsumerBaseV2(_VRFCoordinator) ERC721("Random IPFS NFT", "RIN") {
        i_VRFCoordinator = VRFCoordinatorV2Interface(_VRFCoordinator);
        i_subscriptId = _subscriptId;
        i_gasLane = _gasLane;
        i_callbackGasLimit = _callbackGasLimit;
        s_dogTokenUris = _dogTokenUris;
        i_mintFee = _mintFee;
    }

    function requestNft() public payable returns (uint256) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NeedEnoughEth(i_mintFee);
        }
        uint256 requestId = i_VRFCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
        return requestId;
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__WithdrawFailed();
        }
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address tokenOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_counter;
        s_counter += 1;
        uint256 target = randomWords[0] % MAX_CHANCE_VALUE;
        Dog dog = getNftType(target);
        _safeMint(tokenOwner, newTokenId); // reverted with reason string "ERC721: invalid token ID"
        _setTokenURI(newTokenId, s_dogTokenUris[uint256(dog)]);
        emit NftMinted(dog, tokenOwner);
    }

    function getNftType(uint256 target) public pure returns (Dog dog) {
        uint256 cumulativeSum = 0;
        uint256[3] memory array = getChanceArray();
        for (uint i = 0; i < array.length; i++) {
            if (target > cumulativeSum && target < cumulativeSum + array[i]) {
                return Dog(i);
            }
            cumulativeSum += array[i];
        }
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function mintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function dogTokenUris(uint256 index) public view returns (string memory) {
        return s_dogTokenUris[index];
    }

    function counter() public view returns (uint256) {
        return s_counter;
    }
}
