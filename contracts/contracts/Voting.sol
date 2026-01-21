// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VotingBEM {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    address public admin;
    uint256 public candidatesCount;

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    event Voted(address indexed voter, uint256 candidateId);

    constructor(string[] memory candidateNames) {
        admin = msg.sender;

        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidatesCount++;
            candidates[candidatesCount] = Candidate(
                candidatesCount,
                candidateNames[i],
                0
            );
        }
    }

    function vote(uint256 candidateId) external {
        require(!hasVoted[msg.sender], "You have already voted");
        require(
            candidateId > 0 && candidateId <= candidatesCount,
            "Invalid candidate"
        );

        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;

        emit Voted(msg.sender, candidateId);
    }
}
