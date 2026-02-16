# 🔄 BACKEND MIGRATION: BASE → ARBITRUM

**Untuk:** Tim Backend
**Dari:** Tim Frontend
**Urgency:** HIGH - Blocker untuk integration testing
**Estimated Time:** 10 minutes

---

## 🎯 OBJECTIVE

Migrate backend dari **Base Sepolia** ke **Arbitrum Sepolia** untuk align dengan:
- Smart Contracts (sudah deploy di Arbitrum)
- Frontend (sudah setup untuk Arbitrum)
- PRD specification (Arbitrum Buildathon)

---

## ⚠️ CURRENT STATE vs TARGET

### **Current (Base Sepolia)**
```env
CHAIN_ID=84532
RPC_URL="https://sepolia.base.org"
PROFILE_NFT_ADDRESS="0x725d729107C4bC61f3665CE1C813CbcEC7214343"
ACHIEVEMENT_NFT_ADDRESS="0x6941280D4aaFe1FC8Fe07506B50Aff541a1B8bD9"
EVENT_REGISTRY_ADDRESS="0xbb426df3f52701CcC82d0C771D6B3Ef5210db471"
```

### **Target (Arbitrum Sepolia)**
```env
CHAIN_ID=421614
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
PROFILE_NFT_ADDRESS="0xAcb9b3e8dadA2d25Db5420634Fb0eD96161824A5"
ACHIEVEMENT_NFT_ADDRESS="0xb2935413BAB7ABc75BBf1A91082b0F32cbB6E74F"
EVENT_REGISTRY_ADDRESS="0xc3a995a9756146b59Ec874bde2A326944E6F7B8E"
```

---

## 📋 MIGRATION STEPS

### **1. Update Environment Variables**

**File:** `.env` (backend root folder)

**BEFORE:**
```env
# ❌ OLD - Base Sepolia
CHAIN_ID=84532
RPC_URL="https://sepolia.base.org"
PROFILE_NFT_ADDRESS="0x725d729107C4bC61f3665CE1C813CbcEC7214343"
ACHIEVEMENT_NFT_ADDRESS="0x6941280D4aaFe1FC8Fe07506B50Aff541a1B8bD9"
EVENT_REGISTRY_ADDRESS="0xbb426df3f52701CcC82d0C771D6B3Ef5210db471"

# Faucet (Base)
FAUCET_RPC_URL="https://base-sepolia.g.alchemy.com/v2/zLbuFi4TN6im35POeM45p"
```

**AFTER:**
```env
# ✅ NEW - Arbitrum Sepolia
CHAIN_ID=421614
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
PROFILE_NFT_ADDRESS="0xAcb9b3e8dadA2d25Db5420634Fb0eD96161824A5"
ACHIEVEMENT_NFT_ADDRESS="0xb2935413BAB7ABc75BBf1A91082b0F32cbB6E74F"
EVENT_REGISTRY_ADDRESS="0xc3a995a9756146b59Ec874bde2A326944E6F7B8E"

# Faucet (Arbitrum)
FAUCET_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
```

**Additional Contract Addresses (if needed):**
```env
# Optional - jika backend perlu interact langsung
ACCESS_CONTROL_ADDRESS="0x3518B6A434F79625011321E348d14895946e3Be9"
COSMETIC_NFT_ADDRESS="0x94777E23b8E545eC57BD84DB58e0A800E9Db5aAD"
MARKETPLACE_ADDRESS="0x786b9b1475fFB5FA79af27054C614B53Efb053de"
```

---

### **2. Update EIP-712 Domain (if hardcoded)**

**File:** `src/utils/eip712.js` or similar

**BEFORE:**
```javascript
const domain = {
  name: "RuneraProfileDynamicNFT",
  version: "1",
  chainId: 84532, // ❌ Base Sepolia
  verifyingContract: "0x725d729107C4bC61f3665CE1C813CbcEC7214343"
};
```

