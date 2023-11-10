LiquidityGauge V5 adds support for EIP-20 approvals via EIP-712 secp256k1 signatures as per [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612).

!!!deploy "Source Code"
    Source code of the LiquidityGaugeV5 can be found on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/gauges/LiquidityGaugeV5.vy).


### `permit`
!!! description "`LiquidityGaugeV5.permit(_owner: address, _spender: address, _value: uint256, _deadline: uint256, _v: uint8, _r: bytes32, _s: bytes32) -> bool:`"

    Function to approve spender by owner's signature to expend owner's tokens.

    Returns: True (`bool`),  if transaction completes successfully.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_owner` |  `address` | Owner of the funds and signer of the `permit` function |
    | `_spender` |  `address` | Address which is allowed to spend funds |
    | `_value` |  `uint256` | Amount of tokens to be spent |
    | `_deadline` |  `uint256` | Timestamp after which the Permit is no longer valid |
    | `_v` |  `uint8` | bytes[64] of the valid secp256k1 signature of permit by owner |
    | `_r` |  `bytes32` | bytes[0:32] of the valid secp256k1 signature of permit by owner |
    | `_s` |  `bytes32` | bytes[32:64] of the valid secp256k1 signature of permit by owner |


    ??? quote "Source code"

        ```python hl_lines="9"
        # keccak256("isValidSignature(bytes32,bytes)")[:4] << 224
        ERC1271_MAGIC_VAL: constant(bytes32) = 0x1626ba7e00000000000000000000000000000000000000000000000000000000
        VERSION: constant(String[8]) = "v5.0.0"

        EIP712_TYPEHASH: constant(bytes32) = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
        PERMIT_TYPEHASH: constant(bytes32) = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)")

        @external
        def permit(
            _owner: address,
            _spender: address,
            _value: uint256,
            _deadline: uint256,
            _v: uint8,
            _r: bytes32,
            _s: bytes32
        ) -> bool:
            """
            @notice Approves spender by owner's signature to expend owner's tokens.
                See https://eips.ethereum.org/EIPS/eip-2612.
            @dev Inspired by https://github.com/yearn/yearn-vaults/blob/main/contracts/Vault.vy#L753-L793
            @dev Supports smart contract wallets which implement ERC1271
                https://eips.ethereum.org/EIPS/eip-1271
            @param _owner The address which is a source of funds and has signed the Permit.
            @param _spender The address which is allowed to spend the funds.
            @param _value The amount of tokens to be spent.
            @param _deadline The timestamp after which the Permit is no longer valid.
            @param _v The bytes[64] of the valid secp256k1 signature of permit by owner
            @param _r The bytes[0:32] of the valid secp256k1 signature of permit by owner
            @param _s The bytes[32:64] of the valid secp256k1 signature of permit by owner
            @return True, if transaction completes successfully
            """
            assert _owner != ZERO_ADDRESS
            assert block.timestamp <= _deadline

            nonce: uint256 = self.nonces[_owner]
            digest: bytes32 = keccak256(
                concat(
                    b"\x19\x01",
                    self.DOMAIN_SEPARATOR,
                    keccak256(_abi_encode(PERMIT_TYPEHASH, _owner, _spender, _value, nonce, _deadline))
                )
            )

            if _owner.is_contract:
                sig: Bytes[65] = concat(_abi_encode(_r, _s), slice(convert(_v, bytes32), 31, 1))
                # reentrancy not a concern since this is a staticcall
                assert ERC1271(_owner).isValidSignature(digest, sig) == ERC1271_MAGIC_VAL
            else:
                assert ecrecover(digest, convert(_v, uint256), convert(_r, uint256), convert(_s, uint256)) == _owner

            self.allowance[_owner][_spender] = _value
            self.nonces[_owner] = nonce + 1

            log Approval(_owner, _spender, _value)
            return True
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV5.permit('todo'):
        'True'
        ```
