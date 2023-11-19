In exchange for depositing coins into a Curve pool, liquidity providers receive pool LP (liquidity pool) tokens. A Curve pool LP token is an ERC20 contract specific to the Curve pool. Hence, LP tokens are transferrable. Holders of pool LP tokens may deposit and stake the token into a pool’s liquidity gauge in order to receive CRV token rewards. 

!!!info 
    There might be some variations of LP Tokens, but the two listed above are the most recent implementations.  
    For older Curve pools the token attribute **`version`** is not always public and a getter has not been explicitly implemented.