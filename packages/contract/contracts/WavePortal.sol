// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract WavePortal {
    uint256 private _totalWaves;
    uint256 private _seed;

    event NewWave(address indexed from, uint256 timestamp, string message);

    struct Wave {
        address waver;
        string message;
        uint256 timestamp;
        uint256 seed;
    }
    Wave[] _waves;

    mapping(address => uint256) public lastWavedAt;

    constructor() payable {
        console.log("Here is my first smart contract");
        _seed = (block.timestamp + block.prevrandao) % 100;
    }

    function wave(string memory _message) public {
        require(
            lastWavedAt[msg.sender] + 15 minutes < block.timestamp,
            "Wait 15m"
        );

        lastWavedAt[msg.sender] = block.timestamp;

        _totalWaves += 1;
        console.log("%s waved w/ message %s", msg.sender, _message);

        _seed = (block.prevrandao + block.timestamp + _seed) % 100;

        _waves.push(Wave(msg.sender, _message, block.timestamp, _seed));
        console.log("Random # generated: %d", _seed);

        if (_seed <= 50) {
            console.log("%s won!", msg.sender);
            uint256 prizeAmount = 0.0001 ether;
            require(
                prizeAmount <= address(this).balance,
                "Trying to withdraw more money than the contract has."
            );
            (bool success, ) = (msg.sender).call{value: prizeAmount}("");

            require(success, "Failed to withdraw money from contract");
        } else {
            console.log("%s did not win", msg.sender);
        }

        emit NewWave(msg.sender, block.timestamp, _message);
    }

    function getAllWaves() public view returns (Wave[] memory) {
        return _waves;
    }

    function getTotalWaves() public view returns (uint256) {
        return _totalWaves;
    }
}
