// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

error ERC721Metadata__URI_QueryFor_NonExistentToken();

contract DynamicSvgNft is ERC721 {
    uint256 private s_tokenId;
    string private i_lowSvg;
    string private i_highSvg;
    mapping(uint256 => int256) private s_valueToTokenId;
    AggregatorV3Interface internal immutable i_priceFeed;

    event CreateNft(uint256 indexed tokenId, int256 value);

    constructor(
        address priceFeedAddress,
        string memory _lowSvg,
        string memory _highSvg
    ) ERC721("Dynamic SVG NFT", "DSN") {
        s_tokenId = 0;
        i_lowSvg = svgToImageUri(_lowSvg);
        i_highSvg = svgToImageUri(_highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function svgToImageUri(
        string memory svg
    ) public pure returns (string memory) {
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );
        return string(abi.encodePacked(baseURL, svgBase64Encoded));
    }

    function mintNft(int256 value) public {
        uint256 _tokenId = s_tokenId;
        s_valueToTokenId[_tokenId] = value;
        _safeMint(msg.sender, _tokenId);
        s_tokenId += 1;
        emit CreateNft(_tokenId, value);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory URI) {
        if (!_exists(tokenId)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }
        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = i_lowSvg;
        if (price > s_valueToTokenId[tokenId]) {
            imageURI = i_highSvg;
        }

        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(), // You can add whatever name here
                                '", "description":"An NFT that changes based on the Chainlink Feed", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