**AFTER:**
```javascript
const domain = {
  name: "RuneraProfileDynamicNFT",
  version: "1",
  chainId: 421614, // ✅ Arbitrum Sepolia
  verifyingContract: process.env.PROFILE_NFT_ADDRESS || "0xAcb9b3e8dadA2d25Db5420634Fb0eD96161824A5"
};
```

**Better:** Use env variables:
```javascript
const domain = {
  name: "RuneraProfileDynamicNFT",
  version: "1",
  chainId: Number(process.env.CHAIN_ID),
  verifyingContract: process.env.PROFILE_NFT_ADDRESS
};
```

---

### **3. Verify Backend Signer Role**

**Backend Signer Address:**
```
0x0246fe9B176E0225f9F5d7A2372DAc6865B55c18
```

**Check apakah address ini sudah di-grant `BACKEND_SIGNER_ROLE`:**

**Via Arbiscan (Manual Check):**
1. Go to: https://sepolia.arbiscan.io/address/0xAcb9b3e8dadA2d25Db5420634Fb0eD96161824A5#readContract
2. Find function: `hasRole`
3. Input:
   - `role`: `0x...` (BACKEND_SIGNER_ROLE bytes32 hash)
   - `account`: `0x0246fe9B176E0225f9F5d7A2372DAc6865B55c18`
4. Should return: `true`

**Via Script (Automated):**
```javascript
// check-role.js
const { ethers } = require("ethers");

const PROFILE_NFT = "0xAcb9b3e8dadA2d25Db5420634Fb0eD96161824A5";
const BACKEND_SIGNER = "0x0246fe9B176E0225f9F5d7A2372DAc6865B55c18";
const BACKEND_SIGNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BACKEND_SIGNER_ROLE"));

const provider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
const abi = ["function hasRole(bytes32 role, address account) view returns (bool)"];
const contract = new ethers.Contract(PROFILE_NFT, abi, provider);

(async () => {
  const hasRole = await contract.hasRole(BACKEND_SIGNER_ROLE, BACKEND_SIGNER);
  console.log("Has BACKEND_SIGNER_ROLE:", hasRole);
  if (!hasRole) {
    console.error("❌ Backend signer NOT granted role! Contact SC team.");
  } else {
    console.log("✅ Backend signer has correct role.");
  }
})();
```

**If role NOT granted, contact Smart Contract team:**
```
SC team needs to run:
grantRole(BACKEND_SIGNER_ROLE, 0x0246fe9B176E0225f9F5d7A2372DAc6865B55c18)
```

---

### **4. Update Faucet Logic (if applicable)**

**Faucet Amount:**
- Arbitrum gas fees lebih murah dari Base
- Bisa turunkan dari `0.0005 ETH` → `0.003 ETH`

```env
FAUCET_AMOUNT_ETH="0.003"
```

**Faucet Wallet Balance:**
- Pastikan `FUNDER_PRIVATE_KEY` wallet punya saldo di **Arbitrum Sepolia**
- Request testnet ETH: https://faucet.arbitrum.io/

---

### **5. Test Connection**

**Quick Test Script:**
```javascript
// test-arbitrum-connection.js
const { ethers } = require("ethers");

const RPC = "https://sepolia-rollup.arbitrum.io/rpc";
const PROFILE_NFT = "0xAcb9b3e8dadA2d25Db5420634Fb0eD96161824A5";

(async () => {
  console.log("Testing Arbitrum Sepolia connection...");

  const provider = new ethers.JsonRpcProvider(RPC);

  // 1. Check network
  const network = await provider.getNetwork();
  console.log("Network:", network);
  console.log("Chain ID:", Number(network.chainId));

  if (Number(network.chainId) !== 421614) {
    console.error("❌ Wrong chain! Expected 421614 (Arbitrum Sepolia)");
    return;
  }

  // 2. Check contract exists
  const code = await provider.getCode(PROFILE_NFT);
  if (code === "0x") {
    console.error("❌ Contract not found at", PROFILE_NFT);
    return;
  }

  console.log("✅ Connected to Arbitrum Sepolia");
  console.log("✅ ProfileNFT contract found");
})();
```

