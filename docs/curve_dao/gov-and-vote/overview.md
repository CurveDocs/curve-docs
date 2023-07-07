# **The Curve DAO: Governance and Voting**  

Curve uses [Aragon](https://aragon.org/) for governance and control of the protocol admin functionality. Interaction with Aragon occurs through a [modified implementation](https://github.com/curvefi/curve-aragon-voting) of the Aragon [Voting App](https://github.com/aragon/aragon-apps/tree/master/apps/voting).

Much of the following functionality is possible via the [DAO section](https://dao.curve.fi/dao) of the Curve website. The following section outlines DAO interactions via the CLI using the Brownie console.

Deployment addresses can be found in the addresses reference section of the documentation.


## **Creating a Vote**
A single vote can perform multiple actions. The [new_vote.py](https://github.com/curvefi/curve-dao-contracts/blob/master/scripts/voting/new_vote.py) script in the DAO repo is used to create new votes.

1. Modify the `TARGET`, `ACTIONS` and `DESCRPTION` variables at the beginning of the script. The comments within the script explain how each of these variables work.  

2. Simulate the vote in a forked mainnet:
    ```shell
    >>> brownie run voting/new_vote simulate --network mainnet-fork
    ```

    The simulation creates the vote, votes for it until quorum is reached, and then executes. The vote was successful if none of the transactions within the simulation fail. You can optionally include the `-I` flag to inspect the result of the vote once the simulation completes.

3. Create the vote:

    1. Modify the `SENDER` variable to use an account that is permitted to make a vote for the DAO you are targetting.

    2. Create the vote with the following command:
    ```shell
    >>> brownie run voting/new_vote make_vote --network mainnet
    ```
    3. The vote should automatically appear within the site UX shortly.


## **Inspecting Votes**
The [decode_vote.py](https://github.com/curvefi/curve-dao-contracts/blob/master/scripts/voting/new_vote.py) script in the DAO repo is used to decode a vote in order to see which action(s) it will perform.

To use the script, start by modifying the `VOTE_ID` and `VOTING_ADDRESS` variables at the start of the script. Then run the following:  
    ```shell
    >>> brownie run voting/decode_vote --network mainnet
    ```

The script will output a list of transactions to be performed by the vote.


## **Voting**
To place a vote via the CLI, first open a Brownie console connected to mainnet. Then use the following commands:  
    ```shell
    >>> aragon = Contract(VOTING_ADDRESS)
    >>> aragon.vote(VOTE_ID, MY_VOTE, False, {'from': acct})
    Transaction sent: 0xa791801ccc57ad4edcfcaff7b5dab1c9101b78cf978a8d7fc185d9194bd3c2fa
    Gas price: 20.0 gwei   Gas limit: 156299   Nonce: 23
    ```
    
:   `VOTING_ADDRESS` is the address that is being voted with  
:   `VOTE_ID` is the numeric ID of the vote  
:   `MY_VOTE` is a boolean  


## **Executing a Vote**
To execute a vote via the CLI, first open a Brownie console connected to mainnet. Then use the following commands:
    ```shell
    >>> aragon = Contract(VOTING_ADDRESS)
    >>> aragon.executeVote({'from': acct})
    Transaction sent: 0x85d9194bd3c2fa1801ccc57ad4edcfa7978a8d7fc1caff7b5dab1c9101b78cf9
    Gas price: 20.0 gwei   Gas limit: 424912   Nonce: 24
    ```

:   `VOTING_ADDRESS` is the address that is being voted with  