**Run:**
```bash
node test-arbitrum-connection.js
```

---

### **6. Database Migration (if needed)**

**Check if any data tied to chain-specific info:**

```sql
-- Check for Base-specific transaction hashes
SELECT * FROM runs WHERE onchain_tx_hash IS NOT NULL LIMIT 10;
SELECT * FROM achievements WHERE tx_hash IS NOT NULL LIMIT 10;

-- If data exists, decide:
-- Option A: Keep old data, mark as "archived"
-- Option B: Clear test data (if pure testing)
```

**If clearing test data:**
```bash
# Backup first!
pg_dump runera > backup_before_migration.sql

# Then reset (if safe):
npx prisma migrate reset
```

---

### **7. Restart Backend**

```bash
# Stop backend
# Update .env
# Restart
npm run dev
# or
node src/server.js
```

**Check logs for:**
```
✅ Connected to Arbitrum Sepolia (Chain ID: 421614)
✅ ProfileNFT: 0xAcb9b3e8dadA2d25Db5420634Fb0eD96161824A5
✅ Backend signer: 0x0246fe9B176E0225f9F5d7A2372DAc6865B55c18
```

---

## ✅ VERIFICATION CHECKLIST

After migration, verify:

- [ ] `.env` updated with Arbitrum addresses
- [ ] `CHAIN_ID=421614`
- [ ] Backend starts without errors
- [ ] Can connect to Arbitrum RPC
- [ ] Can read from ProfileNFT contract
- [ ] Backend signer has `BACKEND_SIGNER_ROLE`
- [ ] Faucet wallet has Arbitrum Sepolia ETH
- [ ] EIP-712 signatures use correct chainId (421614)

**Test Endpoints:**
```bash
# Health check
curl http://localhost:4000/health

# Should return chainId: 421614
curl http://localhost:4000/health -v
```

---

## 🆘 TROUBLESHOOTING

### **Error: "execution reverted" when calling contract**
- ✅ Check contract address is correct
- ✅ Check you're on right chain (421614)
- ✅ Verify contract exists on Arbiscan

### **Error: "insufficient funds"**
- ✅ Funder wallet needs Arbitrum Sepolia ETH
- ✅ Get from: https://faucet.arbitrum.io/

### **Error: "signer not authorized"**
- ✅ Backend signer address NOT granted role
- ✅ Contact SC team to grant `BACKEND_SIGNER_ROLE`

### **Error: "wrong chainId in signature"**
- ✅ EIP-712 domain still using 84532
- ✅ Update to 421614

---

## 📞 CONTACT

**Questions?**
- Frontend Team: [Your Contact]
- Smart Contract Team: [SC Contact]

**Arbitrum Sepolia Resources:**
- RPC: https://sepolia-rollup.arbitrum.io/rpc
- Explorer: https://sepolia.arbiscan.io/
- Faucet: https://faucet.arbitrum.io/
- ChainID: 421614

---

## 📊 SUMMARY OF CHANGES

| Item | Before (Base) | After (Arbitrum) |
|------|---------------|------------------|
| Chain ID | 84532 | 421614 |
| RPC URL | sepolia.base.org | sepolia-rollup.arbitrum.io/rpc |
| Explorer | basescan.org | arbiscan.io |
| ProfileNFT | 0x725d7291... | 0xAcb9b3e8... |
| AchievementNFT | 0x6941280D... | 0xb2935413... |
| EventRegistry | 0xbb426df3... | 0xc3a995a9... |

---

**Terima kasih!** 🚀

Setelah migration selesai, **notify Frontend team** untuk start integration testing.
